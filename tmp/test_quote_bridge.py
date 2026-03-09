import base64
import json
import subprocess

payload = {
    "user": "FA176647",
    "pwd": "Akb2204@123",
    "apiKey": "30a47ebb7f9966a401438f0e61e46c43",
    "vendorCode": "FA176647_U",
    "imei": "ABC123",
    "totpSecret": "ELA4452323A4NW2IA2C7UY56I6F5B532",
    "symbol": "RELIANCE"
}

payload_b64 = base64.b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8')
script_path = r"d:\Antigravity\Portfolio\lib\shoonya_quote.py"

print(f"Running: python {script_path} {payload_b64}")
result = subprocess.run(["python", script_path, payload_b64], capture_output=True, text=True)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
