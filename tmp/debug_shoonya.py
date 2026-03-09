import sys
import json
import os
import time
from NorenRestApiPy.NorenApi import NorenApi

def test():
    user = "FA176647"
    pwd = "Akb2204@123"
    api_key = "30a47ebb7f9966a401438f0e61e46c43"
    vendor = "FA176647_U"
    imei = "ABC123"
    token = "2885" # RELIANCE
    
    api = NorenApi(
        host="https://trade.shoonya.com/NorenWClientTP/",
        websocket="wss://trade.shoonya.com/NorenWSTP/"
    )
    
    cache_path = os.path.join(os.getcwd(), "storage", "shoonya_session.json")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r") as f:
                cached = json.load(f)
                susertoken = cached.get("susertoken")
                cached_date = cached.get("date")
                cached_user = cached.get("user")
                
                # Shoonya sessions expire daily
                today = time.strftime("%Y-%m-%d")
                
                if cached_user == user and cached_date == today:
                    print(f"Using valid cached token for {user}: {susertoken[:10]}...")
                    api.set_session(userid=user, password=pwd, usertoken=susertoken)
                else:
                    reason = "expired" if cached_user == user else f"wrong user ({cached_user})"
                    print(f"Cache {reason} (Cached: {cached_date}, Today: {today}). Please log in again via the UI or shoonya_account.py.")
                    return
        except Exception as e:
            print(f"Error reading cache: {e}")
            return
    else:
        print("No cache found. Please log in via the UI/shoonya_account.py.")
        return

    print("Calling get_quotes...")
    try:
        q = api.get_quotes("NSE", token)
        print(f"Quote Result: {q}")
    except Exception as e:
        print(f"get_quotes Exception: {e}")

    print("Calling searchscrip...")
    try:
        s = api.searchscrip("NSE", "RELIANCE-EQ")
        print(f"Search Result: {s}")
    except Exception as e:
        print(f"searchscrip Exception: {e}")

if __name__ == "__main__":
    test()
