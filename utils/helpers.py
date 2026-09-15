import re, unicodedata
from functools import wraps
from flask import session, redirect, url_for, flash, request
from database import fetch_one

def slugify(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii','ignore').decode('ascii')
    value = re.sub(r'[^a-zA-Z0-9]+','-',value).strip('-').lower()
    return value or 'item'

def unique_slug(base, table, row_id=None):
    slug=base; i=2
    while True:
        row = fetch_one(f"SELECT id FROM {table} WHERE slug=%s" + (" AND id<>%s" if row_id is not None else ''), (slug,row_id) if row_id is not None else (slug,))
        if not row: return slug
        slug=f'{base}-{i}'; i+=1

def admin_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not session.get('admin_logged_in'):
            flash('Administrator login required.','error')
            return redirect(url_for('admin.admin_login', next=request.path))
        return view(*args, **kwargs)
    return wrapper
