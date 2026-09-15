from flask import Blueprint, render_template, request, abort, jsonify
from database import fetch_all, fetch_one, execute

games_bp=Blueprint('games',__name__)
SELECT='''SELECT g.id,g.title,g.slug,g.category_id,g.description,g.thumbnail_url,g.embed_url,g.difficulty,g.tags,g.status,g.play_count,g.created_at,g.updated_at,c.name AS category_name,c.slug AS category_slug FROM games g JOIN categories c ON c.id=g.category_id'''

@games_bp.get('/games')
def games():
    q=request.args.get('q','').strip(); category=request.args.get('category','').strip(); difficulty=request.args.get('difficulty','').strip(); sort=request.args.get('sort','newest')
    where=["g.status='active'","c.status='active'"]; params=[]
    if q: where.append('(g.title LIKE %s OR g.tags LIKE %s)'); params += [f'%{q}%',f'%{q}%']
    if category: where.append('c.slug=%s'); params.append(category)
    if difficulty in ('Easy','Medium','Hard'): where.append('g.difficulty=%s'); params.append(difficulty)
    ordering={'popular':'g.play_count DESC,g.title','oldest':'g.created_at ASC','category':'c.name ASC,g.title','newest':'g.created_at DESC'}.get(sort,'g.created_at DESC')
    rows=fetch_all(SELECT+' WHERE '+' AND '.join(where)+f' ORDER BY {ordering}',params)
    cats=fetch_all("SELECT id,name,slug,icon,description FROM categories WHERE status='active' ORDER BY name")
    return render_template('games.html',games=rows,categories=cats)

@games_bp.get('/games/<category_slug>')
def category_games(category_slug):
    cat=fetch_one("SELECT * FROM categories WHERE slug=%s AND status='active'",(category_slug,))
    if not cat: abort(404)
    rows=fetch_all(SELECT+" WHERE g.status='active' AND c.status='active' AND c.slug=%s ORDER BY g.created_at DESC",(category_slug,))
    return render_template('category.html',category=cat,games=rows)

@games_bp.get('/play/<game_slug>')
def play(game_slug):
    game=fetch_one(SELECT+" WHERE g.slug=%s AND g.status='active' AND c.status='active'",(game_slug,))
    if not game: abort(404)
    # User authentication is intentionally browser-local. The server cannot inspect
    # localStorage, so the play page renders an auth gate and only loads the iframe
    # after the client confirms a signed-in local user. Admin sessions may bypass it.
    if __import__('flask').session.get('admin_logged_in'):
        execute('UPDATE games SET play_count=play_count+1 WHERE id=%s',(game['id'],)); game['play_count']+=1
    similar=fetch_all(SELECT+" WHERE g.status='active' AND c.status='active' AND g.category_id=%s AND g.id<>%s ORDER BY g.play_count DESC LIMIT 4",(game['category_id'],game['id']))
    return render_template('play.html',game=game,similar=similar)

@games_bp.post('/api/games/<int:game_id>/play-count')
def play_count(game_id):
    game=fetch_one("SELECT id FROM games WHERE id=%s AND status='active'",(game_id,))
    if not game: abort(404)
    execute('UPDATE games SET play_count=play_count+1 WHERE id=%s',(game_id,))
    return jsonify({'ok': True})

@games_bp.get('/api/games')
def api_games():
    return jsonify(fetch_all(SELECT+" WHERE g.status='active' AND c.status='active' ORDER BY g.created_at DESC"))
