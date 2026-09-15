function playerSession() {
  const id = localStorage.getItem('gamehub_current_user');
  const users = JSON.parse(localStorage.getItem('gamehub_users') || '[]');
  return { id, users, user: users.find(u => u.id === id) || null };
}

function clearPlayerData(userId) {
  const keys = [
    `gamehub_favorites_${userId}`,
    `gamehub_recently_played_${userId}`,
    `gamehub_activity_${userId}`,
    `gamehub_progress_${userId}`,
    `gamehub_profile_${userId}`,
    `gamehub_login_history_${userId}`
  ];
  keys.forEach(k => localStorage.removeItem(k));
}

function initProfile() {
  const { id, users, user } = playerSession();
  const isAdmin = document.body.dataset.adminSession === '1';
  const adminPlayer = { id: 'admin-player', fullName: 'GameHub Admin', username: 'admin', email: 'Admin player' };
  const current = isAdmin ? adminPlayer : user;
  const form = document.getElementById('profileForm');
  const name = document.getElementById('profileName');
  const username = document.getElementById('profileUsername');
  const email = document.getElementById('profileEmail');
  const deleteButton = document.getElementById('deleteAccount');
  const msg = document.getElementById('profileMessage');
  if (!current) {
    msg.textContent = 'Please log in to view your profile.';
    form.hidden = true;
    deleteButton.hidden = true;
    return;
  }

  name.value = current.fullName || '';
  username.value = current.username || '';
  email.value = current.email || '';

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (isAdmin || !user || !id) {
      msg.textContent = 'Admin profile details are managed separately from player account details.';
      return;
    }
    current.fullName = name.value.trim() || current.fullName;
    localStorage.setItem('gamehub_users', JSON.stringify(users.map(u => u.id === id ? current : u)));
    localStorage.setItem(`gamehub_profile_${id}`, JSON.stringify({ fullName: current.fullName, updatedAt: new Date().toISOString() }));
    msg.textContent = 'Your profile has been updated.';
  });

  if (isAdmin && !user) {
    name.disabled = true;
    deleteButton.hidden = true;
    msg.textContent = 'You are using the Admin account as a player. Your player data is stored locally.';
    return;
  }

  deleteButton.addEventListener('click', () => {
    const confirmed = window.confirm('Delete your GameHub account from this browser? Your favorites, recent games, activity, profile data, and login session will also be removed.');
    if (!confirmed) return;

    clearPlayerData(id);
    localStorage.setItem('gamehub_users', JSON.stringify(users.filter(u => u.id !== id)));
    localStorage.removeItem('gamehub_current_user');
    localStorage.removeItem('gamehub_after_login');
    localStorage.removeItem('gamehub_login_reason');
    msg.textContent = 'Your account has been deleted from this browser.';
    setTimeout(() => { window.location.href = '/'; }, 900);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initProfile);
else initProfile();
