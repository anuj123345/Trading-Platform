import sys
import json
import base64
import pyotp
import os
import time
from NorenRestApiPy.NorenApi import NorenApi

SESSION_CACHE_FILE = os.path.join(os.getcwd(), "storage", "shoonya_session.json")

def main():
    try:
        # Create storage dir if not exists
        os.makedirs(os.path.dirname(SESSION_CACHE_FILE), exist_ok=True)
        
        if len(sys.argv) < 2:
            print(json.dumps({"success": False, "error": "Missing payload"}))
            sys.exit(1)

        # Expect payload as base64 encoded JSON string in sys.argv[1]
        payload_str = base64.b64decode(sys.argv[1]).decode('utf-8')
        payload = json.loads(payload_str)
        
        user = payload.get("user")
        pwd = payload.get("pwd")
        api_key = payload.get("apiKey")
        vendor = payload.get("vendorCode")
        imei = payload.get("imei", "ABC123")
        totp_secret = payload.get("totpSecret")
        symbol = payload.get("symbol")
        
        if not symbol:
            print(json.dumps({"success": False, "error": "No symbol provided"}))
            sys.exit(1)

        # We need NFO or NSE based on symbol format
        exchange = "NSE"
        if "NIFTY" in symbol or "BANKNIFTY" in symbol:
            exchange = "NFO"
            
        api = NorenApi(
            host="https://trade.shoonya.com/NorenWClientTP/",
            websocket="wss://trade.shoonya.com/NorenWSTP/"
        )
        
        # Try to load cached session
        session = None
        if os.path.exists(SESSION_CACHE_FILE):
            try:
                with open(SESSION_CACHE_FILE, "r") as f:
                    cached = json.load(f)
                    # Check if it's from today (Shoonya sessions expire daily)
                    if cached.get("user") == user and cached.get("date") == time.strftime("%Y-%m-%d"):
                        session = cached.get("susertoken")
            except Exception:
                pass # Ignore cache issues

        def do_login():
            otp = pyotp.TOTP(totp_secret).now() if totp_secret else "123456"
            resp = api.login(
                userid=user,
                password=pwd,
                twoFA=otp,
                vendor_code=vendor,
                api_secret=api_key,
                imei=imei
            )
            
            if not resp or resp.get("stat") != "Ok":
                print(json.dumps({"success": False, "error": f"Shoonya Login Failed: {resp.get('emsg', 'Unknown error') if resp else 'No response'}"}))
                sys.exit(1)
            
            # Cache session
            with open(SESSION_CACHE_FILE, "w") as f:
                resp["user"] = user
                resp["date"] = time.strftime("%Y-%m-%d")
                json.dump(resp, f)
            return resp.get("susertoken")

        if session:
            api.set_session(userid=user, password=pwd, usertoken=session)
            # Validate session
            test_lmt = api.get_limits()
            if isinstance(test_lmt, dict) and test_lmt.get("stat") == "Not_Ok" and "Session Expired" in test_lmt.get("emsg", ""):
                session = do_login()
                api.set_session(userid=user, password=pwd, usertoken=session)
        else:
            session = do_login()
            api.set_session(userid=user, password=pwd, usertoken=session)
            
        # Try to resolve token
        # If symbol doesn't have exchange prefix, try to find it
        search_sym = symbol
        if "-" not in symbol and exchange == "NSE":
            search_sym = f"{symbol}-EQ"
            
        search = api.searchscrip(exchange, search_sym)
        
        # fallback if -EQ failed or was wrong
        if not search or not search.get("values"):
             search = api.searchscrip(exchange, symbol)
             
        if not search or not search.get("values"):
            # Final fallback: Try other exchange
            other_exch = "NFO" if exchange == "NSE" else "NSE"
            search = api.searchscrip(other_exch, symbol)
            if search and search.get("values"):
                exchange = other_exch
            else:
                print(json.dumps({"success": False, "error": f"Symbol {symbol} not found in {exchange} or {other_exch}. Resp: {search}"}))
                sys.exit(1)
                
        token = search["values"][0]["token"]
        
        # Get Quote
        q = api.get_quotes(exchange, token)
        if q and q.get("stat") == "Ok":
            lp = q.get("lp") or q.get("last_price") or 0
            v = q.get("v") or q.get("vol") or 0
            print(json.dumps({
                "success": True, 
                "symbol": symbol,
                "token": token,
                "price": float(lp),
                "volume": int(v)
            }))
        else:
            print(json.dumps({"success": False, "error": f"Quote for {symbol} ({token}) failed: {q}"}))
            
    except Exception as e:
        # Catch JSON errors or connection errors gracefully
        err_msg = str(e)
        if "Expecting value" in err_msg:
            err_msg = "Shoonya API returned invalid JSON. Possible rate limit or session expiry."
        print(json.dumps({"success": False, "error": err_msg}))

if __name__ == "__main__":
    main()
