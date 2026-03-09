import ast

with open("test_extract.py", "r", encoding="utf-8") as f:
    source = f.read()

try:
    ast.parse(source)
    print("Syntax OK")
except SyntaxError as e:
    print(f"File {e.filename}, line {e.lineno}, column {e.offset}")
    print(e.text)
