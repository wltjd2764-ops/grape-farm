'use strict';
// ───────── 효과음 (WebAudio 합성, 파일 없음) ─────────
const Sfx = (() => {
  let ac = null, enabled = true;
  function ensure() {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ac = new AC(); }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(f, d = 0.12, type = 'square', vol = 0.05, at = 0, f2) {
    if (!enabled) return;
    const a = ensure();
    if (!a) return;
    const t0 = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g).connect(a.destination);
    o.start(t0);
    o.stop(t0 + d + 0.02);
  }
  return {
    setEnabled(v) { enabled = v; },
    get enabled() { return enabled; },
    click() { tone(660, 0.05, 'square', 0.025); },
    pop() { tone(520, 0.09, 'triangle', 0.08, 0, 1040); tone(1320, 0.07, 'sine', 0.04, 0.07); },
    coin() { tone(988, 0.06, 'square', 0.03); tone(1319, 0.12, 'square', 0.03, 0.06); },
    plant() { tone(300, 0.1, 'triangle', 0.06, 0, 200); tone(600, 0.12, 'sine', 0.05, 0.1, 900); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.07, i * 0.11)); tone(1319, 0.45, 'triangle', 0.06, 0.48); },
    error() { tone(200, 0.15, 'sawtooth', 0.03); },
    splash() { tone(700, 0.3, 'sine', 0.07, 0, 120); tone(1400, 0.12, 'triangle', 0.03, 0.04, 300); tone(420, 0.25, 'sine', 0.05, 0.12, 900); },
    bad() { tone(180, 0.22, 'square', 0.05, 0, 90); },
  };
})();
