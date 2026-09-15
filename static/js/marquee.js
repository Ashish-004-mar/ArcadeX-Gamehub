document.addEventListener('DOMContentLoaded', () => {
  const bar = document.querySelector('.announcement-bar');
  const track = document.getElementById('announcementTrack');
  if (!bar || !track) return;

  const update = () => {
    track.style.setProperty('--marquee-start', `${bar.clientWidth}px`);
    const shift = Math.max(0, track.scrollWidth - bar.clientWidth);
    track.style.setProperty('--marquee-shift', `${shift}px`);
    const seconds = Math.max(8, Math.min(24, 6 + shift / 80));
    track.style.setProperty('--marquee-duration', `${seconds}s`);
  };

  update();
  window.addEventListener('resize', update);
});