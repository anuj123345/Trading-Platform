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
        if len(sys.argv) < 2:
            print(json.dumps({"success": False, "error": "Missing payload"}))
            sys.exit(1)
            
        # Create storage dir if not exists
        os.makedirs(os.path.dirname(SESSION_CACHE_FILE), exist_ok=True)

        # Expect payload as base64 encoded JSON string in sys.argv[1]
        payload_str = base64.b64decode(sys.argv[1]).decode('utf-8')
        payload = json.loads(payload_str)
        
        user = payload.get("user")
        pwd = payload.get("pwd")
        api_key = payload.get("apiKey")
        vendor = payload.get("vendorCode")
        imei = payload.get("imei", "ABC123")
        totp_secret = payload.get("totpSecret")
        
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
                    # Check if it's from today
                    if cached.get("user") == user and cached.get("date") == time.strftime("%Y-%m-%d"):
                        session = cached.get("susertoken")
            except Exception:
                pass

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
            
        limits_resp = api.get_limits()
        positions_resp = api.get_positions()
        orders_resp = api.get_order_book()
        
        # Standardize returns
        limits = limits_resp if isinstance(limits_resp, dict) and (limits_resp.get("stat") == "Ok" or "net" in limits_resp) else {}
        positions = positions_resp if isinstance(positions_resp, list) else []
        orders = orders_resp if isinstance(orders_resp, list) else []
        
        print(json.dumps({
            "success": True,
            "data": {
                "limits": limits,
                "positions": positions,
                "orders": orders
            }
        }))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
