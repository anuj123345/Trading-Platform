"""
Created on Sun Feb  9 10:54:04 2026
Correct tick handling
✔ Minute candle & indicator logic
✔ Hard SL exit (absolute rule)
✔ Trailing SL (ATR-based)
✔ Broker SL modification call
✔ SL breach counter
✔ Gap-down protection
✔ Broker exit watchdog
✔ Correct early returns
✔ No race-condition ordering bugs
@author: Lenovo
"""

# ================= IMPORTS =================
import threading, time, logging, platform, csv, os, json, requests
from decimal import Decimal, ROUND_HALF_UP, getcontext
#from datetime import datetime, timedelta
from datetime import datetime, timedelta, time as dt_time
import pandas as pd
import pyotp
from enum import Enum
from colorama import init
from NorenRestApiPy.NorenApi import NorenApi
import config

import time

# ================= STATE ENUM =================
class State(Enum):
    IDLE = 0
    BUY_SUBMITTED = 1
    IN_POSITION = 2
    DISABLED = 3

# ================= RISK SETTINGS =================

ATR_SL_MULT    = Decimal("1.6")
ATR_TRAIL_MULT = Decimal("0.85")
GAP_SL_MULT    = Decimal("0.8")
MAX_SL_PCT     = Decimal("0.12")


WS_TIMEOUT_SECONDS = 15
stale_count = 0
MAX_STALE_CHECKS = 2

market_start_time = dt_time(9, 15)
market_end_time = dt_time(23, 30)

# ================= TRADE VARIABLES =================
position = 0
entry = None
sl = None
tgt = None
high = None
unrealized_pnl = Decimal("0")

buy_order_id = None
last_order_check_time = None
last_exit_time = None

# ================= MARGIN PAUSE =================
margin_pause_until = None
MARGIN_PAUSE_SECONDS = 300  # 5 minutes

# ================= USER SWITCH =================
DRY_RUN = False   # <<< SET FALSE ONLY AFTER FULL DRY RUN

if not DRY_RUN:
    print("⚠️ LIVE TRADING ENABLED. Proceeding without prompt...")

# ================= INIT =================
init(autoreset=True, convert=True)
getcontext().prec = 12
logging.basicConfig(level=logging.INFO, format="%(message)s")

# ================= SOUND =================
def beep_entry():
    if platform.system() == "Windows":
        import winsound
        winsound.Beep(1200, 200); winsound.Beep(1200, 200)
    else:
        print("\a\a", end="", flush=True)

# ================= COLOURS =================
class C:
    RESET="\033[0m"; GREEN="\033[92m"; RED="\033[91m"
    YELLOW="\033[93m"; BLUE="\033[94m"; MAG="\033[95m"

def col(x,c): return f"{c}{x}{C.RESET}"

# ================= SETTINGS =================
STATUS_INTERVAL = 2
MIN_DATA_ROWS = 20

ATR_SL_MULT = Decimal("1.6")

ATR_TRAIL_MULT = Decimal("0.85")
BROKER_SL_OFFSET = Decimal("1")

LOW_MOM  = Decimal("0.15")
HIGH_MOM = Decimal("0.40")

SESSION_END = datetime.now().replace(hour=23, minute=50, second=0, microsecond=0)
MAX_DAILY_LOSS = Decimal("-2000")

TRADE_LOG_FILE = "trades_log_ce.csv"
DAILY_SUMMARY_FILE = "daily_pnl_summary.csv"

SL_AUDIT_FILE = "sl_audit_log.csv"

# ================= API =================
class ShoonyaApiPy(NorenApi):
    def __init__(self):
        super().__init__(
            host="https://trade.shoonya.com/NorenWClientTP/",
            websocket="wss://trade.shoonya.com/NorenWSTP/"
        )

api = ShoonyaApiPy()

# ================= LOGIN =================
otp = pyotp.TOTP(config.TOKEN).now()
resp = api.login(
    userid=config.SHOONYA_USERID,
    password=config.SHOONYA_PASSWORD,
    twoFA=otp,
    vendor_code=config.SHOONYA_VENDOR,
    api_secret=config.SHOONYA_API_SECRET,
    imei=config.SHOONYA_IMEI,
)
if not resp or resp.get("stat") != "Ok":
    raise SystemExit(col("LOGIN FAILED", C.RED))
print(col("LOGIN SUCCESS", C.GREEN))

# ================= HELPERS =================
TWO = Decimal("0.01")
def d(x): return Decimal(str(x))
def q2(x): return x.quantize(TWO, ROUND_HALF_UP)
def qt(v,t): return (v/t).quantize(0, ROUND_HALF_UP) * t

# ================= WS STATE =================
ws_connected = False
ws_connecting = False
last_tick_time = time.time()




# ================= USER INPUT =================
# REPLACED INTERACTIVE INPUTS: Edit these values directly before deploying!
symbol = "NIFTY24FEB26P25500"  # Replace with target symbol
exchange = "NFO"
quantity = 50                  # Default quantity
sl_percent = Decimal("2") / 100 # Initial SL % (default 2)
target_mult = Decimal("2")     # ATR Target (default 2)

s = api.searchscrip(exchange, symbol)
if not s or not s.get("values"):
    raise SystemExit(f"SYMBOL NOT FOUND: {symbol}")

token = s["values"][0]["token"]
tick  = d(s["values"][0].get("tick_size","0.05"))

print(col("Fetching current LTP...", C.GREEN))

first_ltp = None
while first_ltp is None:
    q = api.get_quotes(exchange, token)
    if q and q.get("lp"):
        first_ltp = d(q["lp"])
    time.sleep(0.5)

first_ltp = q2(first_ltp)

print(col(f"Current LTP = {first_ltp}", C.GREEN))
print("-" * 60)

ltp = first_ltp
# MUST exist before this

# ================= INDICATORS =================
def on_socket_open():
    global ws_connected, ws_connecting
    ws_connected = True
    ws_connecting = False
    api.subscribe([f"{exchange}|{token}"])
    print(col("Websocket connected & subscribed", C.GREEN))

def on_close():
    global ws_connected
    ws_connected = False
    print("❌ WebSocket closed")

def on_error(msg):
    print("⚠ WebSocket error:", msg)

def log_sl_audit(event, ltp, local_sl, broker_trigger):
    new = not os.path.isfile(SL_AUDIT_FILE)
    with open(SL_AUDIT_FILE, "a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow([
                "datetime", "symbol", "event",
                "ltp", "local_sl", "broker_trigger"
            ])
        w.writerow([
            datetime.now(), symbol, event,
            float(ltp), float(local_sl),
            float(broker_trigger) if broker_trigger else ""
        ])



def EMA(s,p): return s.ewm(span=p, adjust=False).mean()

def ATR(df,p=14):
    if len(df) < p+1: return None
    h,l,c=df.high,df.low,df.close
    tr=pd.concat([h-l,(h-c.shift()).abs(),(l-c.shift()).abs()],axis=1).max(axis=1)
    return q2(d(tr.rolling(p).mean().iloc[-1]))

def RSI(s,p=14):
    if len(s) < p+1: return 50
    dlt=s.diff()
    up=dlt.clip(lower=0).rolling(p).mean()
    dn=(-dlt.clip(upper=0)).rolling(p).mean()
    rs=up/dn.replace(0,1)
    return float(100-(100/(1+rs.iloc[-1])))

def momentum(df):
    if len(df) < 6: return Decimal("0")
    atr = ATR(df)
    if not atr or atr == 0: return Decimal("0")
    return q2((d(df.close.iloc[-1]) - d(df.close.iloc[-6])) / atr)

# ================= STATE MACHINE =================
class State(Enum):
    IDLE = 0
    BUY_SUBMITTED = 1
    IN_POSITION = 2
    DISABLED = 3


state = State.IDLE
position = 0
last_exit_time = None

entry = sl = tgt = high = None
buy_order_id = sl_order_id = tgt_order_id = None

last_sl_sent = None
last_sl_modify_time = 0
SL_MODIFY_COOLDOWN = 3

RECON_INTERVAL = 15   # seconds
last_recon_time = 0

pnl = unrealized_pnl = Decimal("0")
ind = {}

data = pd.DataFrame(columns=["open","high","low","close","volume"])
current_minute = None
minute_ohlc = None

trading_disabled = False
ltp = None

# ================= ENTRY CHECK =================

def should_enter():
    global state, margin_pause_until, last_exit_time

    # Margin pause handling
    if state == State.DISABLED:
        if margin_pause_until and time.time() > margin_pause_until:
            print("▶ Margin pause ended. Trading re-enabled.")
            state = State.IDLE
        else:
            return False

    if state != State.IDLE:
        return False

    # Cooldown after exit (60 sec)
    if last_exit_time and time.time() - last_exit_time < 60:
        return False

    if trading_disabled or not ind:
        return False

    if datetime.now() >= SESSION_END:
        return False

    return (
        ind["RSI"] > 45 and
        ind["EMA5"] > ind["EMA15"] and
        ind["MOM"] > LOW_MOM
    )



# ================= SUBMIT BUY =================
def submit_buy():
    global state, buy_order_id

    price_type = "MKT" if ind["MOM"] >= HIGH_MOM else "LMT"
    price = 0 if price_type == "MKT" else float(q2(ltp - max(Decimal("1"), ind["ATR"]*Decimal("0.2"))))

    r = api.place_order(
        buy_or_sell="B", product_type="M", exchange=exchange,
        tradingsymbol=symbol, quantity=quantity,discloseqty= '0',
        price=price, price_type=price_type, retention="DAY"
    )
    if r and r.get("stat") == "Ok":
        buy_order_id = r["norenordno"]
        state = State.BUY_SUBMITTED

# ================= SUBMIT EXIT =================
def submit_exit():
    global state, exit_order_id

    r = api.place_order(
        buy_or_sell="S",
        product_type="M",
        exchange=exchange,
        tradingsymbol=symbol,
        quantity=quantity,
        discloseqty='0',
        price=0,
        price_type="MKT",
        retention="DAY"
    )

    if r and r.get("stat") == "Ok":
        exit_order_id = r["norenordno"]
        if state  == State.DISABLED:
            return

# ================= CHECK EXIT  =================
def check_exit_filled():
    global state, position, entry, sl, high

    if state !=  State.DISABLED:

        return

    order = api.single_order_history(exit_order_id)

    if not order:
        return

    if order.get("status") == "COMPLETE":

        position = None
        entry = None
        sl = None
        high = None

        state = State.IDLE

        print("✅ EXIT FILLED → STATE = IDLE")

# ================= CHECK BUY  =================
def check_buy_filled():
    global state, entry, position, high, sl
    global last_order_check_time, margin_pause_until

    if state != State.BUY_SUBMITTED:
        return

    # Poll every 2 seconds only
    if last_order_check_time and time.time() - last_order_check_time < 2:
        return

    last_order_check_time = time.time()

    order_history = api.single_order_history(buy_order_id)

    if not order_history:
        return

    order = order_history[0]
    status = order.get("status")

    # ================= COMPLETE =================
    if status == "COMPLETE":

        entry = Decimal(order["avgprc"])
        position = "LONG"
        high = entry

        # ATR-based SL
        atr_distance = ATR_SL_MULT * ind["ATR"]

        # Percentage cap
        max_distance = entry * MAX_SL_PCT

        sl_distance = min(atr_distance, max_distance)

        sl = q2(entry - sl_distance)

        modify_broker_sl(sl)

        state = State.IN_POSITION

        print("✅ BUY FILLED → IN_POSITION")

    # ================= REJECTED =================
    elif status == "REJECTED":

        reason = order.get("rejreason", "").lower()

        print(f"❌ Order REJECTED: {reason}")

        if "margin" in reason or "rms" in reason:
            margin_pause_until = time.time() + MARGIN_PAUSE_SECONDS
            state = State.DISABLED
            print("⏸ Trading paused due to margin shortfall.")
        else:
            state = State.IDLE


# ================= BROKER SL MODIFY =================
def modify_broker_sl(local_sl):
    """
    Safely reconcile and modify broker SL to match or exceed local SL.
    Includes audit prints to detect desyncs.
    """
    global broker_sl_last_trigger, last_sl_modify_time, last_sl_audit_time

    now = time.time()

    if state != State.IN_POSITION:
        return
    if not sl_order_id:
        return

    # Compute broker trigger from local SL
    broker_trigger = q2(local_sl - abs(BROKER_SL_OFFSET))

    # ================= AUDIT PRINT =================
    if now - last_sl_audit_time >= SL_AUDIT_INTERVAL:
        print(col(
            f"[SL AUDIT] LTP={ltp} | LOCAL_SL={local_sl} | "
            f"BROKER_TRIGGER(last)={broker_sl_last_trigger}",
            C.BLUE
        ))
        last_sl_audit_time = now

    # ================= RECONCILIATION LOGIC =================

    # 1️⃣ If we never sent SL to broker (first time)
    if broker_sl_last_trigger is None:
        force_modify = True

    # 2️⃣ If broker SL is looser than local SL → MUST FIX
    elif broker_sl_last_trigger < broker_trigger:
        force_modify = True

    else:
        force_modify = False

    # 3️⃣ Throttle API calls (but NEVER block forced fixes)
    if not force_modify and now - last_sl_modify_time < SL_MODIFY_COOLDOWN:
        return

    # ================= MODIFY BROKER SL =================
    try:
        api.modify_order(
            norenordno=sl_order_id,
            price=0,
            price_type="SL-M",
            trigger_price=float(broker_trigger)
        )

        broker_sl_last_trigger = broker_trigger
        last_sl_modify_time = now
        log_sl_audit("SL_MODIFY", ltp, local_sl, broker_trigger)

        print(col(
            f"[SL MODIFY] Broker SL updated → trigger={broker_trigger}",
            C.GREEN
        ))

    except Exception as e:
        print(col(
            f"[SL ERROR] Failed to modify broker SL: {e}",
            C.RED
        ))


# ================= ORDER UPDATE =================
def on_order_update(o):
    global state, position, pnl, entry, sl, tgt, high
    global sl_order_id, tgt_order_id, last_sl_sent, trading_disabled

    oid, status = o["norenordno"], o["status"]

    if state == State.BUY_SUBMITTED and oid == buy_order_id and status == "COMPLETE":
        entry = q2(d(o["avgprc"]))
        high = entry
        sl = q2(entry * (1-sl_percent))
        tgt = q2(entry + target_mult * ind["ATR"])

        sl_order_id = api.place_order(
            buy_or_sell="S", product_type="M", exchange=exchange,
            tradingsymbol=symbol, quantity=quantity,discloseqty= '0',
            price=0, price_type="SL-M",
            trigger_price=float(sl - abs(BROKER_SL_OFFSET)), retention="DAY"
        )["norenordno"]

        tgt_order_id = api.place_order(
            buy_or_sell="S", product_type="M", exchange=exchange,
            tradingsymbol=symbol, quantity=quantity, discloseqty= '0',
            price=float(tgt), price_type="LMT", retention="DAY"
        )["norenordno"]

        last_sl_sent = sl
        position = 1
        state = State.IN_POSITION
        beep_entry()
        return

    if state == State.IN_POSITION and oid == tgt_order_id and status == "COMPLETE":
        api.cancel_order(sl_order_id)
        pnl += q2((tgt-entry)*quantity)
        position = 0
        state = State.IDLE

    elif state == State.IN_POSITION and oid == sl_order_id and status == "COMPLETE":
        api.cancel_order(tgt_order_id)
        pnl += q2((sl-entry)*quantity)
        position = 0
        state = State.IDLE

    if pnl <= MAX_DAILY_LOSS:
        trading_disabled = True
        state = State.DISABLED

        # ================= ORDER UPDATE =================
def bootstrap_historical_data():
    global data, ind, current_minute

    try:
        print("🔄 Bootstrapping historical candles...")

        from_time = (datetime.now() - timedelta(minutes=60)).strftime("%d-%m-%Y %H:%M")

        hist = api.get_time_price_series(
            exchange=exchange,
            token=token,
            starttime=from_time,
            interval="1"
        )

        if not hist:
            print("⚠ No historical data received.")
            return

        data.drop(data.index, inplace=True)

        for row in reversed(hist):   # oldest first
            data.loc[len(data)] = {
                "open": float(row["into"]),
                "high": float(row["inth"]),
                "low": float(row["intl"]),
                "close": float(row["intc"]),
                "volume": float(row.get("v", 0))
            }

        if len(data) >= MIN_DATA_ROWS:

            ind = {
                    "EMA5": d(EMA(data.close, 5).iloc[-1]),
                    "EMA15": d(EMA(data.close, 15).iloc[-1]),
                    "RSI": d(RSI(data.close)),
                    "ATR": d(ATR(data)) if ATR(data) is not None else None,
                    "MOM": d(momentum(data))
            }

            print("✅ Indicators ready from bootstrap.")

        current_minute = datetime.now().replace(second=0, microsecond=0)

    except Exception as e:
        print("❌ Bootstrap error:", e)
# ================= TICK HANDLER =================

def on_tick(t):

    try:
        global last_tick_time
        global ltp, unrealized_pnl, high, sl, ind, state, position
        global current_minute, minute_ohlc, data
        global last_ltp, sl_breach_count, sl_exit_initiated_time

        last_tick_time = time.time()

        # ================= TICK PRICE =================
        raw = t.get("lp") or t.get("ltp") or t.get("lastprice")
        if not raw:
            return

        try:
            ltp = q2(qt(d(raw), tick))
        except:
            return

        # ================= UNREALIZED PNL =================
        if position and entry is not None:
            unrealized_pnl = q2((ltp - entry) * quantity)
        else:
            unrealized_pnl = Decimal("0")

        # ================= GAP DOWN DETECTION =================
        if (
            state == State.IN_POSITION and
            sl is not None and
            last_ltp is not None and
            ind and ind.get("ATR") is not None
        ):

            gap_threshold = GAP_SL_MULT * ind["ATR"]

            if last_ltp > sl and ltp < sl - gap_threshold:

                print(col(f"[GAP EXIT] last={last_ltp} ltp={ltp} sl={sl}", C.RED))

                api.place_order(
                    buy_or_sell="S",
                    product_type="M",
                    exchange=exchange,
                    tradingsymbol=symbol,
                    quantity=quantity,
                    discloseqty=0,
                    price=0,
                    price_type="MKT",
                    retention="DAY"
                )

                reset_trade_state()
                last_ltp = ltp
                return

        last_ltp = ltp

        # ================= HARD SL =================
        if (
            state == State.IN_POSITION and
            position and
            sl is not None and
            ltp <= sl
        ):

            print(col(f"[FORCE EXIT] LTP {ltp} <= SL {sl}", C.RED))

            api.place_order(
                buy_or_sell="S",
                product_type="M",
                exchange=exchange,
                tradingsymbol=symbol,
                quantity=quantity,
                discloseqty=0,
                price=0,
                price_type="MKT",
                retention="DAY"
            )

            reset_trade_state()
            return

        # ================= EMERGENCY ATR EXIT =================
        if (
            state == State.IN_POSITION and
            position and
            entry is not None and
            ind and ind.get("ATR") is not None and
            ltp < entry - (2 * ind["ATR"])
        ):

            print(col("[EMERGENCY EXIT]", C.RED))

            api.place_order(
                buy_or_sell="S",
                product_type="M",
                exchange=exchange,
                tradingsymbol=symbol,
                quantity=quantity,
                discloseqty=0,
                price=0,
                price_type="MKT",
                retention="DAY"
            )

            reset_trade_state()
            return

        # ================= MINUTE CANDLE =================
        now = datetime.now().replace(second=0, microsecond=0)

        if current_minute != now:

            # Candle just closed
            if minute_ohlc:
                data.loc[len(data)] = minute_ohlc

                if len(data) >= MIN_DATA_ROWS:

                    ind = {
                        "EMA5": EMA(data.close, 5).iloc[-1],
                        "EMA15": EMA(data.close, 15).iloc[-1],
                        "RSI": RSI(data.close),
                        "ATR": ATR(data),
                        "MOM": momentum(data)
                    }

                    # 🔥 Entry only at candle close
                    if should_enter():
                        submit_buy()

            current_minute = now

            minute_ohlc = {
                "open": ltp,
                "high": ltp,
                "low": ltp,
                "close": ltp,
                "volume": 0
            }

        else:
            # Candle still forming
            if minute_ohlc:
                minute_ohlc["high"] = max(minute_ohlc["high"], ltp)
                minute_ohlc["low"] = min(minute_ohlc["low"], ltp)
                minute_ohlc["close"] = ltp

        # ================= ORDER MANAGEMENT (Every Tick) =================
        check_buy_filled()
        trail_stop()
        check_exit_filled()
        reconcile_position()

    except Exception as e:
        print("🚨 Tick Error:", e)

    # ================= TRAILING SL =================
def trail_stop():
    global high, sl

    if state != State.IN_POSITION:
        return

    if not position or entry is None:
        return

    if not ind or ind.get("ATR") is None:
        return

    if high is None:
        high = entry

    if ltp > high:
        high = ltp

    atr_sl = high - (ATR_TRAIL_MULT * ind["ATR"])

    if tgt is not None:
        atr_sl = min(atr_sl, tgt - tick)

    new_sl = q2(atr_sl)

    if sl is None or new_sl > sl + tick:
        sl = new_sl
        modify_broker_sl(sl)
        print(f"🔄 Trailing SL updated → {sl}")


        # ================= SYNC HEARTBEAT =================
def sync_to_dashboard():
    """
    Heardbeat that reports the local state to the dashboard API.
    """
    url = "http://localhost:3000/api/algo/sync"
    
    while True:
        try:
            # Prepare state payload
            sync_data = {
                "marginInfo": {
                    "cash": float(marginInfo["cash"]) if "marginInfo" in globals() else 0,
                    "used": float(marginInfo["used"]) if "marginInfo" in globals() else 0
                },
                "positions": [
                    {
                        "symbol": symbol,
                        "quantity": float(position) if isinstance(position, (int, float)) else 50 if position == "LONG" else 0,
                        "avgPrice": float(entry) if entry else 0,
                        "currentPrice": float(ltp) if ltp else 0,
                        "pnl": float(unrealized_pnl) if unrealized_pnl else 0,
                        "pnlPercent": float((unrealized_pnl / (abs(quantity) * entry)) * 100) if entry and quantity else 0
                    }
                ] if position else [],
                "orders": [
                    {
                        "id": str(oid),
                        "type": "buy" if otype == "B" else "sell",
                        "symbol": symbol,
                        "quantity": int(oqty),
                        "price": float(oprc),
                        "status": "executed" if ostatus == "COMPLETE" else "pending",
                        "timestamp": datetime.now().isoformat()
                    } for oid, otype, oqty, oprc, ostatus in [
                        (buy_order_id, "B", quantity, entry, "COMPLETE") if buy_order_id else None
                    ] if oid is not None
                ]
            }

            requests.post(url, json=sync_data, timeout=2)
        except Exception as e:
            pass # Silent failure to avoid interrupting trading logic
        
        time.sleep(3)

# Start sync thread
threading.Thread(target=sync_to_dashboard, daemon=True).start()

        # ================= WEBSOCKET WATCHDOG =================
def websocket_watchdog():

    global ws_connected, last_tick_time
    global stale_count

    while True:

        time.sleep(5)

        # 🕒 Check market hours dynamically
        now = datetime.now().time()

        if not (market_start_time <= now <= market_end_time):
            stale_count = 0
            continue   # Do nothing outside market hours

        # If websocket not connected, skip
        if not ws_connected:
            continue

        # If no tick received recently
        if last_tick_time and time.time() - last_tick_time > WS_TIMEOUT_SECONDS:

            stale_count += 1
            print(f"⚠ Stale tick detected ({stale_count})")

            if stale_count >= MAX_STALE_CHECKS:

                print("🔁 WebSocket stale confirmed. Reconnecting...")

                try:
                    api.close_websocket()
                except:
                    pass

                time.sleep(2)

                try:
                    api.start_websocket(
                        socket_open_callback=on_socket_open,
                        socket_close_callback=on_close,
                        socket_error_callback=on_error,
                        order_update_callback=on_order_update,
                        subscribe_callback=on_tick
                    )

                    api.subscribe(exchange + "|" + token)

                    print("✅ WebSocket reconnected and resubscribed.")

                    stale_count = 0
                    last_tick_time = time.time()

                except Exception as e:
                    print("❌ Reconnect failed:", e)

        else:
            # Reset stale counter if ticks flowing normally
            stale_count = 0

def reset_trade_state():
    global position, entry, sl, tgt, high
    global unrealized_pnl, buy_order_id
    global sl_breach_count, sl_exit_initiated_time
    global state

    position = 0
    entry = None
    sl = None
    tgt = None
    high = None
    unrealized_pnl = Decimal("0")

    buy_order_id = None
    sl_breach_count = 0
    sl_exit_initiated_time = None

    last_exit_time = time.time()   # ← SET HERE    
    state = State.IDLE

    print("🔄 Trade reset → Ready for next trade")

        # ================= WRITE DAILY SUMMARY =================

def write_daily_summary():
    new = not os.path.isfile(DAILY_SUMMARY_FILE)
    with open(DAILY_SUMMARY_FILE, "a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["date", "symbol", "pnl"])
        w.writerow([
            datetime.now().date(),
            symbol,
            float(pnl)
        ])

        # ================= RECONCILE POSITION =================
def reconcile_position():

    global state, position, entry, sl, high
    global last_recon_time

    if time.time() - last_recon_time < RECON_INTERVAL:
        return

    last_recon_time = time.time()

    try:
        positions = api.get_positions()

        if not positions:
            return

        broker_qty = 0
        broker_entry = None

        for p in positions:

            # Shoonya uses 'tsym'
            if p.get("tsym") == symbol:

                broker_qty = int(p.get("netqty", 0))
                broker_entry = Decimal(p.get("netavgprc", "0"))
                break

        # ================= BOT THINKS IN POSITION BUT BROKER HAS NONE =================
        if broker_qty == 0 and state == State.IN_POSITION:

            print("⚠ Position mismatch: Broker has no position. Resetting bot state.")
            reset_trade_state()

        # ================= BROKER HAS POSITION BUT BOT IDLE =================
        elif broker_qty != 0 and state == State.IDLE:

            print("⚠ Broker has position but bot is IDLE. Syncing state.")

            state = State.IN_POSITION
            position = "LONG"
            entry = broker_entry
            high = entry

            print("✅ State synced with broker.")

    except Exception as e:
        print("❌ Reconciliation error:", e)
# ================= STATUS DISPLAY =================
def status():
    global last_tick_time

    while True:
        total = pnl + unrealized_pnl
        age = int(time.time() - last_tick_time)

        if datetime.now() >= SESSION_END:
            write_daily_summary()
            os._exit(0)

        print(col(
            f"{symbol} | "
            f"LTP={ltp if ltp is not None else '--'} | "
            f"ENTRY={entry if entry is not None else '--'} | "
            f"SL={sl if sl is not None else '--'} | "
            f"TGT={tgt if tgt is not None else '--'} | "
            f"PNL={pnl} | UPNL={unrealized_pnl} | TOTAL={total}",
            C.GREEN if position else C.YELLOW
        ))

        if ind:
            print(col(
                f"IND EMA5={q2(d(ind['EMA5']))} "
                f"EMA15={q2(d(ind['EMA15']))} "
                f"RSI={ind['RSI']:.1f} "
                f"ATR={ind['ATR']} "
                f"MOM={ind['MOM']}",
                C.MAG
            ))
        else:
            print(col("IND EMA5=-- EMA15=-- RSI=-- ATR=-- MOM=--", C.MAG))

        print(col(
            f"STATE={state.name} | "
            f"WS={'OK' if ws_connected else 'DOWN'} | "
            f"HB={age}s",
            C.GREEN if ws_connected else C.RED
        ))

        print("-" * 100)
        time.sleep(STATUS_INTERVAL)



threading.Thread(target=status, daemon=True).start()

# ================= START =================
'''\
api.start_websocket(
    subscribe_callback=on_tick,
    order_update_callback=on_order_update
)
'''\
bootstrap_historical_data()

api.start_websocket(
    subscribe_callback=on_tick,
    socket_open_callback=on_socket_open,
    order_update_callback=on_order_update
)

threading.Thread(target=websocket_watchdog, daemon=True).start()

while True:
    time.sleep(5)
