import sys
import json
import os
from NorenRestApiPy.NorenApi import NorenApi

def test():
    user = "FA176647"
    pwd = "Akb2204@123"
    api_key = "30a47ebb7f9966a401438f0e61e46c43"
    
    api = NorenApi(
        host="https://trade.shoonya.com/NorenWClientTP/",
        websocket="wss://trade.shoonya.com/NorenWSTP/"
    )
    
    cache_path = os.path.join(os.getcwd(), "storage", "shoonya_session.json")
    with open(cache_path, "r") as f:
        cached = json.load(f)
        susertoken = cached.get("susertoken")
        api.set_session(userid=user, password=pwd, usertoken=susertoken)

    print("Test 1: get_limits (Verify Session)")
    print(f"Limits: {api.get_limits()}")

    print("\nTest 2: get_quotes variation 1 (NSE, 2885)")
    print(f"Result: {api.get_quotes('NSE', '2885')}")

    print("\nTest 3: get_quotes variation 2 (exchange='NSE', token='2885')")
    try:
        print(f"Result: {api.get_quotes(exchange='NSE', token='2885')}")
    except Exception as e:
        print(f"Error: {e}")

    print("\nTest 4: get_quotes variation 3 (exch='NSE', token='2885')")
    try:
        print(f"Result: {api.get_quotes(exch='NSE', token='2885')}")
    except Exception as e:
        print(f"Error: {e}")

    print("\nTest 5: searchscrip variation 1 (NSE, RELIANCE-EQ)")
    print(f"Result: {api.get_search_precision_fill_results('NSE', 'RELIANCE-EQ') if hasattr(api, 'get_search_precision_fill_results') else 'N/A'}")
    print(f"Search Result: {api.searchscrip('NSE', 'RELIANCE-EQ')}")

if __name__ == "__main__":
    test()
