import os
import sys

sys.path.insert(
    0,
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from fastapi.testclient import TestClient
from backend.api import app

client = TestClient(app)

resp = client.post("/run/qualification")

print("Status:", resp.status_code)
print(resp.json())