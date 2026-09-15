from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from config import Config
from database import fetch_all, fetch_one, execute
from utils.helpers import slugify, unique_slug, admin_required
from utils.security import validate_csrf

admin_bp=Blueprint('admin',__name__)
CHOICES=('Easy','Medium','Hard'); STATUSES=('active','inactive')

def valid_url(v):
    v=(v or '').strip()
    return v if v.startswith(('http://','https://')) else None

def required(form): return [x for x in ('title','category_id','embed_url') if not form.get(x,'').strip()]

@admin_bp.get('/admin-login')
def admin_login():
    # There is intentionally no public administrator login form or separate
    # admin credential page. Administrators authenticate through /login.
    if session.get('admin_logged_in'):
        return redirect(url_for('admin.admin_dashboard'))
    return redirect(url_for('login'))

@admin_bp.post('/admin/logout')
@admin_required
@validate_csrf
def admin_logout():
    session.pop('admin_logged_in', None); session.pop('admin_email', None); flash('Admin logged out.','success'); return redirect(url_for('login'))

@admin_bp.get('/admin-dashboard')
@admin_required
def admin_dashboard():
    stats={
      'total_games':fetch_one('SELECT COUNT(*) total FROM games')['total'],
      'active_games':fetch_one("SELECT COUNT(*) total FROM games WHERE status='active'")['total'],
      'inactive_games':fetch_one("SELECT COUNT(*) total FROM games WHERE status='inactive'")['total'],
      'total_categories':fetch_one('SELECT COUNT(*) total FROM categories')['total']}
    recent=fetch_all('SELECT g.title,g.created_at,g.status,c.name category_name FROM games g JOIN categories c ON c.id=g.category_id ORDER BY g.created_at DESC LIMIT 8')
    popular=fetch_all('SELECT g.title,g.play_count,c.name category_name FROM games g JOIN categories c ON c.id=g.category_id ORDER BY g.play_count DESC,g.title LIMIT 8')
    return render_template('admin-dashboard.html',stats=stats,recent=recent,popular=popular)

@admin_bp.get('/admin/games')
@admin_required
def admin_games():
    q=request.args.get('q','').strip(); cat=request.args.get('category','').strip(); status=request.args.get('status','').strip(); sort=request.args.get('sort','latest')
    where=['1=1']; params=[]
    if q: where.append('(g.title LIKE %s OR g.tags LIKE %s)'); params += [f'%{q}%',f'%{q}%']
    if cat: where.append('g.category_id=%s'); params.append(cat)
    if status in STATUSES: where.append('g.status=%s'); params.append(status)
    order={'popular':'g.play_count DESC','category':'c.name ASC,g.title','title':'g.title ASC','latest':'g.created_at DESC'}.get(sort,'g.created_at DESC')
    rows=fetch_all('SELECT g.*,c.name category_name FROM games g JOIN categories c ON c.id=g.category_id WHERE '+' AND '.join(where)+f' ORDER BY {order}',params)
    cats=fetch_all('SELECT * FROM categories ORDER BY name')
    return render_template('admin-games.html',games=rows,categories=cats,filters={'q':q,'category':cat,'status':status,'sort':sort})

@admin_bp.route('/admin/games/add',methods=['GET','POST'])
@admin_required
@validate_csrf
def add_game():
    cats=fetch_all('SELECT * FROM categories ORDER BY name')
    if request.method=='POST':
        miss=required(request.form)
        embed=valid_url(request.form.get('embed_url'))
        if miss or not embed or request.form.get('difficulty') not in CHOICES or request.form.get('status') not in STATUSES:
            flash('Enter a title, category and valid http/https Embed Game URL, with valid options.','error'); return render_template('admin-add-game.html',categories=cats,form=request.form)
        cid=int(request.form['category_id'])
        if not fetch_one('SELECT id FROM categories WHERE id=%s',(cid,)): flash('Category not found.','error'); return render_template('admin-add-game.html',categories=cats,form=request.form)
        title=request.form['title'].strip(); slug=unique_slug(slugify(title),'games')
        execute('INSERT INTO games(title,slug,category_id,description,thumbnail_url,embed_url,difficulty,tags,status) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)',(title,slug,cid,request.form.get('description','').strip(),request.form.get('thumbnail_url','').strip() or None,embed,request.form.get('difficulty'),request.form.get('tags','').strip() or None,request.form.get('status')))
        flash('Game added to MySQL.','success'); return redirect(url_for('admin.admin_games'))
    return render_template('admin-add-game.html',categories=cats,form={})

@admin_bp.route('/admin/games/edit/<int:game_id>',methods=['GET','POST'])
@admin_required
@validate_csrf
def edit_game(game_id):
    game=fetch_one('SELECT * FROM games WHERE id=%s',(game_id,)); cats=fetch_all('SELECT * FROM categories ORDER BY name')
    if not game: flash('Game not found.','error'); return redirect(url_for('admin.admin_games'))
    if request.method=='POST':
        miss=required(request.form); embed=valid_url(request.form.get('embed_url'))
        if miss or not embed or request.form.get('difficulty') not in CHOICES or request.form.get('status') not in STATUSES:
            flash('Invalid game data.','error'); return render_template('admin-edit-game.html',game=game,categories=cats)
        cid=int(request.form['category_id']); title=request.form['title'].strip(); slug=unique_slug(slugify(title),'games',game_id)
        execute('UPDATE games SET title=%s,slug=%s,category_id=%s,description=%s,thumbnail_url=%s,embed_url=%s,difficulty=%s,tags=%s,status=%s WHERE id=%s',(title,slug,cid,request.form.get('description','').strip(),request.form.get('thumbnail_url','').strip() or None,embed,request.form.get('difficulty'),request.form.get('tags','').strip() or None,request.form.get('status'),game_id))
        flash('Game updated in MySQL.','success'); return redirect(url_for('admin.admin_games'))
    return render_template('admin-edit-game.html',game=game,categories=cats)

@admin_bp.post('/admin/games/delete/<int:game_id>')
@admin_required
@validate_csrf
def delete_game(game_id):
    execute('DELETE FROM games WHERE id=%s',(game_id,)); flash('Game deleted from MySQL.','success'); return redirect(url_for('admin.admin_games'))

@admin_bp.post('/admin/games/status/<int:game_id>')
@admin_required
@validate_csrf
def game_status(game_id):
    g=fetch_one('SELECT status FROM games WHERE id=%s',(game_id,))
    if g: execute('UPDATE games SET status=%s WHERE id=%s',('inactive' if g['status']=='active' else 'active',game_id)); flash('Game status updated.','success')
    return redirect(url_for('admin.admin_games'))

@admin_bp.get('/admin/preview/<int:game_id>')
@admin_required
def preview_game(game_id):
    game=fetch_one('SELECT g.*,c.name category_name FROM games g JOIN categories c ON c.id=g.category_id WHERE g.id=%s',(game_id,))
    if not game: return redirect(url_for('admin.admin_games'))
    return render_template('admin-preview.html',game=game)

@admin_bp.get('/admin/categories')
@admin_required
def admin_categories():
    rows=fetch_all('SELECT c.*,COUNT(g.id) game_count FROM categories c LEFT JOIN games g ON g.category_id=c.id GROUP BY c.id ORDER BY c.name')
    return render_template('admin-categories.html',categories=rows)

@admin_bp.post('/admin/categories/add')
@admin_required
@validate_csrf
def add_category():
    name=request.form.get('name','').strip()
    if not name: flash('Category name is required.','error'); return redirect(url_for('admin.admin_categories'))
    execute('INSERT INTO categories(name,slug,description,icon,status) VALUES(%s,%s,%s,%s,%s)',(name,unique_slug(slugify(name),'categories'),request.form.get('description','').strip() or None,request.form.get('icon','').strip() or None,request.form.get('status','active')))
    flash('Category added to MySQL.','success'); return redirect(url_for('admin.admin_categories'))

@admin_bp.post('/admin/categories/edit/<int:category_id>')
@admin_required
@validate_csrf
def edit_category(category_id):
    name=request.form.get('name','').strip()
    if not name: flash('Category name is required.','error'); return redirect(url_for('admin.admin_categories'))
    execute('UPDATE categories SET name=%s,slug=%s,description=%s,icon=%s,status=%s WHERE id=%s',(name,unique_slug(slugify(name),'categories',category_id),request.form.get('description','').strip() or None,request.form.get('icon','').strip() or None,request.form.get('status','active'),category_id))
    flash('Category updated.','success'); return redirect(url_for('admin.admin_categories'))

@admin_bp.post('/admin/categories/delete/<int:category_id>')
@admin_required
@validate_csrf
def delete_category(category_id):
    execute('DELETE FROM categories WHERE id=%s',(category_id,)); flash('Category deleted; related games were cascaded.','success'); return redirect(url_for('admin.admin_categories'))

@admin_bp.post('/admin/categories/status/<int:category_id>')
@admin_required
@validate_csrf
def category_status(category_id):
    c=fetch_one('SELECT status FROM categories WHERE id=%s',(category_id,))
    if c: execute('UPDATE categories SET status=%s WHERE id=%s',('inactive' if c['status']=='active' else 'active',category_id)); flash('Category status updated.','success')
    return redirect(url_for('admin.admin_categories'))


@admin_bp.get('/admin/home')
@admin_required
def admin_home():
    settings = fetch_one('SELECT * FROM home_settings WHERE id=1')
    if not settings:
        execute("INSERT INTO home_settings (id,hero_eyebrow,hero_title,hero_description,featured_heading,category_heading,cta_heading,cta_button) VALUES (1,'PLAY • DISCOVER • REPEAT','Your next game is waiting.','Discover fast, fun browser games across racing, action, puzzles, sports, adventure and more.','Games worth playing','Choose your style','Pick a game. Hit play. Have fun.','Browse Game Library')")
        settings = fetch_one('SELECT * FROM home_settings WHERE id=1')
    games = fetch_all("SELECT g.id,g.title,c.name category_name FROM games g JOIN categories c ON c.id=g.category_id WHERE g.status='active' AND c.status='active' ORDER BY g.title")
    categories = fetch_all("SELECT id,name,slug,status FROM categories ORDER BY name")
    selected_games = [r['game_id'] for r in fetch_all('SELECT game_id FROM home_featured_games ORDER BY position')]
    selected_categories = [r['category_id'] for r in fetch_all('SELECT category_id FROM home_categories ORDER BY position')]
    return render_template('admin-home.html',settings=settings,games=games,categories=categories,selected_games=selected_games,selected_categories=selected_categories)

@admin_bp.post('/admin/home')
@admin_required
@validate_csrf
def save_home_settings():
    keys=('hero_eyebrow','hero_title','hero_description','featured_heading','category_heading','cta_heading','cta_button')
    data={k:request.form.get(k,'').strip() for k in keys}
    if not data['hero_title'] or not data['hero_description']:
        flash('Hero title and description are required.','error')
        return redirect(url_for('admin.admin_home'))
    execute('UPDATE home_settings SET hero_eyebrow=%s,hero_title=%s,hero_description=%s,featured_heading=%s,category_heading=%s,cta_heading=%s,cta_button=%s WHERE id=1', tuple(data[k] for k in keys))
    execute('DELETE FROM home_featured_games')
    for pos,gid in enumerate(request.form.getlist('featured_games'),start=1):
        try: gid=int(gid)
        except ValueError: continue
        execute('INSERT IGNORE INTO home_featured_games(game_id,position) VALUES(%s,%s)',(gid,pos))
    execute('DELETE FROM home_categories')
    for pos,cid in enumerate(request.form.getlist('home_categories'),start=1):
        try: cid=int(cid)
        except ValueError: continue
        execute('INSERT IGNORE INTO home_categories(category_id,position) VALUES(%s,%s)',(cid,pos))
    flash('Homepage customization saved.','success')
    return redirect(url_for('admin.admin_home'))

@admin_bp.get('/admin/announcements')
@admin_required
def admin_announcements():
    rows=fetch_all('SELECT * FROM announcements ORDER BY created_at DESC')
    return render_template('admin-announcements.html',announcements=rows)

@admin_bp.post('/admin/announcements/add')
@admin_required
@validate_csrf
def add_announcement():
    message=request.form.get('message','').strip()
    try: days=int(request.form.get('days','1'))
    except ValueError: days=1
    days=max(1,min(days,365))
    status=request.form.get('status','active')
    link_url=valid_url(request.form.get('link_url')) if request.form.get('link_url','').strip() else None
    if not message:
        flash('Announcement message is required.','error')
        return redirect(url_for('admin.admin_announcements'))
    if status not in STATUSES: status='active'
    execute('INSERT INTO announcements(message,link_url,days,status,expires_at) VALUES(%s,%s,%s,%s,DATE_ADD(NOW(),INTERVAL %s DAY))',(message,link_url,days,status,days))
    flash('Announcement published.','success')
    return redirect(url_for('admin.admin_announcements'))

@admin_bp.post('/admin/announcements/status/<int:announcement_id>')
@admin_required
@validate_csrf
def announcement_status(announcement_id):
    row=fetch_one('SELECT status FROM announcements WHERE id=%s',(announcement_id,))
    if row:
        execute('UPDATE announcements SET status=%s WHERE id=%s',('inactive' if row['status']=='active' else 'active',announcement_id))
        flash('Announcement status updated.','success')
    return redirect(url_for('admin.admin_announcements'))

@admin_bp.post('/admin/announcements/delete/<int:announcement_id>')
@admin_required
@validate_csrf
def delete_announcement(announcement_id):
    execute('DELETE FROM announcements WHERE id=%s',(announcement_id,))
    flash('Announcement removed.','success')
    return redirect(url_for('admin.admin_announcements'))
