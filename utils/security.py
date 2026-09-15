import secrets
from functools import wraps
from flask import session, request, abort

def ensure_csrf_token():
    if not session.get("csrf_token"):
        session["csrf_token"] = secrets.token_urlsafe(32)
    return session["csrf_token"]

def validate_csrf(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        # CSRF protection is only needed for state-changing requests.
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            token = ensure_csrf_token()
            provided = request.form.get("csrf_token") or request.headers.get("X-CSRF-Token")
            if not provided or not secrets.compare_digest(token, provided):
                abort(400, description="Invalid CSRF token.")
        else:
            ensure_csrf_token()
        return view(*args, **kwargs)
    return wrapper
