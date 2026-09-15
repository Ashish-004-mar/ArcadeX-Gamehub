const isAdminSession = () => document.body.dataset.adminSession === '1';
const allUsers = () => JSON.parse(localStorage.getItem('gamehub_users') || '[]');
const currentUser = () => {
  const id = localStorage.getItem('gamehub_current_user');
  return allUsers().find(u => u.id === id) || null;
};
const playerIdentity = () => (isAdminSession() && localStorage.getItem('gamehub_admin_player_mode') === '1') ? {
  id: 'admin-player', fullName: 'GameHub Admin', username: 'admin', email: 'Admin player'
} : currentUser();
const favoriteKey = () => {
  const player = playerIdentity();
  return player ? `gamehub_favorites_${player.id}` : null;
};
const recentKey = () => {
  const player = playerIdentity();
  return player ? `gamehub_recently_played_${player.id}` : null;
};
const activityKey = () => {
  const player = playerIdentity();
  return player ? `gamehub_activity_${player.id}` : null;
};
const readArray = key => key ? JSON.parse(localStorage.getItem(key) || '[]') : [];

function showFavoriteLoginPrompt() {
  let modal = document.getElementById('favoriteAuthModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'favoriteAuthModal';
    modal.className = 'favorite-auth-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="favorite-auth-backdrop" data-close-favorite-modal></div>
      <div class="favorite-auth-dialog">
        <button class="favorite-auth-close" type="button" aria-label="Close" data-close-favorite-modal>×</button>
        <div class="favorite-auth-icon">♥</div>
        <span class="eyebrow">SAVE YOUR GAMES</span>
        <h2>Log in to add favorites</h2>
        <p>Keep your favorite games ready for your next visit. Your favorites stay saved in this browser.</p>
        <div class="favorite-auth-actions">
          <a class="btn primary" href="/login">Log In</a>
          <a class="btn" href="/register">Create Account</a>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-close-favorite-modal]').forEach(el => {
      el.addEventListener('click', () => modal.classList.remove('is-open'));
    });
  }
  modal.classList.add('is-open');
}

function syncFavorites() {
  const key = favoriteKey();
  const ids = readArray(key).map(Number);
  document.querySelectorAll('.favorite-toggle').forEach(btn => {
    const id = Number(btn.dataset.gameId);
    const active = ids.includes(id);
    btn.classList.toggle('is-favorite', active);
    btn.textContent = active ? (btn.classList.contains('favorite-text') ? '♥ Favorite' : '♥') : (btn.classList.contains('favorite-text') ? '♡ Favorite' : '♡');
    btn.setAttribute('aria-pressed', String(active));
    btn.onclick = () => {
      if (!favoriteKey()) {
        showFavoriteLoginPrompt();
        return;
      }
      const current = readArray(favoriteKey()).map(Number);
      const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      localStorage.setItem(favoriteKey(), JSON.stringify(next));
      const aKey = activityKey();
      if (aKey) {
        const activity = readArray(aKey);
        activity.unshift({ type: next.includes(id) ? 'favorite_added' : 'favorite_removed', gameId: id, at: new Date().toISOString() });
        localStorage.setItem(aKey, JSON.stringify(activity.slice(0, 50)));
      }
      syncFavorites();
    };
  });
}

function trackRecent() {
  const player = playerIdentity();
  if (!player || !location.pathname.startsWith('/play/')) return;
  fetch('/api/games').then(r => r.json()).then(games => {
    const slug = decodeURIComponent(location.pathname.split('/').pop());
    const game = games.find(x => x.slug === slug);
    if (!game) return;
    const key = recentKey();
    const rows = readArray(key).filter(x => Number(x.gameId) !== Number(game.id));
    rows.unshift({ gameId: game.id, slug: game.slug, title: game.title, playedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(rows.slice(0, 12)));
    const aKey = activityKey();
    if (aKey) {
      const activity = readArray(aKey);
      activity.unshift({ type: 'played', gameId: game.id, at: new Date().toISOString() });
      localStorage.setItem(aKey, JSON.stringify(activity.slice(0, 50)));
    }
  }).catch(() => {});
}

function bootGamesJs() {
  syncFavorites();
  trackRecent();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootGamesJs);
else bootGamesJs();
