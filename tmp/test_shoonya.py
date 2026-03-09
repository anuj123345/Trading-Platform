import pyotp
from NorenRestApiPy.NorenApi import NorenApi
import json

def test_login():
    # Hardcoded for test
    user = "FA176647"
    pwd = "Akb2204@123"
    api_key = "30a47ebb7f9966a401438f0e61e46c43"
    vendor = "FA176647_U"
    imei = "ABC123"
    totp_secret = "ELA4452323A4NW2IA2C7UY56I6F5B532"
    
    print(f"User: {user}")
    print(f"TOTP Secret: {totp_secret}")
    
    api = NorenApi(
        host="https://trade.shoonya.com/NorenWClientTP/",
        websocket="wss://trade.shoonya.com/NorenWSTP/"
    )
    
    otp = pyotp.TOTP(totp_secret).now() if totp_secret else "123456"
    print(f"Generated OTP: {otp}")
    
    try:
        resp = api.login(
            userid=user,
            password=pwd,
            twoFA=otp,
            vendor_code=vendor,
            api_secret=api_key,
            imei=imei
        )
        print("Login Response:", json.dumps(resp, indent=2))
    except Exception as e:
        print("Login Exception:", str(e))

if __name__ == "__main__":
    test_login()
