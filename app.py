from flask import Flask, render_template, session, request, jsonify, redirect, url_for
from config import Config
from routes.games import games_bp
from routes.admin import admin_bp
from routes.categories import categories_bp
from database import fetch_all, fetch_one, ensure_announcement_link_column
from utils.security import ensure_csrf_token

app = Flask(__name__)
app.config.from_object(Config)
app.register_blueprint(games_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(categories_bp)

# Backward-compatible schema upgrade for existing GameHub databases.
try:
    ensure_announcement_link_column()
except Exception as exc:
    # Keep the app start-up error visible while allowing a clear database traceback.
    print(f"Database schema upgrade warning: {exc}")

@app.context_processor
def globals_for_templates():
    ensure_csrf_token()
    return {'current_admin': bool(session.get('admin_logged_in')), 'csrf_token': session.get('csrf_token')}

@app.get('/')
def index():
    settings = fetch_one('SELECT * FROM home_settings WHERE id=1')
    if not settings:
        settings = {'hero_eyebrow':'PLAY • DISCOVER • REPEAT','hero_title':'Your next game is waiting.','hero_description':'Discover fast, fun browser games across racing, action, puzzles, sports, adventure and more.','featured_heading':'Games worth playing','category_heading':'Choose your style','cta_heading':'Pick a game. Hit play. Have fun.','cta_button':'Browse Game Library'}
    featured = fetch_all("SELECT g.id,g.title,g.slug,g.category_id,g.description,g.thumbnail_url,g.embed_url,g.difficulty,g.tags,g.status,g.play_count,c.name AS category_name,c.slug AS category_slug FROM games g JOIN categories c ON c.id=g.category_id LEFT JOIN home_featured_games hfg ON hfg.game_id=g.id WHERE g.status='active' AND c.status='active' AND hfg.game_id IS NOT NULL ORDER BY hfg.position ASC LIMIT 12")
    if not featured:
        featured = fetch_all("SELECT g.id,g.title,g.slug,g.category_id,g.description,g.thumbnail_url,g.embed_url,g.difficulty,g.tags,g.status,g.play_count,c.name AS category_name,c.slug AS category_slug FROM games g JOIN categories c ON c.id=g.category_id WHERE g.status='active' AND c.status='active' ORDER BY g.play_count DESC, g.created_at DESC LIMIT 6")
    categories = fetch_all("SELECT c.id,c.name,c.slug,c.description,c.icon FROM categories c LEFT JOIN home_categories hc ON hc.category_id=c.id WHERE c.status='active' AND hc.category_id IS NOT NULL ORDER BY hc.position ASC LIMIT 12")
    if not categories:
        categories = fetch_all("SELECT id,name,slug,description,icon FROM categories WHERE status='active' ORDER BY name LIMIT 7")
    announcements = fetch_all("SELECT * FROM announcements WHERE status='active' AND NOW() <= expires_at ORDER BY created_at DESC")
    return render_template('index.html', featured=featured, categories=categories, settings=settings, announcements=announcements)
@app.route('/login', methods=['GET', 'POST'])
def login():
    # The normal login form is shared by regular browser-only users and the
    # server-side administrator account. Regular user credentials are never
    # stored in MySQL; auth.js validates them against LocalStorage after this
    # endpoint confirms the submitted credentials are not the admin account.
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        if email == Config.ADMIN_EMAIL.strip().lower() and password == Config.ADMIN_PASSWORD:
            session.clear()
            session['admin_logged_in'] = True
            session['admin_email'] = Config.ADMIN_EMAIL
            return jsonify({'ok': True, 'admin': True, 'redirect': url_for('admin.admin_dashboard')})
        return jsonify({'ok': False, 'admin': False})
    return render_template('login.html')
@app.get('/register')
def register(): return render_template('register.html')
@app.get('/dashboard')
def dashboard():
    # Admins can also use the normal player dashboard. Their admin session
    # remains active alongside their player experience.
    return render_template('dashboard.html')
@app.get('/profile')
def profile(): return render_template('profile.html')
@app.get('/favorites')
def favorites(): return render_template('favorites.html')

@app.errorhandler(404)
def not_found(_): return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
