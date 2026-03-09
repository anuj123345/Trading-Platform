import os
from flask import Flask, request, jsonify
import pyotp
from NorenRestApiPy.NorenApi import NorenApi

app = Flask(__name__)

def get_api(payload):
    user = payload.get("user") or os.environ.get("SHOONYA_USER")
    pwd = payload.get("pwd") or os.environ.get("SHOONYA_PWD")
    api_key = payload.get("apiKey") or os.environ.get("SHOONYA_API_KEY")
    vendor = payload.get("vendorCode") or os.environ.get("SHOONYA_VENDOR_CODE")
    imei = payload.get("imei") or os.environ.get("SHOONYA_IMEI", "ABC123")
    totp_secret = payload.get("totpSecret") or os.environ.get("SHOONYA_TOTP_SECRET")
    
    if not user or not api_key:
        return None, None
        
    api = NorenApi(
        host="https://trade.shoonya.com/NorenWClientTP/",
        websocket="wss://trade.shoonya.com/NorenWSTP/"
    )
    
    otp = pyotp.TOTP(totp_secret).now() if totp_secret else "123456"
    
    resp = api.login(
        userid=user,
        password=pwd,
        twoFA=otp,
        vendor_code=vendor,
        api_secret=api_key,
        imei=imei
    )
    return api, resp

@app.route('/api/py_shoonya/account', methods=['POST', 'GET'])
def account():
    req_data = request.json or {}
    payload = req_data.get("keys", {})
    api, resp = get_api(payload)
    if not resp or resp.get("stat") != "Ok":
        error_msg = str(resp.get("emsg", "Missing Credentials or Connection Failed")) if resp else "Missing Broker Credentials."
        return jsonify({"success": False, "error": error_msg}), 400
        
    limits = api.get_limits()
    positions = api.get_positions()
    orders = api.get_order_book()
    
    return jsonify({
        "success": True,
        "data": {
            "limits": limits if isinstance(limits, dict) and limits.get("stat") == "Ok" else {},
            "positions": positions if isinstance(positions, list) else [],
            "orders": orders if isinstance(orders, list) else []
        }
    })

@app.route('/api/py_shoonya/quote', methods=['POST', 'GET'])
def quote():
    req_data = request.json or {}
    symbol = req_data.get("symbol")
    payload = req_data.get("keys", {})
    api, resp = get_api(payload)
    if not resp or resp.get("stat") != "Ok":
        return jsonify({"success": False, "error": "Shoonya Login Failed"}), 400
        
    exchange = "NSE"
    if symbol and ("NIFTY" in symbol or "BANKNIFTY" in symbol):
        exchange = "NFO"
        
    search = api.searchscrip(exchange, symbol)
    if not search or not search.get("values"):
        search = api.searchscrip("NSE", symbol)
        if search and search.get("values"):
            exchange = "NSE"
        else:
            return jsonify({"success": False, "error": f"Symbol {symbol} not found"}), 404
            
    token = search["values"][0]["token"]
    q = api.get_quotes(exchange, token)
    if q and q.get("lp"):
        return jsonify({
            "success": True, 
            "symbol": symbol,
            "mockPrice": float(q["lp"]), 
            "volume": int(q.get("v", 0))
        })
    else:
        return jsonify({"success": False, "error": "Quote returned empty"}), 500

@app.route('/api/py_shoonya/order', methods=['POST'])
def order():
    req_data = request.json or {}
    payload = req_data.get("keys", {})
    api, resp = get_api(payload)
    if not resp or resp.get("stat") != "Ok":
        return jsonify({"success": False, "error": "Missing Broker Credentials."}), 400
        
    symbol = req_data.get("symbol")
    side = req_data.get("side")
    quantity = req_data.get("quantity")
    
    # Send back mock execution success consistent with the Next.js setup
    return jsonify({
        "success": True,
        "message": f"Mock {side} order placed for {quantity} {symbol}"
    })

# Provide a root handler for Vercel just in case
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return jsonify({"success": False, "error": "Invalid Python Pipeline Target", "path": path}), 404
