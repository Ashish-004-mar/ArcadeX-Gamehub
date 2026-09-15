document.addEventListener('DOMContentLoaded', () => {
  const frame = document.getElementById('gameFrame');
  const shell = document.getElementById('gamePlayer');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const exitGameBtn = document.getElementById('exitGameBtn');
  const gate = document.getElementById('playAuthGate');
  const status = document.getElementById('playStatus');
  if (!frame || !shell || !fullscreenBtn || !exitGameBtn || !gate) return;

  const isAdmin = document.body.dataset.adminSession === '1';
  const currentUserId = localStorage.getItem('gamehub_current_user');
  const hasUser = currentUserId && JSON.parse(localStorage.getItem('gamehub_users') || '[]').some(u => u.id === currentUserId);
  const allowed = isAdmin || hasUser;

  if (!allowed) {
    gate.hidden = false;
    frame.hidden = true;
    fullscreenBtn.hidden = true;
    exitGameBtn.hidden = true;
    status.textContent = 'Sign in to load the game.';
    const target = location.pathname;
    localStorage.setItem('gamehub_after_login', target);
    return;
  }

  gate.hidden = true;
  frame.hidden = false;
  fullscreenBtn.hidden = false;
  exitGameBtn.hidden = false;
  frame.src = shell.dataset.embedUrl;
  status.textContent = 'Game loaded. Have fun!';

  // User play counts are recorded only after the local login gate succeeds.
  // Admin sessions are counted by the Flask route when the page is opened.
  if (hasUser && !isAdmin) {
    fetch(`/api/games/${shell.dataset.gameId}/play-count`, { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => {});
  }

  let escapeCount = 0;
  let escapeTimer = null;
  const isFullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  const updateFullscreenUI = () => {
    const active = isFullscreen();
    fullscreenBtn.classList.toggle('is-fullscreen', active);
    fullscreenBtn.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
    fullscreenBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
  };
  const enterFullscreen = async () => {
    try {
      if (shell.requestFullscreen) await shell.requestFullscreen();
      else if (shell.webkitRequestFullscreen) shell.webkitRequestFullscreen();
      updateFullscreenUI();
    } catch (error) {
      console.warn('Fullscreen request blocked or unavailable.', error);
    }
  };
  const leaveFullscreen = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (error) {
      console.warn('Could not leave fullscreen.', error);
    }
  };
  const exitGame = async () => {
    escapeCount = 0;
    if (escapeTimer) clearTimeout(escapeTimer);
    if (isFullscreen()) await leaveFullscreen();
    window.location.href = document.referrer && document.referrer.includes('/games') ? document.referrer : '/games';
  };
  fullscreenBtn.addEventListener('click', async () => {
    escapeCount = 0;
    if (isFullscreen()) await leaveFullscreen(); else await enterFullscreen();
  });
  exitGameBtn.addEventListener('click', exitGame);
  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isFullscreen()) return;
    escapeCount += 1;
    if (escapeTimer) clearTimeout(escapeTimer);
    if (escapeCount >= 2) {
      event.preventDefault();
      exitGame();
      return;
    }
    escapeTimer = setTimeout(() => { escapeCount = 0; }, 1400);
  }, true);
  updateFullscreenUI();
});
