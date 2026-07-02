# helpers.py

from datetime import datetime


def format_date(date_obj):
    if isinstance(date_obj, datetime):
        return date_obj.isoformat()
    return str(date_obj)


def sanitize_text(text):
    return text.strip() if isinstance(text, str) else text
