document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.main-nav');
  const isAdmin = document.body.dataset.adminSession === '1';
  const userId = localStorage.getItem('gamehub_current_user');
  const users = JSON.parse(localStorage.getItem('gamehub_users') || '[]');
  const user = users.find(u => u.id === userId);
  if (isAdmin) localStorage.setItem('gamehub_admin_player_mode','1');
  else localStorage.removeItem('gamehub_admin_player_mode');

  if (nav) {
    const login = nav.querySelector('.nav-login');
    const dashboardLink = Array.from(nav.querySelectorAll('a')).find(a => a.getAttribute('href') === '/dashboard');
    let adminLink = nav.querySelector('.nav-admin-dashboard');

    if (isAdmin) {
      // Admin is also a player, so keep the normal Dashboard link and add
      // exactly one Admin Dashboard link. Remove the duplicate auth link.
      if (login) login.remove();

      if (!adminLink) {
        adminLink = document.createElement('a');
        adminLink.className = 'nav-admin-dashboard';
        adminLink.href = '/admin-dashboard';
        adminLink.textContent = 'Admin Dashboard';
        nav.appendChild(adminLink);
      }
    } else {
      // Normal users get a single Dashboard entry in place of Login.
      if (adminLink) adminLink.remove();
      if (login && user) {
        login.textContent = 'Dashboard';
        login.href = '/dashboard';
        login.classList.remove('nav-login');
        login.classList.add('nav-dashboard');
      }
    }
  }

  document.querySelectorAll('.game-play-link').forEach(link => {
    link.addEventListener('click', event => {
      const uid = localStorage.getItem('gamehub_current_user');
      if (isAdmin || uid) return;
      event.preventDefault();
      localStorage.setItem('gamehub_after_login', new URL(link.href, location.origin).pathname);
      localStorage.setItem('gamehub_login_reason', 'play');
      location = '/login';
    });
  });
});
