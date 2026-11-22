(function () {
  window.BS = window.BS || {};

  const TILE = 16;
  const COLS = 24;
  const ROWS = 16;

  // Build collision map (true = solid)
  function createSolidGrid() {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    // Perimeter walls (top wall is 2 tiles tall y=0..1 for GBA perspective)
    for (let x = 0; x < COLS; x++) {
      grid[0][x] = true;
      grid[1][x] = true;
      grid[ROWS - 1][x] = true;
    }
    for (let y = 0; y < ROWS; y++) {
      grid[y][0] = true;
      grid[y][COLS - 1] = true;
    }

    // Vertical divider wall x = 10 (doorways at y=5..6 and y=11..12)
    for (let y = 2; y <= 14; y++) {
      if (y !== 5 && y !== 6 && y !== 11 && y !== 12) {
        grid[y][10] = true;
      }
    }

    // Horizontal glass partition y = 10 between Lab and Entrance (doorway at x=15..16)
    for (let x = 11; x <= 22; x++) {
      if (x !== 15 && x !== 16) {
        grid[10][x] = true;
      }
    }

    // Office furniture
    grid[2][1] = true; // Bookshelf
    grid[3][2] = true; grid[3][3] = true; grid[3][4] = true; // PC desk
    grid[3][6] = true; grid[3][7] = true; grid[3][8] = true; // Lead desk
    grid[8][2] = true; grid[8][3] = true; grid[8][4] = true; // Duty desk
    grid[2][9] = true; // Plant
    grid[13][1] = true; // Plant

    // Lab furniture
    grid[3][18] = true; grid[3][19] = true; grid[3][20] = true; // Monitor bench
    grid[6][15] = true; grid[6][16] = true; grid[6][17] = true; // Sample island
    grid[2][22] = true; // Cabinet
    grid[3][22] = true;

    // Reception furniture
    grid[13][12] = true; grid[13][13] = true; grid[13][14] = true; // Reception counter
    grid[11][22] = true; // Entrance plant

    return grid;
  }

  const solidGrid = createSolidGrid();

  // Interactive objects (fixed world coordinates)
  const INTERACTABLES = [
    { id: 'pc', label: '值班電腦', tiles: [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }], badgeX: 3, badgeY: 2.3 },
    { id: 'duty_desk', label: '值班桌（交班）', tiles: [{ x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }], badgeX: 3, badgeY: 7.3 },
    { id: 'whiteboard', label: '實驗白板', tiles: [{ x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }], badgeX: 14, badgeY: 0.7 },
    { id: 'monitor', label: '實驗室螢幕', tiles: [{ x: 18, y: 3 }, { x: 19, y: 3 }, { x: 20, y: 3 }], badgeX: 19, badgeY: 2.3 },
    { id: 'samples', label: '樣品架與標籤', tiles: [{ x: 15, y: 6 }, { x: 16, y: 6 }, { x: 17, y: 6 }], badgeX: 16, badgeY: 5.3 },
    { id: 'reception', label: '訪客接待處', tiles: [{ x: 12, y: 13 }, { x: 13, y: 13 }, { x: 14, y: 13 }], badgeX: 13, badgeY: 12.3 }
  ];

  // Dynamic NPCs per chapter
  function createNPCsForChapter(chapter) {
    if (chapter === 2) {
      return [
        { id: 'npc_lead', sprite: 'lead', label: '負責人 阿明組長', x: 7, y: 4, dir: 'down' },
        { id: 'npc_colleague', sprite: 'colleague', label: '同事 阿文', x: 9, y: 6, dir: 'left' }
      ];
    }
    return [
      { id: 'npc_lead', sprite: 'lead', label: '負責人 阿明組長', x: 7, y: 4, dir: 'down' },
      { id: 'npc_colleague', sprite: 'colleague', label: '同事 阿文', x: 20, y: 6, dir: 'left' },
      { id: 'npc_visitor', sprite: 'visitor', label: '訪客 陳先生', x: 18, y: 13, dir: 'up' }
    ];
  }

  function createInitialNPCs() {
    return createNPCsForChapter(1);
  }

  function getZoneName(tx, ty) {
    if (tx <= 9) return '辦公區';
    if (ty <= 9) return '實驗區（門禁管制）';
    return '訪客入口';
  }

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawMap(ctx, state, tick) {
    // 1. Floor tiles
    for (let y = 2; y <= 14; y++) {
      for (let x = 1; x <= 22; x++) {
        const sx = x * TILE;
        const sy = y * TILE;
        if (x <= 9) {
          // Warm office wood planks
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#e4cfa8' : '#dcc49b');
          px(ctx, sx, sy + 7, TILE, 1, 'rgba(130, 95, 52, 0.16)');
          px(ctx, sx, sy + 15, TILE, 1, 'rgba(130, 95, 52, 0.16)');
        } else if (x === 10) {
          // Doorway threshold floor
          px(ctx, sx, sy, TILE, TILE, '#c8d1dc');
        } else if (y <= 9) {
          // Clean cool lab tiles
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#d8ebe9' : '#cde3e0');
          px(ctx, sx, sy, TILE, 1, 'rgba(60, 105, 110, 0.10)');
          px(ctx, sx, sy, 1, TILE, 'rgba(60, 105, 110, 0.10)');
        } else {
          // Visitor foyer stone tiles
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#e2e4e8' : '#d6d9df');
        }
      }
    }

    // Welcome mat & Approved photo floor marker in Visitor Entrance
    px(ctx, 18 * TILE, 14 * TILE + 2, 2 * TILE, 12, '#3d6e63');
    px(ctx, 18 * TILE + 2, 14 * TILE + 4, 2 * TILE - 4, 8, '#538e80');
    // Subtle photo spot marker on foyer floor
    px(ctx, 19 * TILE + 2, 12 * TILE + 2, 12, 12, 'rgba(47, 125, 109, 0.2)');
    px(ctx, 19 * TILE + 4, 12 * TILE + 4, 8, 8, 'rgba(47, 125, 109, 0.35)');

    // 2. Outer walls
    // Top wall (rows 0..1)
    for (let x = 0; x < COLS; x++) {
      const sx = x * TILE;
      px(ctx, sx, 0, TILE, TILE, '#354157');
      px(ctx, sx, TILE, TILE, TILE, x <= 9 ? '#cbbba0' : '#bfd0d6');
      px(ctx, sx, TILE + 13, TILE, 3, '#8894a6'); // baseboard
    }
    // Side walls & bottom wall
    for (let y = 0; y < ROWS; y++) {
      px(ctx, 0, y * TILE, TILE, TILE, '#2b3548');
      px(ctx, (COLS - 1) * TILE, y * TILE, TILE, TILE, '#2b3548');
    }
    for (let x = 0; x < COLS; x++) {
      px(ctx, x * TILE, (ROWS - 1) * TILE, TILE, TILE, '#2b3548');
    }
    // Front glass entry doors on bottom wall
    px(ctx, 18 * TILE, 15 * TILE, 2 * TILE, TILE, '#5b92a8');
    px(ctx, 18 * TILE + 2, 15 * TILE + 2, TILE - 3, TILE - 4, '#9dd6eb');
    px(ctx, 19 * TILE + 1, 15 * TILE + 2, TILE - 3, TILE - 4, '#9dd6eb');

    // Office windows on top wall (afternoon gold in Ch1, twilight dusk in Ch2!)
    const isCh2 = state.chapter === 2;
    [2, 3, 6, 7].forEach((wx) => {
      px(ctx, wx * TILE + 1, 6, TILE - 2, 18, '#55657d');
      px(ctx, wx * TILE + 3, 8, TILE - 6, 14, isCh2 ? '#455987' : '#f8d58b');
      if (isCh2) {
        px(ctx, wx * TILE + 5, 10, 2, 2, '#fde68a'); // evening city/starlight dot
        px(ctx, wx * TILE + 3, 18, TILE - 6, 4, '#6b5b7a'); // dusk horizon
      }
      px(ctx, wx * TILE + 3, 14, TILE - 6, 2, '#55657d');
      // Soft window cast onto floor
      ctx.fillStyle = isCh2 ? 'rgba(95, 120, 175, 0.14)' : 'rgba(255, 224, 150, 0.14)';
      ctx.fillRect(wx * TILE, 2 * TILE, TILE, 22);
    });

    // 3. Internal partition walls
    // Vertical divider x = 10
    for (let y = 2; y <= 14; y++) {
      if (y !== 5 && y !== 6 && y !== 11 && y !== 12) {
        const sx = 10 * TILE;
        const sy = y * TILE;
        px(ctx, sx, sy, TILE, TILE, '#44546b');
        if (y <= 9) {
          // Glass window strip inside lab partition
          px(ctx, sx + 4, sy + 2, 8, 12, '#8cc4d4');
          px(ctx, sx + 5, sy + 3, 2, 10, '#c8edf7');
        }
      }
    }
    // Keycard reader next to office->lab door
    px(ctx, 10 * TILE + 2, 4 * TILE + 10, 4, 5, '#1e293b');
    px(ctx, 10 * TILE + 3, 4 * TILE + 11, 2, 2, tick % 60 < 45 ? '#34d399' : '#10b981');

    // Horizontal glass partition y = 10 between Lab and Entrance
    for (let x = 11; x <= 22; x++) {
      if (x !== 15 && x !== 16) {
        const sx = x * TILE;
        const sy = 10 * TILE;
        px(ctx, sx, sy, TILE, TILE, '#44546b');
        px(ctx, sx + 1, sy + 3, TILE - 2, 8, '#8cc4d4');
        px(ctx, sx + 2, sy + 4, TILE - 4, 3, '#c8edf7');
      }
    }
    // Keycard reader at lab entrance door
    px(ctx, 14 * TILE + 10, 10 * TILE + 9, 4, 6, '#1e293b');
    px(ctx, 14 * TILE + 11, 10 * TILE + 10, 2, 2, '#34d399');

    // Lab Lobby Sign Plaque (核准拍照區背景) at x=18..20, y=10
    px(ctx, 18 * TILE, 10 * TILE + 2, 3 * TILE, 12, '#225951');
    px(ctx, 18 * TILE + 2, 10 * TILE + 4, 3 * TILE - 4, 8, '#307b6f');
    px(ctx, 18 * TILE + 5, 10 * TILE + 7, 38, 2, '#e2faf4');

    // 4. Whiteboard on Lab top wall (x=13..15, y=1)
    const wbX = 13 * TILE;
    const wbY = 5;
    px(ctx, wbX, wbY, 3 * TILE, 22, '#5a667a');
    px(ctx, wbX + 2, wbY + 2, 3 * TILE - 4, 18, '#f8fafc');
    if (isCh2 || state.labItems.whiteboard) {
      // Clean whiteboard in Ch2 or after wiping in Ch1
      px(ctx, wbX + 8, wbY + 8, 30, 1, '#e2e8f0');
      px(ctx, wbX + 38, wbY + 5, 2, 2, '#60d394');
    } else {
      // Exposed confidential formulas & chart in Ch1!
      px(ctx, wbX + 5, wbY + 5, 16, 2, '#d64545');
      px(ctx, wbX + 5, wbY + 9, 26, 2, '#2b6cb0');
      px(ctx, wbX + 5, wbY + 13, 18, 2, '#d97706');
      px(ctx, wbX + 34, wbY + 6, 8, 10, '#e2e8f0');
      px(ctx, wbX + 35, wbY + 12, 2, 4, '#d64545');
      px(ctx, wbX + 38, wbY + 9, 2, 7, '#2f855a');
    }

    // 5. Office Furniture
    // Bookshelf (1,2)
    px(ctx, 1 * TILE + 1, 2 * TILE - 4, 14, 19, '#6e4c30');
    px(ctx, 1 * TILE + 3, 2 * TILE - 2, 10, 5, '#4c3420');
    px(ctx, 1 * TILE + 4, 2 * TILE - 1, 2, 4, '#c75b39');
    px(ctx, 1 * TILE + 7, 2 * TILE - 1, 2, 4, '#3b82f6');
    px(ctx, 1 * TILE + 10, 2 * TILE - 1, 2, 4, '#10b981');
    px(ctx, 1 * TILE + 3, 2 * TILE + 5, 10, 5, '#4c3420');
    px(ctx, 1 * TILE + 4, 2 * TILE + 6, 3, 4, '#eab308');
    px(ctx, 1 * TILE + 8, 2 * TILE + 6, 3, 4, '#8b5cf6');

    // PC Desk (2..4, 3)
    drawDesk(ctx, 2, 3, 3, '#a47549', '#7d5633');
    // Monitor on (3, 3)
    const pcX = 3 * TILE;
    const pcY = 3 * TILE - 4;
    px(ctx, pcX + 1, pcY, 14, 11, '#293345');
    let pcAlert = false;
    let pcUnread = false;
    if (isCh2) {
      pcAlert = state.ch2.misuploaded && !state.ch2.contactedOrganizer;
      pcUnread = !state.ch2.openedPoster || pcAlert;
    } else {
      pcAlert = state.email.misshared && !state.email.linkRevoked;
      pcUnread = state.email.status === 'unread' || pcAlert;
    }
    const screenColor = pcAlert
      ? (tick % 30 < 15 ? '#e05252' : '#9b2c2c')
      : (pcUnread && tick % 40 < 20 ? '#5ec2d4' : '#3a91a8');
    px(ctx, pcX + 2, pcY + 1, 12, 8, screenColor);
    px(ctx, pcX + 4, pcY + 3, 8, 1, '#fff');
    px(ctx, pcX + 4, pcY + 5, 6, 1, '#dcfce7');
    px(ctx, pcX + 6, pcY + 11, 4, 2, '#475569');
    // Keyboard
    px(ctx, pcX + 2, pcY + 14, 12, 3, '#cbd5e1');

    // Lead Desk (6..8, 3)
    drawDesk(ctx, 6, 3, 3, '#9a6d45', '#745030');
    // Binder & coffee mug on lead desk
    px(ctx, 6 * TILE + 4, 3 * TILE + 2, 7, 9, '#2f7d6d');
    px(ctx, 6 * TILE + 5, 3 * TILE + 3, 5, 2, '#e2faf4');
    px(ctx, 8 * TILE + 4, 3 * TILE + 4, 5, 5, '#f8fafc');
    px(ctx, 8 * TILE + 5, 3 * TILE + 5, 3, 3, '#78350f');

    // Duty Desk (2..4, 8)
    drawDesk(ctx, 2, 8, 3, '#a47549', '#7d5633');
    // Handover Logbook
    px(ctx, 3 * TILE + 2, 8 * TILE + 2, 11, 10, '#fffdf5');
    px(ctx, 3 * TILE + 4, 8 * TILE + 4, 7, 1, '#2f7d6d');
    px(ctx, 3 * TILE + 4, 8 * TILE + 6, 6, 1, '#94a3b8');
    px(ctx, 3 * TILE + 4, 8 * TILE + 8, 7, 1, '#94a3b8');
    // Desk lamp
    px(ctx, 2 * TILE + 4, 8 * TILE + 2, 6, 5, '#e8b948');
    px(ctx, 2 * TILE + 6, 8 * TILE + 7, 2, 4, '#475569');

    // Plants
    drawPlant(ctx, 9, 2);
    drawPlant(ctx, 1, 13);
    drawPlant(ctx, 22, 11);

    // 6. Lab Furniture
    // Monitor Bench (18..20, 3)
    drawDesk(ctx, 18, 3, 3, '#9fb3c2', '#6d8291');
    const monX = 19 * TILE;
    const monY = 3 * TILE - 4;
    px(ctx, monX, monY, 16, 11, '#253142');
    if (isCh2 || state.labItems.monitor) {
      // Locked screensaver in Ch2 or after locking in Ch1
      px(ctx, monX + 2, monY + 2, 12, 7, '#1e293b');
      px(ctx, monX + 6, monY + 4, 4, 3, '#64748b');
    } else {
      // Live sensitive data curve in Ch1!
      px(ctx, monX + 2, monY + 2, 12, 7, '#112233');
      px(ctx, monX + 3, monY + 6, 3, 1, '#4ade80');
      px(ctx, monX + 6, monY + 4, 3, 1, '#facc15');
      px(ctx, monX + 9, monY + 3, 4, 1, '#f87171');
    }
    px(ctx, monX + 6, monY + 11, 4, 2, '#475569');

    // Lab Cabinet (22, 2..3)
    px(ctx, 22 * TILE + 1, 2 * TILE, 14, 30, '#7c90a1');
    px(ctx, 22 * TILE + 3, 2 * TILE + 3, 10, 10, '#a4b7c7');
    px(ctx, 22 * TILE + 3, 2 * TILE + 16, 10, 11, '#a4b7c7');
    px(ctx, 22 * TILE + 4, 2 * TILE + 7, 2, 3, '#334155');
    px(ctx, 22 * TILE + 4, 2 * TILE + 20, 2, 3, '#334155');

    // Sample Island Bench (15..17, 6)
    drawDesk(ctx, 15, 6, 3, '#b8c8d4', '#7b8f9e');
    const smpX = 16 * TILE;
    const smpY = 6 * TILE;
    if (isCh2 || state.labItems.samples) {
      // Closed opaque storage box in Ch2 or after storing in Ch1
      px(ctx, smpX - 2, smpY + 1, 20, 11, '#3b526b');
      px(ctx, smpX, smpY + 3, 16, 7, '#516c8a');
      px(ctx, smpX + 5, smpY + 5, 6, 2, '#93c5fd');
    } else {
      // Exposed labeled sample vials in Ch1!
      px(ctx, smpX - 3, smpY + 5, 22, 6, '#475569');
      px(ctx, smpX - 1, smpY - 1, 4, 8, '#7dd3fc');
      px(ctx, smpX + 6, smpY - 1, 4, 8, '#86efac');
      px(ctx, smpX + 13, smpY - 1, 4, 8, '#fde047');
      // Bright white visible code labels
      px(ctx, smpX - 1, smpY + 2, 4, 3, '#ffffff');
      px(ctx, smpX + 6, smpY + 2, 4, 3, '#ffffff');
      px(ctx, smpX + 13, smpY + 2, 4, 3, '#ffffff');
    }

    // 7. Reception Counter (12..14, 13)
    drawDesk(ctx, 12, 13, 3, '#8f6b4e', '#654a34');
    // Visitor logbook + sign
    px(ctx, 13 * TILE + 2, 13 * TILE + 2, 12, 9, '#fffdf5');
    px(ctx, 13 * TILE + 4, 13 * TILE + 4, 8, 1, '#2f7d6d');
    px(ctx, 13 * TILE + 4, 13 * TILE + 7, 7, 1, '#94a3b8');
    px(ctx, 12 * TILE + 4, 13 * TILE + 3, 8, 6, '#2f7d6d');

    // Subtle zone floor captions (crisp tiny labels)
    ctx.font = 'bold 7px sans-serif';
    ctx.fillStyle = 'rgba(65, 50, 30, 0.55)';
    ctx.fillText('辦公區', 1 * TILE + 4, 14 * TILE + 12);
    ctx.fillStyle = 'rgba(30, 72, 74, 0.55)';
    ctx.fillText('實驗區', 11 * TILE + 4, 9 * TILE + 12);
    ctx.fillStyle = 'rgba(45, 58, 72, 0.58)';
    ctx.fillText('訪客入口', 11 * TILE + 4, 14 * TILE + 12);
  }

  function drawDesk(ctx, tx, ty, widthTiles, topColor, frontColor) {
    const sx = tx * TILE;
    const sy = ty * TILE;
    const w = widthTiles * TILE;
    px(ctx, sx, sy, w, 12, topColor);
    px(ctx, sx, sy + 12, w, 4, frontColor);
    px(ctx, sx, sy, w, 1, 'rgba(255,255,255,0.28)');
    px(ctx, sx, sy + 15, w, 1, 'rgba(0,0,0,0.28)');
  }

  function drawPlant(ctx, tx, ty) {
    const sx = tx * TILE;
    const sy = ty * TILE;
    px(ctx, sx + 4, sy + 9, 8, 6, '#a85a3a');
    px(ctx, sx + 3, sy + 8, 10, 2, '#c26e4b');
    px(ctx, sx + 3, sy + 2, 10, 7, '#2f7d4f');
    px(ctx, sx + 5, sy, 6, 4, '#47a36b');
    px(ctx, sx + 2, sy + 4, 4, 4, '#3d8f5d');
  }

  function isSolid(tx, ty, npcs) {
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
    if (solidGrid[ty][tx]) return true;
    if (npcs) {
      for (const n of npcs) {
        if (n.x === tx && n.y === ty) return true;
      }
    }
    return false;
  }

  // Find interactable object or NPC directly in front of player (or adjacent if facing near it)
  function findNearbyTarget(pxTile, pyTile, dir, npcs) {
    const offsets = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0]
    };
    const [dx, dy] = offsets[dir] || [0, 1];
    const fx = pxTile + dx;
    const fy = pyTile + dy;

    // 1. Check tile directly in front first
    for (const npc of npcs) {
      if (npc.x === fx && npc.y === fy) {
        return { type: 'npc', id: npc.id, label: npc.label, x: npc.x, y: npc.y };
      }
    }
    for (const obj of INTERACTABLES) {
      if (obj.tiles.some((t) => t.x === fx && t.y === fy)) {
        return { type: 'object', id: obj.id, label: obj.label, x: obj.badgeX, y: obj.badgeY };
      }
    }

    // 2. Fallback: check any 4-adjacent tile so controls feel forgiving on touchscreens
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [ax, ay] of dirs) {
      const tx = pxTile + ax;
      const ty = pyTile + ay;
      for (const npc of npcs) {
        if (npc.x === tx && npc.y === ty) {
          return { type: 'npc', id: npc.id, label: npc.label, x: npc.x, y: npc.y };
        }
      }
      for (const obj of INTERACTABLES) {
        if (obj.tiles.some((t) => t.x === tx && t.y === ty)) {
          return { type: 'object', id: obj.id, label: obj.label, x: obj.badgeX, y: obj.badgeY };
        }
      }
    }

    return null;
  }

  window.BS.Map = {
    TILE,
    COLS,
    ROWS,
    INTERACTABLES,
    createInitialNPCs,
    createNPCsForChapter,
    getZoneName,
    drawMap,
    isSolid,
    findNearbyTarget
  };
})();
