(function () {
  window.BS = window.BS || {};

  const TILE = 16;
  const COLS = 16;
  const ROWS = 20;

  // ===== Floor 1 Collision Grid (16 x 20) =====
  function createFloor1SolidGrid() {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    // Outer Perimeter Walls
    for (let x = 0; x < COLS; x++) {
      grid[0][x] = true;
      grid[1][x] = true;
      grid[ROWS - 1][x] = true;
    }
    for (let y = 0; y < ROWS; y++) {
      grid[y][0] = true;
      grid[y][COLS - 1] = true;
    }

    // Main entrance automatic doors at bottom (x=6..9, y=19) - perimeter already marked true

    // Top-Left Stairwell & Elevator (x=1..4, y=2..3)
    // Wall above stairwell: (1..4, 2); Elevator door solid at (4, 3)
    // Stairs trigger tiles (2, 3) and (3, 3) are WALKABLE floor-change triggers!
    grid[2][1] = true; grid[2][2] = true; grid[2][3] = true; grid[2][4] = true;
    grid[3][1] = true;
    grid[3][4] = true; // Elevator door solid

    // Partition wall between stair lobby and cleanroom (x=5, y=2..4)
    grid[2][5] = true; grid[3][5] = true; grid[4][5] = true;

    // Cleanroom interior equipment & observation glass divider (x=6..14, y=2..6)
    // Glass divider along y=6 (doorway airlock at x=6, glass at 7..12, conference door at 13..14)
    for (let x = 6; x <= 14; x++) {
      grid[6][x] = true;
    }
    // Cleanroom interior equipment bays (inside cleanroom at y=3..4)
    grid[3][8] = true; grid[4][8] = true;
    grid[3][11] = true; grid[4][11] = true;
    grid[3][13] = true; grid[4][13] = true;

    // Lobby Sign Plaque decorative wall (x=1..4, y=7)
    grid[7][1] = true; grid[7][2] = true; grid[7][3] = true; grid[7][4] = true;

    // 1F Reception Counter (x=5..9, y=10)
    for (let x = 5; x <= 9; x++) {
      grid[10][x] = true;
    }

    // Lobby Lounge Sofa & Coffee Table (x=1..3, y=12..13)
    grid[12][1] = true; grid[13][1] = true; grid[13][2] = true;
    grid[12][3] = true;

    // Lobby Plants
    grid[8][1] = true;
    grid[8][14] = true;
    grid[18][1] = true;
    grid[18][14] = true;

    return grid;
  }

  // ===== Floor 2 Collision Grid (16 x 20) =====
  function createFloor2SolidGrid() {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    // Outer Perimeter Walls
    for (let x = 0; x < COLS; x++) {
      grid[0][x] = true;
      grid[1][x] = true;
      grid[ROWS - 1][x] = true;
    }
    for (let y = 0; y < ROWS; y++) {
      grid[y][0] = true;
      grid[y][COLS - 1] = true;
    }

    // Top-Left Stairwell & Elevator (aligned with 1F!)
    // Wall above stairwell: (1..4, 2); Elevator door solid at (4, 3)
    // Stairs trigger tiles (2, 3) and (3, 3) are WALKABLE floor-change triggers!
    grid[2][1] = true; grid[2][2] = true; grid[2][3] = true; grid[2][4] = true;
    grid[3][1] = true;
    grid[3][4] = true; // Elevator door solid

    // Notice board at top wall (5, 1) - perimeter wall already solid

    // Partition between corridor and 2F Measurement Lab (x=5, y=2..7)
    // Passable doorway at y=5..6, solid wall at y=2..4 and y=7
    grid[2][5] = true; grid[3][5] = true; grid[4][5] = true;
    grid[7][5] = true;

    // 2F Measurement Lab Furniture (x=6..14, y=2..7)
    // Monitor Bench (11..13, 3)
    grid[3][11] = true; grid[3][12] = true; grid[3][13] = true;
    // Tall Lab Cabinet (14, 2..3)
    grid[2][14] = true; grid[3][14] = true;
    // Sample Island Bench (8..11, 7)
    grid[7][8] = true; grid[7][9] = true; grid[7][10] = true; grid[7][11] = true;
    // Cryo / Instrument Rack (13..14, 6..7)
    grid[6][13] = true; grid[6][14] = true;
    grid[7][13] = true; grid[7][14] = true;

    // 2F Assistant Office Furniture (x=1..14, y=8..13)
    grid[8][1] = true;  // Bookshelf
    grid[9][2] = true; grid[9][3] = true; grid[9][4] = true; // PC Desk (interactive at y=10)
    grid[11][1] = true; // Water cooler / Coffee nook
    grid[12][2] = true; grid[12][3] = true; grid[12][4] = true; // Duty Desk (interactive at y=11 or 13)
    grid[9][14] = true; // Office Plant

    // 2F Lead Office Partition (y=14, x=1..14 with doorway at x=6..7)
    for (let x = 1; x <= 5; x++) {
      grid[14][x] = true;
    }
    for (let x = 8; x <= 14; x++) {
      grid[14][x] = true;
    }

    // Lead Office Furniture (x=1..14, y=15..18)
    grid[16][7] = true; grid[16][8] = true; grid[16][9] = true; // Lead Desk
    grid[15][12] = true; grid[15][13] = true; // Filing / NDA Cabinet
    grid[18][2] = true; // Executive Plant

    return grid;
  }

  const solidGrids = {
    1: createFloor1SolidGrid(),
    2: createFloor2SolidGrid()
  };

  // Floor transition trigger tiles (stepping onto these moves smoothly to targetFloor)
  const FLOOR_TRIGGERS = {
    1: [
      { x: 2, y: 3, toFloor: 2, spawnX: 2, spawnY: 4, spawnDir: 'down' },
      { x: 3, y: 3, toFloor: 2, spawnX: 3, spawnY: 4, spawnDir: 'down' }
    ],
    2: [
      { x: 2, y: 3, toFloor: 1, spawnX: 2, spawnY: 4, spawnDir: 'down' },
      { x: 3, y: 3, toFloor: 1, spawnX: 3, spawnY: 4, spawnDir: 'down' }
    ]
  };

  // Interactive objects per floor
  const INTERACTABLES = {
    1: [
      {
        id: 'reception',
        label: '1F 大門接待櫃台',
        tiles: [{ x: 5, y: 10 }, { x: 6, y: 10 }, { x: 7, y: 10 }, { x: 8, y: 10 }, { x: 9, y: 10 }],
        badgeX: 7,
        badgeY: 9.3
      },
      {
        id: 'elevator_up',
        label: '電梯（▲ 往 2F）',
        tiles: [{ x: 4, y: 3 }],
        badgeX: 4,
        badgeY: 2.3
      },
      {
        id: 'lobby_sign',
        label: '大廳形象牆（核准拍照區）',
        tiles: [{ x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }],
        badgeX: 2.5,
        badgeY: 6.3
      },
      {
        id: 'cleanroom_window',
        label: '管制實驗區觀測窗',
        tiles: [{ x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }],
        badgeX: 9.5,
        badgeY: 5.3
      },
      {
        id: 'conference_door',
        label: '1F 會議室',
        tiles: [{ x: 13, y: 6 }, { x: 14, y: 6 }],
        badgeX: 13.5,
        badgeY: 5.3
      }
    ],
    2: [
      {
        id: 'pc',
        label: '值班電腦',
        tiles: [{ x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }],
        badgeX: 3,
        badgeY: 8.3
      },
      {
        id: 'duty_desk',
        label: '值班桌（交班）',
        tiles: [{ x: 2, y: 12 }, { x: 3, y: 12 }, { x: 4, y: 12 }],
        badgeX: 3,
        badgeY: 11.3
      },
      {
        id: 'elevator_down',
        label: '電梯（▼ 往 1F）',
        tiles: [{ x: 4, y: 3 }],
        badgeX: 4,
        badgeY: 2.3
      },
      {
        id: 'notice_board',
        label: '營業秘密宣導布告欄',
        tiles: [{ x: 5, y: 1 }],
        badgeX: 5,
        badgeY: 0.7
      },
      {
        id: 'whiteboard',
        label: '實驗白板',
        tiles: [{ x: 8, y: 1 }, { x: 9, y: 1 }, { x: 10, y: 1 }],
        badgeX: 9,
        badgeY: 0.7
      },
      {
        id: 'monitor',
        label: '實驗室螢幕',
        tiles: [{ x: 11, y: 3 }, { x: 12, y: 3 }, { x: 13, y: 3 }],
        badgeX: 12,
        badgeY: 2.3
      },
      {
        id: 'samples',
        label: '樣品架與標籤',
        tiles: [{ x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }],
        badgeX: 9.5,
        badgeY: 6.3
      }
    ]
  };

  function createNPCsForChapter(chapter) {
    if (chapter === 2) {
      return [
        { id: 'npc_lead', sprite: 'lead', label: '負責人 阿明組長', floor: 2, x: 8, y: 17, dir: 'up' },
        { id: 'npc_colleague', sprite: 'colleague', label: '同事 阿文', floor: 2, x: 10, y: 4, dir: 'left' }
      ];
    }
    if (chapter === 5) {
      // Menu Ch3: 這份文件要怎麼標？ (internal 5)
      return [
        { id: 'npc_colleague', sprite: 'colleague', label: '同事 阿文', floor: 2, x: 10, y: 4, dir: 'left' },
        { id: 'npc_qing', sprite: 'qing', label: '接手同事 小晴', floor: 2, x: 5, y: 11, dir: 'left' },
        { id: 'npc_lead', sprite: 'lead', label: '負責人 阿明組長', floor: 2, x: 8, y: 17, dir: 'up' }
      ];
    }
    if (chapter === 3) {
      // Menu Ch5: 阿文的最後一天 (internal 3)
      return [
        { id: 'npc_lead', sprite: 'lead', label: '負責人 阿明組長', floor: 1, x: 4, y: 10, dir: 'right' },
        { id: 'npc_colleague', sprite: 'colleague', label: '同事 阿文', floor: 2, x: 10, y: 4, dir: 'left' },
        { id: 'npc_qing', sprite: 'qing', label: '接手同事 小晴', floor: 2, x: 5, y: 11, dir: 'left' }
      ];
    }
    if (chapter === 4) {
      // Menu Ch4: 這批資料要列入清單嗎？ (internal 4)
      return [
        { id: 'npc_colleague', sprite: 'colleague', label: '同事 阿文', floor: 1, x: 9, y: 6, dir: 'down' },
        { id: 'npc_qing', sprite: 'qing', label: '盤點同事 小晴', floor: 2, x: 5, y: 11, dir: 'left' },
        { id: 'npc_lead', sprite: 'lead', label: '負責人 阿明組長', floor: 2, x: 8, y: 17, dir: 'up' }
      ];
    }
    // Chapter 1: 寄出之前
    return [
      { id: 'npc_lead', sprite: 'lead', label: '負責人 阿明組長', floor: 2, x: 8, y: 17, dir: 'up' },
      { id: 'npc_colleague', sprite: 'colleague', label: '同事 阿文', floor: 2, x: 10, y: 4, dir: 'left' },
      { id: 'npc_visitor', sprite: 'visitor', label: '訪客 陳先生', floor: 1, x: 7, y: 11, dir: 'up' }
    ];
  }

  function createInitialNPCs() {
    return createNPCsForChapter(1);
  }

  function getZoneName(floor, tx, ty) {
    if (floor === 1) {
      if (tx <= 4 && ty <= 5) return '1F 梯廳（往 2F）';
      if (tx >= 6 && ty <= 6) return '1F 管制實驗區（觀測廊）';
      if (ty >= 14) return '1F 大門大廳';
      return '1F 大門大廳與櫃台';
    }
    if (tx <= 5 && ty <= 5) return '2F 梯廳（往 1F）';
    if (tx >= 6 && ty <= 7) return '2F 量測實驗區（門禁管制）';
    if (ty >= 14) return '2F 組長辦公室';
    return '2F 辦公區';
  }

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
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

  function drawStairwellAndElevator(ctx, floor, tick) {
    // Back divider wall above stairwell (x=1..4, y=2)
    for (let x = 1; x <= 4; x++) {
      px(ctx, x * TILE, 2 * TILE, TILE, TILE, '#44546b');
      px(ctx, x * TILE, 2 * TILE + 12, TILE, 4, '#2f3b4d');
    }
    // Staircase steps on (2..3, 3)
    const sx = 2 * TILE;
    const sy = 3 * TILE;
    px(ctx, sx, sy, 2 * TILE, TILE, '#cbd5e1');
    for (let i = 0; i < 4; i++) {
      const shade = i % 2 === 0 ? '#94a3b8' : '#b8c4d4';
      px(ctx, sx + 1, sy + i * 4, 2 * TILE - 2, 3, shade);
      px(ctx, sx + 1, sy + i * 4 + 3, 2 * TILE - 2, 1, '#64748b');
    }
    // Handrail accent
    px(ctx, sx, sy, 2, TILE, '#475569');
    px(ctx, sx + 2 * TILE - 2, sy, 2, TILE, '#475569');

    // Elevator doors on (4, 3)
    const ex = 4 * TILE;
    const ey = 3 * TILE - 4;
    px(ctx, ex + 1, ey, 14, 19, '#475569');
    px(ctx, ex + 2, ey + 5, 5, 13, '#94a3b8');
    px(ctx, ex + 9, ey + 5, 5, 13, '#94a3b8');
    px(ctx, ex + 7, ey + 5, 2, 13, '#334155');
    // Elevator floor indicator LED
    px(ctx, ex + 4, ey + 1, 8, 3, '#0f172a');
    px(ctx, ex + 6, ey + 2, 4, 1, tick % 50 < 35 ? '#38bdf8' : '#facc15');

    // Direction sign on wall (y=2)
    const label = floor === 1 ? '▲ 往2F' : '▼ 往1F';
    px(ctx, 1 * TILE + 4, 2 * TILE + 2, 40, 9, '#1e293b');
    ctx.fillStyle = floor === 1 ? '#7dd3fc' : '#fde68a';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText(label, 1 * TILE + 7, 2 * TILE + 9);
  }

  // ===== Render Floor 1 (16 x 20) =====
  function drawFloor1(ctx, state, tick) {
    const isCh2 = state.chapter === 2;

    // 1. Lobby, Corridor & Stair Landing Floor Tiles
    for (let y = 2; y <= 18; y++) {
      for (let x = 1; x <= 14; x++) {
        const sx = x * TILE;
        const sy = y * TILE;
        if (x <= 5 && y <= 5) {
          // Stair lobby clean slate tile
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#dfe5ec' : '#d4dce6');
        } else if (x >= 6 && y <= 5) {
          // Cleanroom interior cool cyan tiles (behind observation glass)
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#cfe8ef' : '#c3e0e8');
        } else {
          // Warm terrazzo lobby floor
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#e7e2d5' : '#ddd7c7');
        }
      }
    }

    // Emerald teal runner carpet from entrance doors up to reception (x=6..9, y=12..18)
    px(ctx, 6 * TILE, 12 * TILE + 2, 4 * TILE, 7 * TILE - 4, '#2b6b5e');
    px(ctx, 6 * TILE + 2, 12 * TILE + 4, 4 * TILE - 4, 7 * TILE - 8, '#3c8778');

    // Photo spot marker in front of Lobby Sign Plaque (x=2..3, y=8)
    px(ctx, 2 * TILE + 1, 8 * TILE + 2, 2 * TILE - 2, 12, 'rgba(47, 125, 109, 0.20)');
    px(ctx, 2 * TILE + 4, 8 * TILE + 4, 2 * TILE - 8, 8, 'rgba(47, 125, 109, 0.35)');

    // 2. Outer Perimeter Walls
    for (let x = 0; x < COLS; x++) {
      px(ctx, x * TILE, 0, TILE, TILE, '#354157');
      px(ctx, x * TILE, TILE, TILE, TILE, '#d2c9b8');
      px(ctx, x * TILE, TILE + 13, TILE, 3, '#8894a6');
    }
    for (let y = 0; y < ROWS; y++) {
      px(ctx, 0, y * TILE, TILE, TILE, '#2b3548');
      px(ctx, (COLS - 1) * TILE, y * TILE, TILE, TILE, '#2b3548');
    }
    for (let x = 0; x < COLS; x++) {
      px(ctx, x * TILE, (ROWS - 1) * TILE, TILE, TILE, '#2b3548');
    }

    // Main Entrance Automatic Glass Doors at bottom (x=6..9, y=19)
    px(ctx, 6 * TILE, 19 * TILE, 4 * TILE, TILE, '#4b7e94');
    px(ctx, 6 * TILE + 2, 19 * TILE + 2, 14, 12, isCh2 ? '#3d587a' : '#9dd6eb');
    px(ctx, 7 * TILE + 1, 19 * TILE + 2, 14, 12, isCh2 ? '#3d587a' : '#9dd6eb');
    px(ctx, 8 * TILE + 1, 19 * TILE + 2, 14, 12, isCh2 ? '#3d587a' : '#9dd6eb');
    px(ctx, 9 * TILE + 1, 19 * TILE + 2, 13, 12, isCh2 ? '#3d587a' : '#9dd6eb');

    // 3. Top-Left Stairwell & Elevator
    drawStairwellAndElevator(ctx, 1, tick);

    // Divider wall between stair lobby and cleanroom (x=5, y=2..4)
    for (let y = 2; y <= 4; y++) {
      px(ctx, 5 * TILE, y * TILE, TILE, TILE, '#44546b');
      px(ctx, 5 * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4, '#55667e');
    }

    // 4. Cleanroom Observation Bay & Corridor (x=6..14, y=2..6)
    // Cleanroom glass windows along y=6 (x=6..14)
    for (let x = 6; x <= 14; x++) {
      const sx = x * TILE;
      const sy = 6 * TILE;
      px(ctx, sx, sy, TILE, TILE, '#44546b');
      if (x === 6) {
        // Airlock Door + Keycard Reader
        px(ctx, sx + 2, sy + 1, 12, 14, '#64748b');
        px(ctx, sx + 4, sy + 3, 8, 6, '#94d2e6');
        px(ctx, sx - 2, sy + 2, 3, 5, '#1e293b');
        px(ctx, sx - 1, sy + 3, 2, 2, tick % 60 < 40 ? '#ef4444' : '#f87171');
      } else if (x >= 7 && x <= 12) {
        // Observation glass window
        px(ctx, sx + 1, sy + 3, TILE - 2, 9, isCh2 ? '#3a576b' : '#8fd2e3');
        px(ctx, sx + 2, sy + 4, TILE - 4, 3, isCh2 ? '#527791' : '#d2f4fc');
      } else {
        // Conference wooden door (x=13..14)
        px(ctx, sx + 1, sy + 1, TILE - 2, TILE - 2, '#8b5e3c');
        px(ctx, sx + 3, sy + 3, TILE - 6, 6, '#b78963');
      }
    }

    // Cleanroom interior equipment bays (x=8, 11, 13, y=3..4)
    [8, 11, 13].forEach((bx, idx) => {
      px(ctx, bx * TILE, 3 * TILE + 4, 18, 22, '#e2e8f0');
      px(ctx, bx * TILE + 2, 3 * TILE + 6, 14, 18, '#f8fafc');
      px(ctx, bx * TILE + 4, 3 * TILE + 8, 10, 7, '#334155');
      const ledOn = (tick + idx * 19) % 46 < 28;
      px(ctx, bx * TILE + 5, 3 * TILE + 10, 3, 2, ledOn ? '#38bdf8' : '#0284c7');
      px(ctx, bx * TILE + 9, 3 * TILE + 10, 3, 2, '#34d399');
    });

    // Cleanroom caption on top wall
    ctx.fillStyle = 'rgba(25, 65, 80, 0.75)';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.fillText('1F 管制實驗區（門禁觀測）', 7 * TILE + 2, 2 * TILE + 10);

    // 5. Lobby Sign Plaque on wall (x=1..4, y=7)
    for (let x = 1; x <= 4; x++) {
      px(ctx, x * TILE, 7 * TILE, TILE, TILE, '#1d4d44');
    }
    px(ctx, 1 * TILE + 3, 7 * TILE + 2, 4 * TILE - 6, 12, '#2f7d6d');
    ctx.fillStyle = '#e8fff9';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('中研院 RCCI 形象牆', 1 * TILE + 7, 7 * TILE + 9);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('核准拍照區 PHOTO SPOT', 1 * TILE + 7, 7 * TILE + 13);

    // 6. 1F Reception Counter (x=5..9, y=10)
    drawDesk(ctx, 5, 10, 5, '#8f6b4e', '#654a34');
    // Visitor logbook, desk monitor, registration badges
    px(ctx, 6 * TILE + 2, 10 * TILE + 2, 12, 9, '#fffdf5');
    px(ctx, 6 * TILE + 4, 10 * TILE + 4, 8, 1, '#2f7d6d');
    px(ctx, 6 * TILE + 4, 10 * TILE + 7, 7, 1, '#94a3b8');
    px(ctx, 5 * TILE + 3, 10 * TILE + 3, 10, 6, '#2f7d6d');
    px(ctx, 8 * TILE + 2, 10 * TILE + 1, 10, 8, '#293345');
    px(ctx, 8 * TILE + 3, 10 * TILE + 2, 8, 5, isCh2 ? '#334155' : '#67c8db');

    // 7. Lobby Lounge Sofa & Coffee Table (x=1..3, y=12..13)
    px(ctx, 1 * TILE + 2, 12 * TILE + 2, 12, 28, '#4f6d8a');
    px(ctx, 1 * TILE + 4, 12 * TILE + 4, 8, 24, '#6b8cae');
    px(ctx, 2 * TILE + 2, 13 * TILE + 2, 12, 12, '#a47549');
    px(ctx, 2 * TILE + 4, 13 * TILE + 4, 8, 8, '#c7996b');

    // 8. Lobby Plants
    drawPlant(ctx, 1, 8);
    drawPlant(ctx, 14, 8);
    drawPlant(ctx, 1, 18);
    drawPlant(ctx, 14, 18);

    // Zone captions
    ctx.font = 'bold 7px sans-serif';
    ctx.fillStyle = 'rgba(55, 65, 80, 0.58)';
    ctx.fillText('1F 大門大廳', 2 * TILE, 17 * TILE + 12);
    ctx.fillText('接待櫃台', 6 * TILE + 4, 11 * TILE + 12);
  }

  // ===== Render Floor 2 (16 x 20) =====
  function drawFloor2(ctx, state, tick) {
    const isCh2 = state.chapter === 2;
    const isCh3 = state.chapter === 3;
    const isCh4 = state.chapter === 4;
    const isCh1 = state.chapter === 1;

    // 1. Floor Tiles per Zone
    for (let y = 2; y <= 18; y++) {
      for (let x = 1; x <= 14; x++) {
        const sx = x * TILE;
        const sy = y * TILE;
        if (x >= 6 && y <= 7) {
          // 2F Measurement Lab cool anti-static floor
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#d7ebe9' : '#cce3e0');
          px(ctx, sx, sy, TILE, 1, 'rgba(60, 105, 110, 0.09)');
          px(ctx, sx, sy, 1, TILE, 'rgba(60, 105, 110, 0.09)');
        } else if (y <= 5 && x <= 5) {
          // 2F Stair landing clean neutral tile
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#e2e5ea' : '#d6dbe2');
        } else if (y >= 14) {
          // 2F Lead Office rich warm oak wood
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#dbc297' : '#d2b78a');
          px(ctx, sx, sy + 7, TILE, 1, 'rgba(110, 78, 42, 0.16)');
        } else {
          // 2F Assistant Office warm wood planks
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#e4cfa8' : '#dcc49b');
          px(ctx, sx, sy + 7, TILE, 1, 'rgba(130, 95, 52, 0.14)');
          px(ctx, sx, sy + 15, TILE, 1, 'rgba(130, 95, 52, 0.14)');
        }
      }
    }

    // 2. Outer Perimeter Walls
    for (let x = 0; x < COLS; x++) {
      px(ctx, x * TILE, 0, TILE, TILE, '#354157');
      px(ctx, x * TILE, TILE, TILE, TILE, x >= 6 ? '#bfd0d6' : '#cbbba0');
      px(ctx, x * TILE, TILE + 13, TILE, 3, '#8894a6');
    }
    for (let y = 0; y < ROWS; y++) {
      px(ctx, 0, y * TILE, TILE, TILE, '#2b3548');
      px(ctx, (COLS - 1) * TILE, y * TILE, TILE, TILE, '#2b3548');
    }
    for (let x = 0; x < COLS; x++) {
      px(ctx, x * TILE, (ROWS - 1) * TILE, TILE, TILE, '#2b3548');
    }

    // Office windows on west wall (y=9..12) with afternoon sunlight / dusk twilight
    [9, 11].forEach((wy) => {
      px(ctx, 4, wy * TILE + 1, 8, TILE - 2, '#55657d');
      const winSky = isCh2 ? '#455987' : isCh4 ? '#f29f67' : '#f8d58b';
      px(ctx, 6, wy * TILE + 3, 5, TILE - 6, winSky);
    });

    // 3. Top-Left Stairwell & Elevator
    drawStairwellAndElevator(ctx, 2, tick);

    // Corridor Notice Board on top wall (x=5, y=1)
    px(ctx, 5 * TILE + 1, 7, 14, 17, '#7c5836');
    px(ctx, 5 * TILE + 3, 9, 10, 13, '#d6b485');
    px(ctx, 5 * TILE + 4, 11, 4, 4, '#fffdf5');
    px(ctx, 5 * TILE + 9, 12, 3, 5, '#fef08a');
    px(ctx, 5 * TILE + 4, 17, 7, 3, '#bbf7d0');

    // 4. Vertical Glass Partition to 2F Measurement Lab (x=5, doorway at y=5..6)
    for (let y = 2; y <= 7; y++) {
      if (y !== 5 && y !== 6) {
        px(ctx, 5 * TILE, y * TILE, TILE, TILE, '#44546b');
        px(ctx, 5 * TILE + 4, y * TILE + 2, 8, 12, '#8cc4d4');
        px(ctx, 5 * TILE + 5, y * TILE + 3, 2, 10, '#c8edf7');
      }
    }
    // Keycard reader next to Lab doorway (5, 4)
    px(ctx, 5 * TILE + 2, 4 * TILE + 10, 4, 5, '#1e293b');
    px(ctx, 5 * TILE + 3, 4 * TILE + 11, 2, 2, tick % 60 < 45 ? '#34d399' : '#10b981');

    // 5. 2F Measurement Lab Furniture (x=6..14, y=2..7)
    // Whiteboard on Lab Top Wall (x=8..10, y=1)
    const wbX = 8 * TILE;
    const wbY = 5;
    px(ctx, wbX, wbY, 3 * TILE, 22, '#5a667a');
    px(ctx, wbX + 2, wbY + 2, 3 * TILE - 4, 18, '#f8fafc');
    if (!isCh1 || state.labItems.whiteboard) {
      px(ctx, wbX + 8, wbY + 8, 30, 1, '#e2e8f0');
      px(ctx, wbX + 38, wbY + 5, 2, 2, '#60d394');
    } else {
      px(ctx, wbX + 5, wbY + 5, 16, 2, '#d64545');
      px(ctx, wbX + 5, wbY + 9, 26, 2, '#2b6cb0');
      px(ctx, wbX + 5, wbY + 13, 18, 2, '#d97706');
    }

    // Monitor Bench (11..13, 3)
    drawDesk(ctx, 11, 3, 3, '#9fb3c2', '#6d8291');
    const monX = 12 * TILE;
    const monY = 3 * TILE - 4;
    px(ctx, monX, monY, 16, 11, '#253142');
    if (isCh3) {
      // Lab Record Terminal in Ch4 (internal 3)
      px(ctx, monX + 2, monY + 2, 12, 7, '#12314a');
      px(ctx, monX + 3, monY + 3, 9, 1, '#7dd3fc');
      px(ctx, monX + 3, monY + 6, state.ch3.rawLogLocation === 'project' ? 10 : 5, 2, state.ch3.rawLogLocation === 'project' ? '#4ade80' : '#fbbf24');
    } else if (isCh4) {
      // Instrument PC in Ch3 (internal 4)
      px(ctx, monX + 2, monY + 2, 12, 7, '#132d42');
      px(ctx, monX + 3, monY + 3, 10, 1, '#93c5fd');
      px(ctx, monX + 3, monY + 6, state.ch4.updatedSaved ? 10 : 6, 2, state.ch4.updatedSaved ? '#4ade80' : '#f59e0b');
    } else if (!isCh1 || state.labItems.monitor) {
      px(ctx, monX + 2, monY + 2, 12, 7, '#1e293b');
      px(ctx, monX + 6, monY + 4, 4, 3, '#64748b');
    } else {
      px(ctx, monX + 2, monY + 2, 12, 7, '#112233');
      px(ctx, monX + 3, monY + 6, 3, 1, '#4ade80');
      px(ctx, monX + 6, monY + 4, 3, 1, '#facc15');
      px(ctx, monX + 9, monY + 3, 4, 1, '#f87171');
    }
    px(ctx, monX + 6, monY + 11, 4, 2, '#475569');

    // Tall Lab Cabinet (14, 2..3)
    px(ctx, 14 * TILE + 1, 2 * TILE, 14, 30, '#7c90a1');
    px(ctx, 14 * TILE + 3, 2 * TILE + 3, 10, 10, '#a4b7c7');
    px(ctx, 14 * TILE + 3, 2 * TILE + 16, 10, 11, '#a4b7c7');

    // Sample Island Bench (8..11, 7)
    drawDesk(ctx, 8, 7, 4, '#b8c8d4', '#7b8f9e');
    const smpX = 9 * TILE;
    const smpY = 7 * TILE;
    if (isCh4) {
      // Open Lab Record Book on the Bench
      px(ctx, smpX - 3, smpY + 1, 22, 11, '#fffdf5');
      px(ctx, smpX + 7, smpY + 1, 2, 11, '#cbd5e1');
      px(ctx, smpX - 1, smpY + 3, 7, 1, '#2f7d6d');
      px(ctx, smpX - 1, smpY + 6, 6, 1, '#94a3b8');
      px(ctx, smpX + 10, smpY + 3, 7, 1, state.ch4.draftSaved ? '#22c55e' : '#e05252');
      px(ctx, smpX + 10, smpY + 6, 6, 1, '#94a3b8');
    } else if (!isCh1 || state.labItems.samples) {
      px(ctx, smpX - 2, smpY + 1, 20, 11, '#3b526b');
      px(ctx, smpX, smpY + 3, 16, 7, '#516c8a');
      px(ctx, smpX + 5, smpY + 5, 6, 2, '#93c5fd');
    } else {
      px(ctx, smpX - 3, smpY + 5, 22, 6, '#475569');
      px(ctx, smpX - 1, smpY - 1, 4, 8, '#7dd3fc');
      px(ctx, smpX + 6, smpY - 1, 4, 8, '#86efac');
      px(ctx, smpX + 13, smpY - 1, 4, 8, '#fde047');
      px(ctx, smpX - 1, smpY + 2, 4, 3, '#ffffff');
      px(ctx, smpX + 6, smpY + 2, 4, 3, '#ffffff');
      px(ctx, smpX + 13, smpY + 2, 4, 3, '#ffffff');
    }

    // Cryo / Instrument Rack (13..14, 6..7)
    px(ctx, 13 * TILE + 1, 6 * TILE, 30, 30, '#475569');
    px(ctx, 13 * TILE + 3, 6 * TILE + 3, 26, 11, '#1e293b');
    px(ctx, 13 * TILE + 5, 6 * TILE + 6, 8, 4, '#22c55e');
    px(ctx, 13 * TILE + 16, 6 * TILE + 6, 8, 2, tick % 35 < 20 ? '#facc15' : '#ca8a04');
    px(ctx, 13 * TILE + 3, 6 * TILE + 16, 26, 11, '#64748b');

    // 6. 2F Assistant Office (x=1..14, y=8..13)
    // Bookshelf (1, 8)
    px(ctx, 1 * TILE + 1, 8 * TILE - 4, 14, 19, '#6e4c30');
    px(ctx, 1 * TILE + 3, 8 * TILE - 2, 10, 5, '#4c3420');
    px(ctx, 1 * TILE + 4, 8 * TILE - 1, 2, 4, '#c75b39');
    px(ctx, 1 * TILE + 7, 8 * TILE - 1, 2, 4, '#3b82f6');
    px(ctx, 1 * TILE + 10, 8 * TILE - 1, 2, 4, '#10b981');

    // Water cooler (1, 11)
    px(ctx, 1 * TILE + 3, 11 * TILE + 2, 10, 13, '#e2e8f0');
    px(ctx, 1 * TILE + 4, 11 * TILE - 3, 8, 6, '#93c5fd');
    px(ctx, 1 * TILE + 5, 11 * TILE + 8, 2, 2, '#ef4444');
    px(ctx, 1 * TILE + 9, 11 * TILE + 8, 2, 2, '#3b82f6');

    // PC Desk (2..4, 9)
    drawDesk(ctx, 2, 9, 3, '#a47549', '#7d5633');
    const pcX = 3 * TILE;
    const pcY = 9 * TILE - 4;
    px(ctx, pcX + 1, pcY, 14, 11, '#293345');
    let pcAlert = false;
    let pcUnread = false;
    if (isCh2) {
      pcAlert = state.ch2.misuploaded && !state.ch2.contactedOrganizer;
      pcUnread = !state.ch2.openedPoster || pcAlert;
    } else if (isCh3) {
      pcAlert = state.ch3.interruptedByEarlyRevoke && !state.ch3.adminTransferCompleted;
      pcUnread = !state.ch3.openedChecklist || pcAlert;
    } else if (isCh4) {
      pcUnread = !state.ch4.updatedSaved;
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
    px(ctx, pcX + 2, pcY + 14, 12, 3, '#cbd5e1');

    // Duty Desk (2..4, 12)
    drawDesk(ctx, 2, 12, 3, '#a47549', '#7d5633');
    px(ctx, 3 * TILE + 2, 12 * TILE + 2, 11, 10, '#fffdf5');
    px(ctx, 3 * TILE + 4, 12 * TILE + 4, 7, 1, '#2f7d6d');
    px(ctx, 3 * TILE + 4, 12 * TILE + 6, 6, 1, '#94a3b8');
    px(ctx, 2 * TILE + 4, 12 * TILE + 2, 6, 5, '#e8b948');
    px(ctx, 2 * TILE + 6, 12 * TILE + 7, 2, 4, '#475569');

    // Office Plant (14, 9)
    drawPlant(ctx, 14, 9);

    // 7. 2F Lead Office Glass Partition (y=14, doorway at x=6..7)
    for (let x = 1; x <= 14; x++) {
      if (x !== 6 && x !== 7) {
        px(ctx, x * TILE, 14 * TILE, TILE, TILE, '#44546b');
        px(ctx, x * TILE + 1, 14 * TILE + 3, TILE - 2, 8, '#99cddb');
        px(ctx, x * TILE + 2, 14 * TILE + 4, TILE - 4, 3, '#d4f2fa');
      }
    }

    // Lead Office Furniture (y=15..18)
    drawDesk(ctx, 7, 16, 3, '#9a6d45', '#745030');
    // NDA Binder & coffee mug on lead desk
    px(ctx, 7 * TILE + 4, 16 * TILE + 2, 7, 9, '#2f7d6d');
    px(ctx, 7 * TILE + 5, 16 * TILE + 3, 5, 2, '#e2faf4');
    px(ctx, 9 * TILE + 4, 16 * TILE + 4, 5, 5, '#f8fafc');
    px(ctx, 9 * TILE + 5, 16 * TILE + 5, 3, 3, '#78350f');

    // Filing cabinet / NDA archive (12..13, 15)
    px(ctx, 12 * TILE + 2, 15 * TILE, 26, 15, '#64748b');
    px(ctx, 12 * TILE + 4, 15 * TILE + 2, 10, 5, '#94a3b8');
    px(ctx, 12 * TILE + 4, 15 * TILE + 8, 10, 5, '#94a3b8');
    px(ctx, 13 * TILE + 2, 15 * TILE + 2, 10, 5, '#94a3b8');
    px(ctx, 13 * TILE + 2, 15 * TILE + 8, 10, 5, '#94a3b8');

    // Executive Plant (2, 18)
    drawPlant(ctx, 2, 18);

    // Zone captions
    ctx.font = 'bold 7px sans-serif';
    ctx.fillStyle = 'rgba(65, 50, 30, 0.58)';
    ctx.fillText('2F 辦公區', 6 * TILE, 9 * TILE + 12);
    ctx.fillText('組長辦公室', 6 * TILE, 18 * TILE + 12);
    ctx.fillStyle = 'rgba(30, 72, 74, 0.62)';
    ctx.fillText('2F 量測實驗區', 8 * TILE, 3 * TILE + 12);
  }

  function drawMap(ctx, state, floor, tick) {
    if (floor === 1) {
      drawFloor1(ctx, state, tick);
    } else {
      drawFloor2(ctx, state, tick);
    }
  }

  function isSolid(floor, tx, ty, npcs) {
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
    const grid = solidGrids[floor] || solidGrids[2];
    if (grid[ty][tx]) return true;
    if (npcs) {
      for (const n of npcs) {
        if (n.floor === floor && n.x === tx && n.y === ty) return true;
      }
    }
    return false;
  }

  function getFloorTrigger(floor, tx, ty) {
    const list = FLOOR_TRIGGERS[floor] || [];
    return list.find((t) => t.x === tx && t.y === ty) || null;
  }

  function getObjectLabel(obj, chapter) {
    if (chapter === 4) {
      if (obj.id === 'pc') return '值班電腦（研發成果清單）';
      if (obj.id === 'duty_desk') return '值班桌（第三章交班）';
    } else if (chapter === 3) {
      if (obj.id === 'monitor') return '實驗紀錄電腦（路徑對照）';
    }
    return obj.label;
  }

  function findNearbyTarget(floor, pxTile, pyTile, dir, npcs, chapter) {
    const offsets = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0]
    };
    const [dx, dy] = offsets[dir] || [0, 1];
    const fx = pxTile + dx;
    const fy = pyTile + dy;
    const floorObjs = INTERACTABLES[floor] || [];
    const floorNpcs = (npcs || []).filter((n) => n.floor === floor);

    for (const npc of floorNpcs) {
      if (npc.x === fx && npc.y === fy) {
        return { type: 'npc', id: npc.id, label: npc.label, x: npc.x, y: npc.y };
      }
    }
    for (const obj of floorObjs) {
      if (obj.tiles.some((t) => t.x === fx && t.y === fy)) {
        return { type: 'object', id: obj.id, label: getObjectLabel(obj, chapter), x: obj.badgeX, y: obj.badgeY };
      }
    }

    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [ax, ay] of dirs) {
      const tx = pxTile + ax;
      const ty = pyTile + ay;
      for (const npc of floorNpcs) {
        if (npc.x === tx && npc.y === ty) {
          return { type: 'npc', id: npc.id, label: npc.label, x: npc.x, y: npc.y };
        }
      }
      for (const obj of floorObjs) {
        if (obj.tiles.some((t) => t.x === tx && t.y === ty)) {
          return { type: 'object', id: obj.id, label: getObjectLabel(obj, chapter), x: obj.badgeX, y: obj.badgeY };
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
    FLOOR_TRIGGERS,
    createInitialNPCs,
    createNPCsForChapter,
    getZoneName,
    drawMap,
    isSolid,
    getFloorTrigger,
    findNearbyTarget
  };
})();