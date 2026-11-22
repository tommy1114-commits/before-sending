(function () {
  window.BS = window.BS || {};

  let ctx = null;
  let muted = false;

  // ===== Title Screen Dual-Deck Crossfade BGM Engine =====
  const BGM_SRC = 'audio/homepage-bgm.mp3?v=3.1';
  const BGM_BASE_VOL = 0.42;
  const BGM_START_OFFSET = 0.05;   // Skip 51ms MP3 encoder padding
  const BGM_CROSSFADE_SEC = 2.0;   // Smooth 2.0s equal-power crossfade overlap
  const BGM_FADE_IN_MS = 950;
  const BGM_FADE_OUT_MS = 750;

  let decks = null;
  let activeIdx = 0;
  let bgmWanted = false;
  let bgmPlaying = false;
  let bgmNeedsGesture = false;
  let bgmLoadError = false;
  let loopTicker = null;
  let fadeOutTicker = null;
  let fadeInStartMs = 0;
  let crossfading = false;
  let crossfadeStartMs = 0;
  let crossfadeFromIdx = 0;
  let crossfadeToIdx = 1;
  let bgmStateListener = null;

  function emitBgmState() {
    if (!bgmStateListener) return;
    let status = 'stopped';
    if (bgmLoadError) status = 'error';
    else if (muted) status = 'muted';
    else if (bgmPlaying) status = 'playing';
    else if (bgmWanted && bgmNeedsGesture) status = 'locked';
    bgmStateListener(status);
  }

  function createDeck(idx) {
    const a = new Audio(BGM_SRC);
    a.preload = 'auto';
    a.loop = false;
    a.volume = 0;
    a.addEventListener('error', () => {
      bgmLoadError = true;
      bgmPlaying = false;
      emitBgmState();
    });
    a.addEventListener('canplay', () => {
      bgmLoadError = false;
    });
    a.addEventListener('ended', () => {
      // Fallback if browser throttled timers in background tab
      if (!bgmWanted || muted || crossfading || idx !== activeIdx) return;
      const nextIdx = 1 - activeIdx;
      const nextDeck = decks[nextIdx];
      activeIdx = nextIdx;
      fadeInStartMs = performance.now();
      try {
        nextDeck.currentTime = BGM_START_OFFSET;
      } catch {}
      nextDeck.volume = 0;
      nextDeck.play().catch(() => {});
    });
    return a;
  }

  function ensureDecks() {
    if (!decks) {
      decks = [createDeck(0), createDeck(1)];
    }
    return decks;
  }

  function clearTickers() {
    if (loopTicker) {
      clearInterval(loopTicker);
      loopTicker = null;
    }
    if (fadeOutTicker) {
      clearInterval(fadeOutTicker);
      fadeOutTicker = null;
    }
  }

  function hardStopDecks() {
    clearTickers();
    crossfading = false;
    bgmPlaying = false;
    if (decks) {
      decks.forEach((d) => {
        d.pause();
        d.volume = 0;
        try {
          d.currentTime = BGM_START_OFFSET;
        } catch {}
      });
    }
    emitBgmState();
  }

  function tickBgmLoop() {
    if (!bgmWanted || muted || !decks) {
      hardStopDecks();
      return;
    }

    const now = performance.now();

    if (crossfading) {
      const p = Math.min(1, (now - crossfadeStartMs) / (BGM_CROSSFADE_SEC * 1000));
      const fromDeck = decks[crossfadeFromIdx];
      const toDeck = decks[crossfadeToIdx];
      // Equal-power cosine/sine curve prevents volume dip or harsh cut
      fromDeck.volume = Math.max(0, Math.min(1, BGM_BASE_VOL * Math.cos(p * Math.PI * 0.5)));
      toDeck.volume = Math.max(0, Math.min(1, BGM_BASE_VOL * Math.sin(p * Math.PI * 0.5)));

      if (p >= 1) {
        fromDeck.pause();
        fromDeck.volume = 0;
        try {
          fromDeck.currentTime = BGM_START_OFFSET;
        } catch {}
        toDeck.volume = BGM_BASE_VOL;
        activeIdx = crossfadeToIdx;
        crossfading = false;
      }
      return;
    }

    const activeDeck = decks[activeIdx];
    const dur = Number.isFinite(activeDeck.duration) && activeDeck.duration > 4 ? activeDeck.duration : 17.986;

    // Initial smooth fade-in
    if (fadeInStartMs > 0) {
      const fp = Math.min(1, (now - fadeInStartMs) / BGM_FADE_IN_MS);
      activeDeck.volume = Math.max(0, Math.min(BGM_BASE_VOL, BGM_BASE_VOL * Math.sin(fp * Math.PI * 0.5)));
      if (fp >= 1) {
        activeDeck.volume = BGM_BASE_VOL;
        fadeInStartMs = 0;
      }
    }

    // Trigger equal-power crossfade before abrupt track tail
    const remaining = dur - activeDeck.currentTime;
    if (!activeDeck.paused && activeDeck.currentTime > BGM_CROSSFADE_SEC && remaining <= BGM_CROSSFADE_SEC) {
      const nextIdx = 1 - activeIdx;
      const nextDeck = decks[nextIdx];
      crossfading = true;
      crossfadeFromIdx = activeIdx;
      crossfadeToIdx = nextIdx;
      crossfadeStartMs = now;
      fadeInStartMs = 0;
      nextDeck.volume = 0;
      try {
        nextDeck.currentTime = BGM_START_OFFSET;
      } catch {}
      nextDeck.play().catch(() => {
        // If standby play fails unexpectedly, cleanly fall back
        crossfading = false;
      });
    }
  }

  function startTitleBgm() {
    bgmWanted = true;
    if (muted) {
      emitBgmState();
      return;
    }
    if (bgmPlaying && !fadeOutTicker) {
      emitBgmState();
      return;
    }

    clearTickers();
    crossfading = false;
    const ds = ensureDecks();
    const other = ds[1 - activeIdx];
    other.pause();
    other.volume = 0;

    const activeDeck = ds[activeIdx];
    activeDeck.volume = 0;
    try {
      activeDeck.currentTime = BGM_START_OFFSET;
    } catch {}

    const playPromise = activeDeck.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          if (!bgmWanted || muted) {
            hardStopDecks();
            return;
          }
          bgmPlaying = true;
          bgmNeedsGesture = false;
          fadeInStartMs = performance.now();
          if (!loopTicker) {
            loopTicker = setInterval(tickBgmLoop, 30);
          }
          emitBgmState();
        })
        .catch(() => {
          bgmPlaying = false;
          bgmNeedsGesture = true;
          emitBgmState();
        });
    } else {
      bgmPlaying = true;
      bgmNeedsGesture = false;
      fadeInStartMs = performance.now();
      if (!loopTicker) {
        loopTicker = setInterval(tickBgmLoop, 30);
      }
      emitBgmState();
    }
  }

  function stopTitleBgm(fadeMs = BGM_FADE_OUT_MS) {
    bgmWanted = false;
    bgmNeedsGesture = false;
    if (loopTicker) {
      clearInterval(loopTicker);
      loopTicker = null;
    }
    crossfading = false;

    if (!decks || !bgmPlaying || fadeMs <= 0) {
      hardStopDecks();
      return;
    }

    if (fadeOutTicker) clearInterval(fadeOutTicker);
    const startVols = decks.map((d) => d.volume);
    const startTime = performance.now();

    fadeOutTicker = setInterval(() => {
      const p = Math.min(1, (performance.now() - startTime) / fadeMs);
      const scale = Math.cos(p * Math.PI * 0.5);
      decks.forEach((d, i) => {
        d.volume = Math.max(0, startVols[i] * scale);
      });
      if (p >= 1) {
        hardStopDecks();
      }
    }, 30);
  }

  function unlockTitleBgmIfNeeded() {
    if (bgmWanted && !muted && !bgmPlaying) {
      startTitleBgm();
    }
  }

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
      if (muted) {
        hardStopDecks();
      } else if (bgmWanted) {
        startTitleBgm();
      } else {
        emitBgmState();
      }
      return muted;
    },
    startTitleBgm,
    stopTitleBgm,
    unlockTitleBgmIfNeeded,
    getTitleBgmStatus() {
      if (bgmLoadError) return 'error';
      if (muted) return 'muted';
      if (bgmPlaying) return 'playing';
      if (bgmWanted && bgmNeedsGesture) return 'locked';
      return 'stopped';
    },
    onBgmStateChange(fn) {
      bgmStateListener = fn;
      emitBgmState();
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
