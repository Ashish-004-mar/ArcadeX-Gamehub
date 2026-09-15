const getCurrentUser = () => {
  const id = localStorage.getItem('gamehub_current_user');
  const users = JSON.parse(localStorage.getItem('gamehub_users') || '[]');
  return users.find(u => u.id === id) || null;
};

const esc = (value='') => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[ch]));
const formatWhen = iso => {
  try { return new Date(iso).toLocaleString([], { dateStyle:'medium', timeStyle:'short' }); }
  catch (_) { return ''; }
};
const key = (name, id) => `gamehub_${name}_${id}`;

function card(game, removeFavorite = false, favKey = '') {
  return `<article class="dashboard-game-card">
    <a class="dashboard-game-thumb" href="/play/${encodeURIComponent(game.slug)}">
      <img src="${esc(game.thumbnail_url || '/static/images/arcadex-logo.png')}" alt="${esc(game.title)}" loading="lazy" onerror="this.onerror=null;this.src='/static/images/arcadex-logo.png';">
      <span class="dashboard-play-icon" aria-hidden="true">▶</span>
    </a>
    <div class="dashboard-game-body">
      <div class="game-meta"><span>${esc(game.category_name || 'Game')}</span><span>${Number(game.play_count || 0)} plays</span></div>
      <h3>${esc(game.title)}</h3>
      <p>${esc(game.description || 'Jump back in and play.')}</p>
      <div class="dashboard-card-actions">
        <a class="btn primary small" href="/play/${encodeURIComponent(game.slug)}">Play</a>
        ${removeFavorite ? `<button class="btn small danger dashboard-remove-fav" data-game-id="${Number(game.id)}">Remove</button>` : ''}
      </div>
    </div>
  </article>`;
}

async function loadDashboard() {
  const root = document.getElementById('dashboardRoot');
  const isAdmin = document.body.dataset.adminSession === '1';
  let user = (isAdmin && localStorage.getItem('gamehub_admin_player_mode') === '1')
    ? { id: 'admin-player', fullName: 'GameHub Admin', username: 'admin', email: 'Admin player', createdAt: localStorage.getItem('gamehub_admin_player_created') || new Date().toISOString(), lastLoginAt: new Date().toISOString() }
    : getCurrentUser();
  if (isAdmin && !localStorage.getItem('gamehub_admin_player_created')) {
    localStorage.setItem('gamehub_admin_player_created', user.createdAt);
  }
  if (!user) {
    root.innerHTML = `<div class="dashboard-login-card"><div class="dashboard-lock">🔐</div><span class="eyebrow">PLAYER DASHBOARD</span><h1>Sign in to continue</h1><p>Your personal GameHub dashboard includes your favorites, recent games, and profile details.</p><div class="hero-actions"><a class="btn primary" href="/login">Log In</a><a class="btn" href="/register">Create Account</a></div></div>`;
    return;
  }

  let games=[];
  try { games = await fetch('/api/games').then(r=>r.json()); } catch (_) {}
  const byId = new Map(games.map(g => [Number(g.id), g]));
  const favIds = JSON.parse(localStorage.getItem(key('favorites', user.id)) || '[]').map(Number);
  const recent = JSON.parse(localStorage.getItem(key('recently_played', user.id)) || '[]');
  const favorites = favIds.map(id => byId.get(id)).filter(Boolean);
  const recentGames = recent.map(row => byId.get(Number(row.gameId)) ? ({...byId.get(Number(row.gameId)), playedAt:row.playedAt}) : null).filter(Boolean);
  const activity = JSON.parse(localStorage.getItem(key('activity', user.id)) || '[]');
  const lastPlayed = recentGames[0];
  const joined = new Date(user.createdAt || Date.now());

  root.innerHTML = `
    <div class="dashboard-hero">
      <div>
        <span class="eyebrow">PLAYER DASHBOARD</span>
        <h1>Welcome back, ${esc(user.username)}.</h1>
        <p>Pick up where you left off, revisit your favorites, and discover something new.</p>
        <div class="hero-actions">
          <a class="btn primary" href="/games">Explore Games</a>
          ${lastPlayed ? `<a class="btn" href="/play/${encodeURIComponent(lastPlayed.slug)}">Continue Playing</a>` : ''}
        </div>
      </div>
      <div class="dashboard-profile-chip">
        <div class="dashboard-avatar">${esc((user.username || 'G').slice(0,1).toUpperCase())}</div>
        <div><strong>${esc(user.fullName)}</strong><span>@${esc(user.username)}</span></div>
      </div>
    </div>

    <div class="dashboard-stats">
      <div class="dashboard-stat"><span>Favorites</span><b>${favorites.length}</b><small>Your saved games</small></div>
      <div class="dashboard-stat"><span>Recently Played</span><b>${recentGames.length}</b><small>Games you've visited</small></div>
      <div class="dashboard-stat"><span>Activities</span><b>${activity.length}</b><small>Recent GameHub actions</small></div>
      <div class="dashboard-stat"><span>Member Since</span><b>${joined.getFullYear()}</b><small>${joined.toLocaleDateString([], {month:'short', day:'numeric'})}</small></div>
    </div>

    <div class="dashboard-layout">
      <section class="dashboard-main-col">
        <div class="dashboard-section-head"><div><span class="eyebrow">KEEP PLAYING</span><h2>Recently Played</h2></div><a class="text-link" href="/games">View all</a></div>
        <div class="dashboard-game-grid ${recentGames.length ? '' : 'is-empty'}">
          ${recentGames.length ? recentGames.slice(0,4).map(g => card(g)).join('') : `<div class="dashboard-empty"><div class="empty-icon">◷</div><h3>Your game history is waiting</h3><p>Play a game and it will appear here automatically.</p><a class="btn primary small" href="/games">Find a Game</a></div>`}
        </div>

        <div class="dashboard-section-head"><div><span class="eyebrow">SAVED FOR LATER</span><h2>Favorites</h2></div><a class="text-link" href="/favorites">Manage favorites</a></div>
        <div class="dashboard-game-grid ${favorites.length ? '' : 'is-empty'}" id="dashboardFavorites">
          ${favorites.length ? favorites.slice(0,4).map(g => card(g,true,key('favorites',user.id))).join('') : `<div class="dashboard-empty"><div class="empty-icon">♡</div><h3>No favorites yet</h3><p>Use the heart button on any game to keep it close.</p><a class="btn small" href="/games">Browse Games</a></div>`}
        </div>
      </section>

      <aside class="dashboard-side-col">
        <section class="dashboard-side-card">
          <div class="side-card-head"><span class="eyebrow">YOUR PROFILE</span><a class="text-link" href="/profile">Edit</a></div>
          <div class="profile-summary"><div class="dashboard-avatar large">${esc((user.username || 'G').slice(0,1).toUpperCase())}</div><div><h3>${esc(user.fullName)}</h3><p>@${esc(user.username)}</p></div></div>
          <div class="profile-lines"><div><span>Email</span><b>${esc(user.email)}</b></div><div><span>Last Login</span><b>${formatWhen(user.lastLoginAt)}</b></div></div>
        </section>
        <section class="dashboard-side-card quick-actions">
          <div class="side-card-head"><span class="eyebrow">QUICK ACTIONS</span></div>
          <a href="/games"><span>Explore Games</span><b>→</b></a>
          <a href="/favorites"><span>Open Favorites</span><b>→</b></a>
          <a href="/profile"><span>Profile Settings</span><b>→</b></a>
          <button id="dashboardLogout"><span>Log Out</span><b>↪</b></button>
        </section>
        <section class="dashboard-side-card dashboard-tip"><span class="eyebrow">GAMEHUB TIP</span><h3>Make the most of your library.</h3><p>Save the games you love so they're always one click away.</p></section>
      </aside>
    </div>`;

  document.querySelectorAll('.dashboard-remove-fav').forEach(btn => btn.addEventListener('click', () => {
    const current = JSON.parse(localStorage.getItem(key('favorites', user.id)) || '[]').map(Number);
    const next = current.filter(id => id !== Number(btn.dataset.gameId));
    localStorage.setItem(key('favorites', user.id), JSON.stringify(next));
    loadDashboard();
  }));
  document.getElementById('dashboardLogout')?.addEventListener('click', () => {
    localStorage.removeItem('gamehub_current_user');
    window.location.href = '/';
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadDashboard); else loadDashboard();
