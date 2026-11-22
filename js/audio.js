(function () {
  window.BS = window.BS || {};

  let ctx = null;
  let muted = false;

  function ensureCtx() {
    if (muted) return null;
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freq, duration, type = 'square', volume = 0.06, delay = 0) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  window.BS.Audio = {
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    blip() {
      playTone(540 + Math.random() * 80, 0.035, 'square', 0.028);
    },
    select() {
      playTone(620, 0.05, 'triangle', 0.05);
    },
    confirm() {
      playTone(523.25, 0.07, 'square', 0.045, 0);
      playTone(783.99, 0.09, 'square', 0.045, 0.06);
    },
    cancel() {
      playTone(330, 0.08, 'triangle', 0.045);
    },
    step() {
      playTone(135 + Math.random() * 20, 0.03, 'triangle', 0.02);
    },
    success() {
      playTone(523.25, 0.09, 'square', 0.045, 0);
      playTone(659.25, 0.09, 'square', 0.045, 0.08);
      playTone(783.99, 0.14, 'square', 0.05, 0.16);
    },
    alert() {
      playTone(880, 0.09, 'sawtooth', 0.045, 0);
      playTone(622.25, 0.09, 'sawtooth', 0.045, 0.11);
      playTone(880, 0.12, 'sawtooth', 0.045, 0.22);
    },
    shutter() {
      playTone(1100, 0.025, 'square', 0.05, 0);
      playTone(220, 0.06, 'sawtooth', 0.04, 0.03);
    },
    stairs(goingUp = true) {
      const notes = goingUp ? [330, 392, 494] : [494, 392, 330];
      notes.forEach((n, i) => playTone(n, 0.06, 'triangle', 0.045, i * 0.06));
    },
    fanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, i) => playTone(n, i === 3 ? 0.28 : 0.1, 'square', 0.05, i * 0.1));
    }
  };
})();
