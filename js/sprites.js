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
    },
    qing: {
      hair: '#3d2838',
      hairHighlight: '#593b52',
      skin: '#f7d5b8',
      coat: '#7c5aa6',
      shirt: '#fbf7f0',
      pants: '#2f3a4f',
      badge: true
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
        visitor: '#f7e5c6',
        qing: '#eadcf7'
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

  // Precomputed starry cosmos coordinates for title backdrop
  const TITLE_STARS = [
    [62, 16, 1], [86, 30, 0], [112, 12, 1], [148, 22, 0], [174, 14, 1],
    [208, 18, 0], [244, 12, 1], [278, 26, 0], [312, 14, 1], [344, 24, 0],
    [98, 48, 1], [134, 42, 0], [166, 56, 1], [224, 44, 0], [262, 54, 1],
    [296, 40, 0], [324, 58, 1], [118, 74, 0], [154, 82, 1], [196, 68, 0],
    [238, 78, 1], [276, 86, 0], [308, 76, 1], [140, 102, 0], [182, 96, 1],
    [216, 108, 0], [254, 98, 1], [290, 110, 0], [168, 124, 1], [202, 128, 0]
  ];

  // Animated 384x256 GBA Pixel-Art Title Backdrop inspired by RCCI science illustration
  function drawTitleBackdrop(canvas, tick) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const w = canvas.width;
    const h = canvas.height;

    // 1. Deep Cosmic Night Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 175);
    skyGrad.addColorStop(0, '#051522');
    skyGrad.addColorStop(0.65, '#092235');
    skyGrad.addColorStop(1, '#10344f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 175);

    // 2. Twinkling Pixel Stars
    TITLE_STARS.forEach(([sx, sy, phase], idx) => {
      const bright = (Math.floor(tick / 18) + idx) % 5 !== 0;
      const color = phase === 1 ? (bright ? '#fff7d6' : '#6b95b3') : (bright ? '#a8d5f2' : '#3a6280');
      px(ctx, sx, sy, 2, 2, color);
      if (phase === 1 && bright && idx % 4 === 0) {
        px(ctx, sx - 1, sy, 4, 1, 'rgba(255, 247, 214, 0.55)');
        px(ctx, sx, sy - 1, 1, 4, 'rgba(255, 247, 214, 0.55)');
      }
    });

    // 3. Sweeping Diagonal Cobalt & Warm Cream Clouds (top-left & right sky)
    function drawDiagCloud(x0, y0, len, thickness, mainColor, trimColor) {
      for (let i = 0; i < len; i += 4) {
        const cx = x0 + i;
        const cy = y0 - Math.round(i * 0.62);
        const puff = Math.round(Math.sin(i * 0.14) * 4);
        px(ctx, cx, cy - 3 + puff, 8, thickness + 3, trimColor);
        px(ctx, cx, cy + 1 + puff, 8, thickness, mainColor);
      }
    }
    // Top-left sweeping cloud
    drawDiagCloud(28, 32, 74, 10, '#2a8bf2', '#fff4d4');
    // Mid-left cloud streak
    drawDiagCloud(88, 92, 66, 11, '#257fe0', '#fff4d4');
    // Big right sweeping cosmic cloud
    drawDiagCloud(284, 88, 116, 15, '#257fe0', '#fff4d4');
    // Lower-right cloud bank
    drawDiagCloud(304, 154, 96, 18, '#2b86e8', '#fff4d4');

    // Floating Pixel Ringed Planet (upper-right sky)
    const pyOff = Math.round(Math.sin(tick * 0.04) * 1.5);
    const plX = 342;
    const plY = 74 + pyOff;
    px(ctx, plX - 7, plY + 2, 16, 2, '#9ec9ed');
    px(ctx, plX - 4, plY - 2, 9, 8, '#3b82d6');
    px(ctx, plX - 2, plY - 1, 5, 4, '#79b8f5');
    px(ctx, plX - 5, plY + 3, 13, 1, '#dbeeff');

    // 4. Horizon Parapet Wall & Pine Tree Silhouettes (right background)
    px(ctx, 290, 142, 94, 24, '#135ec4');
    px(ctx, 290, 140, 94, 3, '#4da3f5');
    // Pine trees silhouette on right
    [340, 354, 368].forEach((tx, idx) => {
      const th = idx === 1 ? 30 : 22;
      for (let r = 0; r < th; r += 3) {
        const bw = Math.max(2, Math.floor((r / th) * 14));
        px(ctx, tx - Math.floor(bw / 2), 140 - th + r, bw, 3, '#0a2d4d');
      }
    });

    // 5. Crisp Warm Off-White Terrace Floor (foreground)
    px(ctx, 0, 164, w, h - 164, '#eef1eb');
    px(ctx, 0, 156, w, 10, '#c6d6e8');
    px(ctx, 0, 155, w, 2, '#2d5c8a');

    // 6. Iconic Cobalt-Blue Angled Modern Lab Building on Left
    ctx.fillStyle = '#0e69d9';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(30, 0);
    ctx.lineTo(92, 68);
    ctx.lineTo(92, 168);
    ctx.lineTo(0, 184);
    ctx.closePath();
    ctx.fill();
    // Building dark outline & recessed tall glass curtain-wall
    ctx.strokeStyle = '#07223d';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fef6d8';
    ctx.beginPath();
    ctx.moveTo(16, 28);
    ctx.lineTo(66, 72);
    ctx.lineTo(66, 168);
    ctx.lineTo(16, 178);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blue sky reflection inside glass windows + mullions
    ctx.fillStyle = '#9ecdf7';
    ctx.fillRect(20, 88, 44, 62);
    px(ctx, 36, 46, 2, 128, '#07223d');
    px(ctx, 52, 62, 2, 108, '#07223d');
    px(ctx, 18, 92, 48, 2, '#07223d');
    px(ctx, 18, 128, 48, 2, '#07223d');

    // Left pine silhouette & white horizontal louver band
    [22, 34, 48].forEach((tx, idx) => {
      const ty = 136 - idx * 4;
      px(ctx, tx, ty, 6, 26, '#092b4a');
      px(ctx, tx - 3, ty + 6, 12, 12, '#092b4a');
    });
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 122);
    ctx.lineTo(54, 146);
    ctx.lineTo(54, 158);
    ctx.lineTo(0, 140);
    ctx.closePath();
    ctx.fill();

    // 7. Center-Left Focal Prop: Golden Cryogenic / Quantum Chandelier Tower
    const qx = 104;
    const qy = 108;
    // Cast shadow on floor
    px(ctx, qx - 16, qy + 84, 66, 6, '#334d66');
    // Plinth base
    px(ctx, qx - 4, qy + 78, 52, 10, '#cbd5e1');
    px(ctx, qx - 4, qy + 78, 52, 2, '#ffffff');
    px(ctx, qx - 4, qy + 88, 52, 2, '#475569');
    // Outer silver gantry frame
    px(ctx, qx, qy, 44, 4, '#e2e8f0');
    px(ctx, qx, qy, 4, 80, '#cbd5e1');
    px(ctx, qx + 40, qy, 4, 80, '#94a3b8');
    px(ctx, qx + 10, qy + 4, 2, 74, '#94a3b8');
    px(ctx, qx + 32, qy + 4, 2, 74, '#64748b');

    // Golden brass chandelier tiers (shimmering!)
    const shimmer = (tick % 48) < 24;
    const tierYs = [qy + 12, qy + 26, qy + 40, qy + 54, qy + 66];
    tierYs.forEach((ty, idx) => {
      const tw = 26 - idx * 2;
      const tx = qx + 22 - Math.floor(tw / 2);
      px(ctx, tx, ty, tw, 4, '#b87a14');
      px(ctx, tx + 1, ty, tw - 2, 2, shimmer && idx % 2 === 0 ? '#ffe58f' : '#f2bd3f');
      if (idx < tierYs.length - 1) {
        // Golden coaxial lines / pillars between tiers
        px(ctx, tx + 3, ty + 4, 2, 10, '#d69924');
        px(ctx, tx + Math.floor(tw / 2) - 1, ty + 4, 3, 10, '#f4c542');
        px(ctx, tx + tw - 5, ty + 4, 2, 10, '#b87a14');
      }
    });
    // Bottom cryogenic core tip
    px(ctx, qx + 19, qy + 70, 6, 8, '#d69924');
    px(ctx, qx + 21, qy + 71, 2, 6, '#fff0a8');

    // 8. Right Focal Prop: Researcher in White Lab Coat at Optical / Oscilloscope Bench
    const bx = 224;
    const by = 148;
    // Floor shadow under bench
    px(ctx, bx - 4, by + 44, 114, 5, '#334d66');
    // Stainless steel lab table
    px(ctx, bx, by + 16, 108, 5, '#94a3b8');
    px(ctx, bx, by + 16, 108, 2, '#e2e8f0');
    px(ctx, bx + 4, by + 21, 3, 25, '#475569');
    px(ctx, bx + 100, by + 21, 3, 25, '#475569');
    px(ctx, bx + 4, by + 36, 98, 2, '#64748b');

    // Optical probe / microscope unit (left side of bench)
    px(ctx, bx + 8, by - 4, 18, 20, '#cbd5e1');
    px(ctx, bx + 12, by - 12, 10, 10, '#94a3b8');
    px(ctx, bx + 10, by + 6, 14, 8, '#475569');
    px(ctx, bx + 12, by + 8, 10, 4, '#38bdf8');

    // Analytical instrument + Oscilloscope Monitor (right side of bench)
    px(ctx, bx + 62, by - 6, 22, 22, '#64748b');
    px(ctx, bx + 65, by - 2, 16, 12, '#1e293b');
    px(ctx, bx + 68, by + 2, 4, 4, '#38bdf8');
    // Monitor displaying live pulsing Gaussian peak curve!
    px(ctx, bx + 86, by - 4, 20, 16, '#1e293b');
    px(ctx, bx + 88, by - 2, 16, 12, '#0f2942');
    const peakLift = Math.round(Math.sin(tick * 0.1) * 1.5);
    px(ctx, bx + 90, by + 7, 3, 1, '#5eead4');
    px(ctx, bx + 93, by + 4 - peakLift, 2, 4 + peakLift, '#5eead4');
    px(ctx, bx + 95, by + 1 - peakLift, 2, 3, '#a7f3d0');
    px(ctx, bx + 97, by + 4 - peakLift, 2, 4 + peakLift, '#5eead4');
    px(ctx, bx + 99, by + 7, 3, 1, '#5eead4');
    px(ctx, bx + 93, by + 12, 6, 4, '#475569');

    // Researcher in crisp white lab coat (center of bench)
    const rx = bx + 34;
    const ry = by - 20;
    // Legs
    px(ctx, rx + 5, ry + 42, 6, 20, '#1e293b');
    px(ctx, rx + 13, ry + 42, 6, 20, '#1e293b');
    px(ctx, rx + 4, ry + 60, 7, 3, '#0f172a');
    px(ctx, rx + 13, ry + 60, 7, 3, '#0f172a');
    // White lab coat torso
    px(ctx, rx + 2, ry + 14, 20, 30, '#e2e8f0');
    px(ctx, rx + 4, ry + 14, 16, 28, '#ffffff');
    px(ctx, rx + 18, ry + 18, 4, 24, '#cbd5e1');
    // Reaching arm toward instrument
    px(ctx, rx - 4, ry + 20, 8, 5, '#ffffff');
    px(ctx, rx - 7, ry + 22, 4, 3, '#f3caa6');
    // Head & dark hair
    px(ctx, rx + 5, ry + 2, 12, 11, '#f3caa6');
    px(ctx, rx + 4, ry, 14, 6, '#1e2536');
    px(ctx, rx + 12, ry + 4, 6, 7, '#1e2536');
  }

  initSprites();

  window.BS.Sprites = {
    getChar(id, dir, frame) {
      return spriteCache[id][dir][frame];
    },
    drawPortrait,
    drawTitleBackdrop
  };
})();
