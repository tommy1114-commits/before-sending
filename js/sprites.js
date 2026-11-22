(function () {
  window.BS = window.BS || {};

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // Draw a 16x20 GBA-style top-down character sprite
  function buildCharacterSprite(cfg, dir, frame) {
    const c = makeCanvas(16, 20);
    const ctx = c.getContext('2d');
    const step = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    const bob = frame === 0 ? 0 : -1;

    // Ground shadow
    px(ctx, 3, 17, 10, 2, 'rgba(20, 26, 38, 0.35)');

    // Legs / Shoes
    const leftLegY = 15 + (step < 0 ? -1 : 0);
    const rightLegY = 15 + (step > 0 ? -1 : 0);
    px(ctx, 4, leftLegY, 3, 3, cfg.pants);
    px(ctx, 9, rightLegY, 3, 3, cfg.pants);
    px(ctx, 4, leftLegY + 2, 3, 1, '#262b36');
    px(ctx, 9, rightLegY + 2, 3, 1, '#262b36');

    // Torso / Outfit
    px(ctx, 3, 10 + bob, 10, 6, cfg.outline || '#222836');
    px(ctx, 4, 10 + bob, 8, 5, cfg.coat || cfg.shirt);
    if (cfg.coat) {
      // Inner shirt visible for lab coat / blazer
      if (dir === 'down') {
        px(ctx, 6, 10 + bob, 4, 4, cfg.shirt);
      }
      if (cfg.tie && dir === 'down') {
        px(ctx, 7, 11 + bob, 2, 3, cfg.tie);
      }
    }
    if (cfg.badge && dir === 'down') {
      px(ctx, 9, 12 + bob, 2, 2, '#f5d76e');
    }
    if (cfg.camera && dir !== 'up') {
      px(ctx, 6, 12 + bob, 4, 3, '#2b3240');
      px(ctx, 7, 13 + bob, 2, 1, '#7cd1f9');
    }

    // Arms
    const armL = 11 + bob + (step > 0 ? 1 : 0);
    const armR = 11 + bob + (step < 0 ? 1 : 0);
    px(ctx, 2, armL, 2, 4, cfg.coat || cfg.shirt);
    px(ctx, 12, armR, 2, 4, cfg.coat || cfg.shirt);
    px(ctx, 2, armL + 3, 2, 1, cfg.skin);
    px(ctx, 12, armR + 3, 2, 1, cfg.skin);

    // Head base
    px(ctx, 3, 2 + bob, 10, 8, '#222836');
    px(ctx, 4, 3 + bob, 8, 7, cfg.skin);

    // Hair & Face by direction
    if (dir === 'down') {
      px(ctx, 3, 2 + bob, 10, 3, cfg.hair);
      px(ctx, 3, 4 + bob, 2, 3, cfg.hair);
      px(ctx, 11, 4 + bob, 2, 3, cfg.hair);
      // Eyes
      px(ctx, 5, 6 + bob, 2, 2, '#1f2533');
      px(ctx, 9, 6 + bob, 2, 2, '#1f2533');
      px(ctx, 5, 6 + bob, 1, 1, '#ffffff');
      px(ctx, 9, 6 + bob, 1, 1, '#ffffff');
      if (cfg.glasses) {
        px(ctx, 4, 6 + bob, 8, 1, '#4f5d75');
        px(ctx, 5, 7 + bob, 2, 1, '#7ec8e3');
        px(ctx, 9, 7 + bob, 2, 1, '#7ec8e3');
      }
      if (cfg.goggles) {
        px(ctx, 4, 3 + bob, 8, 2, '#4ba3c7');
        px(ctx, 5, 3 + bob, 2, 1, '#c8f2ff');
        px(ctx, 9, 3 + bob, 2, 1, '#c8f2ff');
      }
    } else if (dir === 'up') {
      px(ctx, 3, 2 + bob, 10, 7, cfg.hair);
      px(ctx, 4, 3 + bob, 8, 5, cfg.hairHighlight || cfg.hair);
      if (cfg.goggles) {
        px(ctx, 3, 4 + bob, 10, 1, '#3b5669');
      }
    } else if (dir === 'left') {
      px(ctx, 3, 2 + bob, 10, 3, cfg.hair);
      px(ctx, 8, 4 + bob, 5, 5, cfg.hair);
      px(ctx, 5, 6 + bob, 2, 2, '#1f2533');
      px(ctx, 5, 6 + bob, 1, 1, '#ffffff');
      if (cfg.glasses) {
        px(ctx, 4, 6 + bob, 3, 1, '#4f5d75');
      }
    } else {
      px(ctx, 3, 2 + bob, 10, 3, cfg.hair);
      px(ctx, 3, 4 + bob, 5, 5, cfg.hair);
      px(ctx, 9, 6 + bob, 2, 2, '#1f2533');
      px(ctx, 10, 6 + bob, 1, 1, '#ffffff');
      if (cfg.glasses) {
        px(ctx, 9, 6 + bob, 3, 1, '#4f5d75');
      }
    }

    return c;
  }

  const CHAR_CONFIGS = {
    player: {
      hair: '#29324b',
      hairHighlight: '#394668',
      skin: '#f6d2b3',
      shirt: '#2e8a78',
      pants: '#323c52',
      badge: true
    },
    lead: {
      hair: '#4a3529',
      hairHighlight: '#5e4435',
      skin: '#f3caa6',
      coat: '#c4ab88',
      shirt: '#f7f5ee',
      tie: '#8f323b',
      pants: '#343b4a',
      glasses: true
    },
    colleague: {
      hair: '#69442c',
      hairHighlight: '#7f5438',
      skin: '#f5cfa9',
      coat: '#f2f5f9',
      shirt: '#4b7bb5',
      pants: '#3b4a5e',
      goggles: true
    },
    visitor: {
      hair: '#232730',
      hairHighlight: '#353b47',
      skin: '#f2c8a2',
      coat: '#d18d3b',
      shirt: '#f4f0e4',
      pants: '#3d4452',
      camera: true
    }
  };

  const spriteCache = {};

  function initSprites() {
    const dirs = ['down', 'up', 'left', 'right'];
    Object.keys(CHAR_CONFIGS).forEach((key) => {
      spriteCache[key] = {};
      dirs.forEach((d) => {
        spriteCache[key][d] = [0, 1, 2].map((f) => buildCharacterSprite(CHAR_CONFIGS[key], d, f));
      });
    });
  }

  // Draw 32x32 dialogue portrait
  function drawPortrait(canvas, id) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 32, 32);

    if (CHAR_CONFIGS[id]) {
      const bgColors = {
        player: '#d6efe8',
        lead: '#f0e2cb',
        colleague: '#dcebfa',
        visitor: '#f7e5c6'
      };
      px(ctx, 0, 0, 32, 32, bgColors[id] || '#e8e0cc');
      const sp = spriteCache[id].down[0];
      ctx.drawImage(sp, 0, 0, 16, 17, 2, 2, 28, 30);
      return;
    }

    // Object icons
    px(ctx, 0, 0, 32, 32, '#e2dac6');
    if (id === 'pc') {
      px(ctx, 5, 5, 22, 16, '#2b3446');
      px(ctx, 7, 7, 18, 12, '#62b6cb');
      px(ctx, 9, 9, 10, 2, '#ffffff');
      px(ctx, 9, 13, 14, 2, '#d8f3dc');
      px(ctx, 13, 21, 6, 3, '#475569');
      px(ctx, 9, 24, 14, 3, '#334155');
    } else if (id === 'desk') {
      px(ctx, 6, 6, 20, 20, '#8f6540');
      px(ctx, 9, 8, 14, 16, '#fffdf5');
      px(ctx, 11, 11, 10, 2, '#2f7d6d');
      px(ctx, 11, 15, 8, 2, '#8b95a5');
      px(ctx, 11, 19, 10, 2, '#8b95a5');
    } else if (id === 'whiteboard') {
      px(ctx, 4, 6, 24, 18, '#5a6578');
      px(ctx, 6, 8, 20, 14, '#f8fafc');
      px(ctx, 8, 11, 10, 2, '#d64545');
      px(ctx, 8, 15, 14, 2, '#2e7d9b');
      px(ctx, 10, 24, 12, 2, '#475569');
    } else if (id === 'monitor') {
      px(ctx, 5, 6, 22, 16, '#273242');
      px(ctx, 7, 8, 18, 12, '#172536');
      px(ctx, 8, 16, 4, 2, '#4ee2a0');
      px(ctx, 12, 12, 4, 2, '#4ee2a0');
      px(ctx, 16, 14, 4, 2, '#f4b942');
      px(ctx, 20, 10, 4, 2, '#f26b6b');
      px(ctx, 12, 22, 8, 4, '#475569');
    } else if (id === 'samples') {
      px(ctx, 6, 18, 20, 7, '#64748b');
      px(ctx, 8, 9, 4, 11, '#9be7ff');
      px(ctx, 14, 9, 4, 11, '#a7f3d0');
      px(ctx, 20, 9, 4, 11, '#fde68a');
      px(ctx, 8, 13, 4, 3, '#fff');
      px(ctx, 14, 13, 4, 3, '#fff');
      px(ctx, 20, 13, 4, 3, '#fff');
    } else if (id === 'reception') {
      px(ctx, 5, 11, 22, 14, '#7d5b42');
      px(ctx, 7, 13, 18, 10, '#a37a59');
      px(ctx, 10, 7, 12, 8, '#fffdf5');
      px(ctx, 12, 9, 8, 2, '#2f7d6d');
    } else if (id === 'poster') {
      px(ctx, 5, 4, 22, 24, '#334155');
      px(ctx, 7, 6, 18, 20, '#ffffff');
      px(ctx, 7, 6, 18, 5, '#2b4a78');
      px(ctx, 9, 8, 12, 1, '#dbeafe');
      px(ctx, 9, 13, 6, 5, '#86efac');
      px(ctx, 17, 13, 6, 5, '#93c5fd');
      px(ctx, 9, 20, 14, 4, '#fde68a');
    } else if (id === 'alert') {
      px(ctx, 0, 0, 32, 32, '#f9d8d8');
      px(ctx, 14, 6, 4, 12, '#c0392b');
      px(ctx, 14, 21, 4, 4, '#c0392b');
    } else {
      px(ctx, 8, 8, 16, 16, '#2f7d6d');
    }
  }

  initSprites();

  window.BS.Sprites = {
    getChar(id, dir, frame) {
      return spriteCache[id][dir][frame];
    },
    drawPortrait
  };
})();
