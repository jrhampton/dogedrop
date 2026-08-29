/**
 * Boot: wires DOM refs, starts the RAF loop.
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const dom = {
    scoreValue: document.getElementById('score-value'),
    athValue: document.getElementById('ath-value'),
    muteBtn: document.getElementById('mute-btn'),
    overlay: document.getElementById('game-over'),
    overlayScore: document.getElementById('final-score'),
    overlayNewAth: document.getElementById('new-ath-badge'),
    restartBtn: document.getElementById('restart-btn'),
  };

  const game = new Game(canvas, dom);
  window.__dogedrop = game; // exposed for QA/testing
  game.loadAth();

  dom.muteBtn.addEventListener('click', () => game.toggleMute());
  dom.restartBtn.addEventListener('click', () => game.reset());

  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 1 / 30); // clamp huge gaps (tab switch) to avoid physics blowups
    game.update(dt);
    game.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});
