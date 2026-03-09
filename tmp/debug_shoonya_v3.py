import sys
import json
import os
from NorenRestApiPy.NorenApi import NorenApi

def test():
    results = {}
    user = "FA176647"
    pwd = "Akb2204@123"
    api_key = "30a47ebb7f9966a401438f0e61e46c43"
    
    api = NorenApi(
        host="https://trade.shoonya.com/NorenWClientTP/",
        websocket="wss://trade.shoonya.com/NorenWSTP/"
    )
    
    try:
        cache_path = os.path.join(os.getcwd(), "storage", "shoonya_session.json")
        with open(cache_path, "r") as f:
            cached = json.load(f)
            susertoken = cached.get("susertoken")
            api.set_session(userid=user, password=pwd, usertoken=susertoken)
            results["session"] = "Session set from cache"
    except Exception as e:
        results["session_error"] = str(e)
        with open("tmp/debug_results.json", "w") as f:
            json.dump(results, f)
        return

    # Test 1: get_limits
    try:
        results["limits"] = api.get_limits()
    except Exception as e:
        results["limits_error"] = str(e)

    # Test 2: get_quotes
    try:
        results["quotes_v1"] = api.get_quotes("NSE", "2885")
    except Exception as e:
        results["quotes_v1_error"] = str(e)

    # Test 3: searchscrip
    try:
        results["search"] = api.searchscrip("NSE", "RELIANCE-EQ")
    except Exception as e:
        results["search_error"] = str(e)
        
    # Check if NorenApi methods are as expected
    results["api_methods"] = [m for m in dir(api) if not m.startswith("_")]

    with open("tmp/debug_results.json", "w") as f:
        json.dump(results, f, indent=4)

if __name__ == "__main__":
    test()
