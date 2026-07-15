import os
import sys
import requests

sys.path.insert(
    0,
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
)

from backend.config.settings import META_ACCESS_TOKEN

resp = requests.get(
    "https://graph.facebook.com/v25.0/me/permissions",
    params={
        "access_token": META_ACCESS_TOKEN,
    },
)

print(resp.json())