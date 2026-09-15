from flask import Blueprint
from database import fetch_all
categories_bp=Blueprint('categories',__name__)
@categories_bp.get('/api/categories')
def api_categories(): return {'categories':fetch_all("SELECT id,name,slug,description,icon,status FROM categories WHERE status='active' ORDER BY name")}
