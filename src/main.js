import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

document.getElementById('btn-start').addEventListener('click', () => game.start());
document.getElementById('btn-resume').addEventListener('click', () => game.resume());
document.getElementById('btn-pause').addEventListener('click', () => game.pause());
document.getElementById('btn-restart').addEventListener('click', () => game.restart());
document.getElementById('btn-restart-pause').addEventListener('click', () => game.restart());

window.addEventListener('resize', () => game.onResize());

// Prevent browser gestures stealing input
['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) => {
  document.addEventListener(ev, (e) => e.preventDefault());
});

game.boot();
