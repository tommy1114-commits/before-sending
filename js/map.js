(function () {
  window.BS = window.BS || {};

  const TILE = 16;
  const COLS = 24;
  const ROWS = 16;

  // ===== Floor 1 Collision Grid =====
  function createFloor1SolidGrid() {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    // Perimeter walls
    for (let x = 0; x < COLS; x++) {
      grid[0][x] = true;
      grid[1][x] = true;
      grid[ROWS - 1][x] = true;
    }
    for (let y = 0; y < ROWS; y++) {
      grid[y][0] = true;
      grid[y][COLS - 1] = true;
    }

    // Left Stairwell / Elevator enclosure
    // Wall above stairwell: (1..3, 7); Elevator door solid at (3, 8)
    // Stairs tiles (1, 8) and (2, 8) are WALKABLE floor-change triggers!
    grid[7][1] = true; grid[7][2] = true; grid[7][3] = true;
    grid[8][3] = true;

    // Lobby Lounge Sofa & Coffee Table
    grid[3][1] = true; grid[4][1] = true; grid[4][2] = true;

    // Lobby Plants
    grid[2][4] = true;
    grid[2][9] = true;
    grid[14][1] = true;
    grid[14][9] = true;

    // 1F Main Entrance Reception Counter (5..8, 11)
    grid[11][5] = true; grid[11][6] = true; grid[11][7] = true; grid[11][8] = true;

    // North Courtyard Glass & Conference Hall Facade (x=10..22, y=2..5)
    for (let y = 2; y <= 5; y++) {
      for (let x = 10; x <= 22; x++) {
        grid[y][x] = true;
      }
    }

    // South-Right Controlled Cleanroom Observation Bay (x=11..22, y=8..14)
    for (let y = 8; y <= 14; y++) {
      for (let x = 11; x <= 22; x++) {
        grid[y][x] = true;
      }
    }

    return grid;
  }

  // ===== Floor 2 Collision Grid =====
  function createFloor2SolidGrid() {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    // Perimeter walls
    for (let x = 0; x < COLS; x++) {
      grid[0][x] = true;
      grid[1][x] = true;
      grid[ROWS - 1][x] = true;
    }
    for (let y = 0; y < ROWS; y++) {
      grid[y][0] = true;
      grid[y][COLS - 1] = true;
    }

    // Left Stairwell / Elevator (aligned with 1F!)
    // Stairs tiles (1, 8) and (2, 8) are WALKABLE floor-change triggers!
    grid[7][1] = true; grid[7][2] = true; grid[7][3] = true;
    grid[8][3] = true;

    // 2F Assistant Office Furniture (x=1..9, y=2..6)
    grid[2][1] = true; // Bookshelf
    grid[2][9] = true; // Water cooler / Coffee nook
    grid[3][2] = true; grid[3][3] = true; grid[3][4] = true; // PC Desk
    grid[3][6] = true; grid[3][7] = true; grid[3][8] = true; // Duty Desk

    // 2F Lead Office Partition (x=4..10, y=10..14) — wide doorway at x=5..6, y=10
    for (let y = 10; y <= 14; y++) {
      grid[y][4] = true;
    }
    grid[10][7] = true; grid[10][8] = true; grid[10][9] = true; grid[10][10] = true;
    // Lead Office Furniture
    grid[13][7] = true; grid[13][8] = true; grid[13][9] = true; // Lead Desk
    grid[11][10] = true; // Contract / NDA Cabinet
    grid[14][5] = true;  // Plant

    // Vertical Glass Partition to 2F Measurement Lab (x=11, doorway at y=6..7)
    for (let y = 2; y <= 14; y++) {
      if (y !== 6 && y !== 7) {
        grid[y][11] = true;
      }
    }

    // 2F Measurement Lab Furniture (x=12..22, y=2..14)
    grid[3][18] = true; grid[3][19] = true; grid[3][20] = true; // Monitor Bench
    grid[2][22] = true; grid[3][22] = true; // Tall Lab Cabinet
    grid[11][15] = true; grid[11][16] = true; grid[11][17] = true; // Sample Island Bench
    // De-identified Pixel Lab Equipment Bays
    grid[13][13] = true; grid[14][13] = true; // Left Cryo/Test Rack
    grid[12][20] = true; grid[12][21] = true; grid[13][20] = true; grid[13][21] = true; // Right Instrument Rack

    return grid;
  }

  const solidGrids = {
    1: createFloor1SolidGrid(),
    2: createFloor2SolidGrid()
  };

  // Floor transition trigger tiles (stepping onto these moves smoothly to targetFloor)
  const FLOOR_TRIGGERS = {
    1: [
      { x: 1, y: 8, toFloor: 2, spawnX: 2, spawnY: 9, spawnDir: 'down' },
      { x: 2, y: 8, toFloor: 2, spawnX: 2, spawnY: 9, spawnDir: 'down' }
    ],
    2: [
      { x: 1, y: 8, toFloor: 1, spawnX: 2, spawnY: 9, spawnDir: 'down' },
      { x: 2, y: 8, toFloor: 1, spawnX: 2, spawnY: 9, spawnDir: 'down' }
    ]
  };

  // Interactive objects per floor
  const INTERACTABLES = {
    1: [
      { id: 'reception', label: '1F 大門接待櫃台', tiles: [{ x: 5, y: 11 }, { x: 6, y: 11 }, { x: 7, y: 11 }, { x: 8, y: 11 }], badgeX: 6.5, badgeY: 10.3 },
      { id: 'elevator_up', label: '電梯（▲ 往 2F）', tiles: [{ x: 3, y: 8 }], badgeX: 3, badgeY: 7.3 },
      { id: 'lobby_sign', label: '大廳形象牆（核准拍照區）', tiles: [{ x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }, { x: 8, y: 1 }], badgeX: 6.5, badgeY: 0.7 },
      { id: 'cleanroom_window', label: '管制實驗區觀測窗', tiles: [{ x: 14, y: 8 }, { x: 15, y: 8 }, { x: 16, y: 8 }, { x: 17, y: 8 }, { x: 11, y: 10 }], badgeX: 15.5, badgeY: 7.5 },
      { id: 'conference_door', label: '1F 演講與會議廳', tiles: [{ x: 18, y: 5 }, { x: 19, y: 5 }], badgeX: 18.5, badgeY: 4.5 }
    ],
    2: [
      { id: 'pc', label: '值班電腦', tiles: [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }], badgeX: 3, badgeY: 2.3 },
      { id: 'duty_desk', label: '值班桌（交班）', tiles: [{ x: 6, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 }], badgeX: 7, badgeY: 2.3 },
      { id: 'elevator_down', label: '電梯（▼ 往 1F）', tiles: [{ x: 3, y: 8 }], badgeX: 3, badgeY: 7.3 },
      { id: 'notice_board', label: '營業秘密宣導布告欄', tiles: [{ x: 10, y: 1 }], badgeX: 10, badgeY: 0.7 },
      { id: 'whiteboard', label: '實驗白板', tiles: [{ x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }], badgeX: 14, badgeY: 0.7 },
      { id: 'monitor', label: '實驗室螢幕', tiles: [{ x: 18, y: 3 }, { x: 19, y: 3 }, { x: 20, y: 3 }], badgeX: 19, badgeY: 2.3 },
      { id: 'samples', label: '樣品架與標籤', tiles: [{ x: 15, y: 11 }, { x: 16, y: 11 }, { x: 17, y: 11 }], badgeX: 16, badgeY: 10.3 }
    ]
  };

  function createNPCsForChapter(chapter) {
    if (chapter === 2) {
      return [
        { id: 'npc_lead', sprite: 'lead', label: '負責人 阿明組長', floor: 2, x: 8, y: 12, dir: 'up' },
        { id: 'npc_colleague', sprite: 'colleague', label: '同事 阿文', floor: 2, x: 9, y: 5, dir: 'left' }
      ];
    }
    if (chapter === 3) {
      return [
        { id: 'npc_lead', sprite: 'lead', label: '負責人 阿明組長', floor: 1, x: 4, y: 11, dir: 'right' },
        { id: 'npc_colleague', sprite: 'colleague', label: '同事 阿文', floor: 2, x: 9, y: 5, dir: 'left' },
        { id: 'npc_qing', sprite: 'qing', label: '接手同事 小晴', floor: 2, x: 16, y: 9, dir: 'up' }
      ];
    }
    return [
      { id: 'npc_lead', sprite: 'lead', label: '負責人 阿明組長', floor: 2, x: 8, y: 12, dir: 'up' },
      { id: 'npc_colleague', sprite: 'colleague', label: '同事 阿文', floor: 2, x: 20, y: 5, dir: 'left' },
      { id: 'npc_visitor', sprite: 'visitor', label: '訪客 陳先生', floor: 1, x: 7, y: 12, dir: 'up' }
    ];
  }

  function createInitialNPCs() {
    return createNPCsForChapter(1);
  }

  function getZoneName(floor, tx, ty) {
    if (floor === 1) {
      if (tx <= 3 && ty >= 7 && ty <= 9) return '1F 梯廳（往 2F）';
      if (tx >= 10) return '1F 觀測走廊';
      return '1F 大門大廳與櫃台';
    }
    if (tx <= 3 && ty >= 7 && ty <= 9) return '2F 梯廳（往 1F）';
    if (tx >= 12) return '2F 量測實驗區（門禁管制）';
    if (tx >= 4 && ty >= 10) return '2F 組長辦公室';
    return '2F 研究助理辦公區';
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
    // Back divider wall above stairwell (x=1..3, y=7)
    for (let x = 1; x <= 3; x++) {
      px(ctx, x * TILE, 7 * TILE, TILE, TILE, '#44546b');
      px(ctx, x * TILE, 7 * TILE + 12, TILE, 4, '#2f3b4d');
    }
    // Staircase steps on (1..2, 8)
    const sx = 1 * TILE;
    const sy = 8 * TILE;
    px(ctx, sx, sy, 2 * TILE, TILE, '#cbd5e1');
    for (let i = 0; i < 4; i++) {
      const shade = i % 2 === 0 ? '#94a3b8' : '#b8c4d4';
      px(ctx, sx + 1, sy + i * 4, 2 * TILE - 2, 3, shade);
      px(ctx, sx + 1, sy + i * 4 + 3, 2 * TILE - 2, 1, '#64748b');
    }
    // Handrail accent
    px(ctx, sx, sy, 2, TILE, '#475569');
    px(ctx, sx + 2 * TILE - 2, sy, 2, TILE, '#475569');

    // Elevator doors on (3, 8)
    const ex = 3 * TILE;
    const ey = 8 * TILE - 4;
    px(ctx, ex + 1, ey, 14, 19, '#475569');
    px(ctx, ex + 2, ey + 5, 5, 13, '#94a3b8');
    px(ctx, ex + 9, ey + 5, 5, 13, '#94a3b8');
    px(ctx, ex + 7, ey + 5, 2, 13, '#334155');
    // Elevator floor indicator LED
    px(ctx, ex + 4, ey + 1, 8, 3, '#0f172a');
    px(ctx, ex + 6, ey + 2, 4, 1, tick % 50 < 35 ? '#38bdf8' : '#facc15');

    // Crisp floating floor direction sign on wall (y=7)
    const label = floor === 1 ? '▲ 往2F' : '▼ 往1F';
    px(ctx, 1 * TILE + 3, 7 * TILE + 2, 42, 9, '#1e293b');
    ctx.fillStyle = floor === 1 ? '#7dd3fc' : '#fde68a';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText(label, 1 * TILE + 7, 7 * TILE + 9);
  }

  // ===== Render Floor 1 =====
  function drawFloor1(ctx, state, tick) {
    const isCh2 = state.chapter === 2;

    // 1. Lobby & Corridor Floor Tiles
    for (let y = 2; y <= 14; y++) {
      for (let x = 1; x <= 22; x++) {
        const sx = x * TILE;
        const sy = y * TILE;
        if (x <= 9) {
          // Warm terrazzo lobby floor
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#e7e2d5' : '#ddd7c7');
        } else if (y >= 6 && y <= 7) {
          // East corridor light stone
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#dfe5ec' : '#d4dce6');
        } else if (x === 10 && y >= 8) {
          // Airlock side corridor
          px(ctx, sx, sy, TILE, TILE, '#cfd8e3');
        }
      }
    }

    // Lobby decorative teal runner carpet from main doors (x=6..8, y=13..14)
    px(ctx, 6 * TILE, 13 * TILE + 2, 3 * TILE, 26, '#2b6b5e');
    px(ctx, 6 * TILE + 2, 13 * TILE + 4, 3 * TILE - 4, 22, '#3c8778');
    // Subtle photo spot marker in front of Lobby Sign Wall (x=6..7, y=3)
    px(ctx, 6 * TILE + 2, 3 * TILE + 2, 2 * TILE - 4, 12, 'rgba(47, 125, 109, 0.18)');
    px(ctx, 6 * TILE + 5, 3 * TILE + 5, 2 * TILE - 10, 6, 'rgba(47, 125, 109, 0.30)');

    // 2. Outer Walls
    for (let x = 0; x < COLS; x++) {
      px(ctx, x * TILE, 0, TILE, TILE, '#354157');
      px(ctx, x * TILE, TILE, TILE, TILE, x <= 9 ? '#d2c9b8' : '#b7c7d1');
      px(ctx, x * TILE, TILE + 13, TILE, 3, '#8894a6');
    }
    for (let y = 0; y < ROWS; y++) {
      px(ctx, 0, y * TILE, TILE, TILE, '#2b3548');
      px(ctx, (COLS - 1) * TILE, y * TILE, TILE, TILE, '#2b3548');
    }
    for (let x = 0; x < COLS; x++) {
      px(ctx, x * TILE, (ROWS - 1) * TILE, TILE, TILE, '#2b3548');
    }

    // Main Entrance Automatic Glass Doors at bottom (x=6..8, y=15)
    px(ctx, 6 * TILE, 15 * TILE, 3 * TILE, TILE, '#4b7e94');
    px(ctx, 6 * TILE + 2, 15 * TILE + 2, 14, 12, isCh2 ? '#3d587a' : '#9dd6eb');
    px(ctx, 7 * TILE + 1, 15 * TILE + 2, 14, 12, isCh2 ? '#3d587a' : '#9dd6eb');
    px(ctx, 8 * TILE + 1, 15 * TILE + 2, 13, 12, isCh2 ? '#3d587a' : '#9dd6eb');

    // Lobby Sign Plaque on Top Wall (x=5..8, y=1)
    px(ctx, 5 * TILE, 5, 4 * TILE, 21, '#1d4d44');
    px(ctx, 5 * TILE + 2, 7, 4 * TILE - 4, 17, '#2f7d6d');
    ctx.fillStyle = '#e8fff9';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.fillText('中研院RCCI', 5 * TILE + 12, 16);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 5.5px monospace';
    ctx.fillText('RCCI LAB 1F', 5 * TILE + 12, 22);

    // 3. North Courtyard Garden (x=10..15, y=2..4) behind Glass Wall (y=5)
    for (let y = 2; y <= 4; y++) {
      for (let x = 10; x <= 15; x++) {
        px(ctx, x * TILE, y * TILE, TILE, TILE, isCh2 ? '#29483b' : ((x + y) % 2 === 0 ? '#7ec483' : '#71b876'));
      }
    }
    // Courtyard trees/bushes & stepping stones
    px(ctx, 11 * TILE + 2, 3 * TILE, 12, 10, isCh2 ? '#1e382e' : '#3d8f56');
    px(ctx, 14 * TILE + 2, 2 * TILE + 4, 14, 12, isCh2 ? '#1e382e' : '#439c5f');
    px(ctx, 12 * TILE + 6, 4 * TILE + 3, 10, 6, isCh2 ? '#4c5b69' : '#cbd5e1');

    // 4. North-Right Conference Hall Preview (x=16..22, y=2..4)
    for (let y = 2; y <= 4; y++) {
      for (let x = 16; x <= 22; x++) {
        px(ctx, x * TILE, y * TILE, TILE, TILE, isCh2 ? '#333b4a' : '#d9cfc1');
      }
    }
    // Auditorium seating rows
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        px(ctx, 17 * TILE + c * 18, 2 * TILE + 4 + r * 12, 13, 6, isCh2 ? '#4a5568' : '#536b8c');
      }
    }
    // Partition wall along y=5 (x=10..22)
    for (let x = 10; x <= 22; x++) {
      const sx = x * TILE;
      const sy = 5 * TILE;
      px(ctx, sx, sy, TILE, TILE, '#44546b');
      if (x <= 15) {
        // Glass windows to courtyard
        px(ctx, sx + 1, sy + 2, TILE - 2, 9, isCh2 ? '#3b5273' : '#a8dce8');
        px(ctx, sx + 2, sy + 3, TILE - 4, 3, isCh2 ? '#506b91' : '#daf4fa');
      } else if (x === 18 || x === 19) {
        // Wooden Conference Hall Double Doors
        px(ctx, sx + 1, sy + 1, TILE - 2, TILE - 2, '#8b5e3c');
        px(ctx, sx + 3, sy + 3, TILE - 6, 6, '#b78963');
      } else {
        px(ctx, sx + 1, sy + 2, TILE - 2, 10, '#62738a');
      }
    }
    px(ctx, 17 * TILE + 12, 5 * TILE - 7, 40, 8, '#1e293b');
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 6px sans-serif';
    ctx.fillText('1F 會議廳', 17 * TILE + 17, 5 * TILE - 1);

    // 5. South-Right Controlled Cleanroom Observation Bay (x=11..22, y=8..14)
    for (let y = 9; y <= 14; y++) {
      for (let x = 12; x <= 22; x++) {
        const alt = (x + y) % 2 === 0;
        px(ctx, x * TILE, y * TILE, TILE, TILE, isCh2 ? (alt ? '#293c47' : '#243540') : (alt ? '#cfe8ef' : '#c3e0e8'));
      }
    }
    // Cleanroom glass walls along y=8 (x=11..22) and x=11 (y=8..14)
    for (let x = 11; x <= 22; x++) {
      px(ctx, x * TILE, 8 * TILE, TILE, TILE, '#44546b');
      if (x >= 12 && x <= 21) {
        px(ctx, x * TILE + 1, 8 * TILE + 3, TILE - 2, 9, isCh2 ? '#3a576b' : '#8fd2e3');
        px(ctx, x * TILE + 2, 8 * TILE + 4, TILE - 4, 3, isCh2 ? '#527791' : '#d2f4fc');
      }
    }
    for (let y = 8; y <= 14; y++) {
      px(ctx, 11 * TILE, y * TILE, TILE, TILE, '#44546b');
      if (y === 10) {
        // Airlock Door + Caution Stripes + Keycard Reader
        px(ctx, 11 * TILE + 2, y * TILE + 1, 12, 14, '#64748b');
        px(ctx, 11 * TILE + 4, y * TILE + 3, 8, 6, '#94d2e6');
        px(ctx, 11 * TILE - 2, y * TILE + 2, 3, 5, '#1e293b');
        px(ctx, 11 * TILE - 1, y * TILE + 3, 2, 2, tick % 60 < 40 ? '#ef4444' : '#f87171');
      }
    }
    // Airlock caution stripe on floor inside cleanroom
    for (let i = 0; i < 4; i++) {
      px(ctx, 12 * TILE + 2, 10 * TILE + i * 4, 10, 2, i % 2 === 0 ? '#eab308' : '#1e293b');
    }
    // Sleek Cleanroom Equipment Bays inside (visual showcase)
    [13, 17, 20].forEach((bx, idx) => {
      px(ctx, bx * TILE, 10 * TILE, 2 * TILE, 26, '#e2e8f0');
      px(ctx, bx * TILE + 2, 10 * TILE + 2, 2 * TILE - 4, 22, '#f8fafc');
      px(ctx, bx * TILE + 4, 10 * TILE + 5, 2 * TILE - 8, 8, '#334155');
      // Blinking status LEDs
      const ledOn = (tick + idx * 17) % 48 < 30;
      px(ctx, bx * TILE + 6, 10 * TILE + 8, 3, 2, ledOn ? '#38bdf8' : '#0284c7');
      px(ctx, bx * TILE + 11, 10 * TILE + 8, 3, 2, '#34d399');
      px(ctx, bx * TILE + 4, 10 * TILE + 16, 2 * TILE - 8, 5, '#cbd5e1');
    });
    ctx.fillStyle = isCh2 ? 'rgba(200, 230, 240, 0.7)' : 'rgba(25, 65, 80, 0.72)';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('1F 管制實驗區（門禁）', 13 * TILE + 6, 13 * TILE + 12);

    // 6. Left Stairwell & Elevator
    drawStairwellAndElevator(ctx, 1, tick);

    // 7. Lobby Lounge Sofa & Coffee Table (x=1..2, y=3..4)
    px(ctx, 1 * TILE + 2, 3 * TILE + 2, 12, 28, '#4f6d8a');
    px(ctx, 1 * TILE + 4, 3 * TILE + 4, 8, 24, '#6b8cae');
    px(ctx, 2 * TILE + 2, 4 * TILE + 2, 12, 12, '#a47549');
    px(ctx, 2 * TILE + 4, 4 * TILE + 4, 8, 8, '#c7996b');

    // 8. 1F Reception Counter (x=5..8, y=11)
    drawDesk(ctx, 5, 11, 4, '#8f6b4e', '#654a34');
    // Visitor logbook + sign + desk PC
    px(ctx, 6 * TILE + 2, 11 * TILE + 2, 12, 9, '#fffdf5');
    px(ctx, 6 * TILE + 4, 11 * TILE + 4, 8, 1, '#2f7d6d');
    px(ctx, 6 * TILE + 4, 11 * TILE + 7, 7, 1, '#94a3b8');
    px(ctx, 5 * TILE + 3, 11 * TILE + 3, 10, 6, '#2f7d6d');
    px(ctx, 8 * TILE + 2, 11 * TILE + 1, 10, 8, '#293345');
    px(ctx, 8 * TILE + 3, 11 * TILE + 2, 8, 5, isCh2 ? '#334155' : '#67c8db');

    // 9. Lobby Plants
    drawPlant(ctx, 4, 2);
    drawPlant(ctx, 9, 2);
    drawPlant(ctx, 1, 14);
    drawPlant(ctx, 9, 14);

    // Zone captions
    ctx.font = 'bold 7px sans-serif';
    ctx.fillStyle = 'rgba(55, 65, 80, 0.58)';
    ctx.fillText('1F 大門大廳', 2 * TILE, 14 * TILE + 12);
    ctx.fillText('1F 觀測廊道', 11 * TILE + 4, 7 * TILE + 12);
  }

  // ===== Render Floor 2 =====
  function drawFloor2(ctx, state, tick) {
    const isCh2 = state.chapter === 2;
    const isCh3 = state.chapter === 3;
    const isCh1 = state.chapter === 1;

    // 1. Floor Tiles
    for (let y = 2; y <= 14; y++) {
      for (let x = 1; x <= 22; x++) {
        const sx = x * TILE;
        const sy = y * TILE;
        if (x <= 10 && y <= 6) {
          // 2F Assistant Office warm wood planks
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#e4cfa8' : '#dcc49b');
          px(ctx, sx, sy + 7, TILE, 1, 'rgba(130, 95, 52, 0.14)');
          px(ctx, sx, sy + 15, TILE, 1, 'rgba(130, 95, 52, 0.14)');
        } else if (x >= 5 && x <= 10 && y >= 11) {
          // 2F Lead Office slightly richer warm oak wood
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#dbc297' : '#d2b78a');
          px(ctx, sx, sy + 7, TILE, 1, 'rgba(110, 78, 42, 0.16)');
        } else if (x <= 10) {
          // 2F Central Corridor & Stair Lobby clean neutral tile
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#e2e5ea' : '#d6dbe2');
        } else if (x === 11) {
          px(ctx, sx, sy, TILE, TILE, '#c8d1dc');
        } else {
          // 2F Measurement Lab cool anti-static floor
          const alt = (x + y) % 2 === 0;
          px(ctx, sx, sy, TILE, TILE, alt ? '#d7ebe9' : '#cce3e0');
          px(ctx, sx, sy, TILE, 1, 'rgba(60, 105, 110, 0.09)');
          px(ctx, sx, sy, 1, TILE, 'rgba(60, 105, 110, 0.09)');
        }
      }
    }

    // Subtle aisle guide strip in 2F Lab (y=8..9)
    px(ctx, 12 * TILE, 8 * TILE, 11 * TILE, 1, 'rgba(47, 125, 109, 0.25)');
    px(ctx, 12 * TILE, 10 * TILE - 1, 11 * TILE, 1, 'rgba(47, 125, 109, 0.25)');

    // 2. Outer Walls
    for (let x = 0; x < COLS; x++) {
      px(ctx, x * TILE, 0, TILE, TILE, '#354157');
      px(ctx, x * TILE, TILE, TILE, TILE, x <= 10 ? '#cbbba0' : '#bfd0d6');
      px(ctx, x * TILE, TILE + 13, TILE, 3, '#8894a6');
    }
    for (let y = 0; y < ROWS; y++) {
      px(ctx, 0, y * TILE, TILE, TILE, '#2b3548');
      px(ctx, (COLS - 1) * TILE, y * TILE, TILE, TILE, '#2b3548');
    }
    for (let x = 0; x < COLS; x++) {
      px(ctx, x * TILE, (ROWS - 1) * TILE, TILE, TILE, '#2b3548');
    }

    // Office windows (afternoon gold in Ch1, twilight dusk in Ch2, sunset coral in Ch3!)
    [2, 3, 6, 7].forEach((wx) => {
      px(ctx, wx * TILE + 1, 6, TILE - 2, 18, '#55657d');
      const winSky = isCh2 ? '#455987' : isCh3 ? '#f29f67' : '#f8d58b';
      px(ctx, wx * TILE + 3, 8, TILE - 6, 14, winSky);
      if (isCh2) {
        px(ctx, wx * TILE + 5, 10, 2, 2, '#fde68a');
        px(ctx, wx * TILE + 3, 18, TILE - 6, 4, '#6b5b7a');
      } else if (isCh3) {
        px(ctx, wx * TILE + 3, 17, TILE - 6, 5, '#e07258');
      }
      px(ctx, wx * TILE + 3, 14, TILE - 6, 2, '#55657d');
      ctx.fillStyle = isCh2
        ? 'rgba(95, 120, 175, 0.14)'
        : isCh3
        ? 'rgba(245, 160, 100, 0.16)'
        : 'rgba(255, 224, 150, 0.14)';
      ctx.fillRect(wx * TILE, 2 * TILE, TILE, 22);
    });

    // Corridor Notice Board on top wall (x=10, y=1)
    px(ctx, 10 * TILE + 1, 7, 14, 17, '#7c5836');
    px(ctx, 10 * TILE + 3, 9, 10, 13, '#d6b485');
    px(ctx, 10 * TILE + 4, 11, 4, 4, '#fffdf5');
    px(ctx, 10 * TILE + 9, 12, 3, 5, '#fef08a');
    px(ctx, 10 * TILE + 4, 17, 7, 3, '#bbf7d0');

    // 3. Left Stairwell & Elevator
    drawStairwellAndElevator(ctx, 2, tick);

    // 4. 2F Lead Office Glass Partition (x=4, y=10..14 and y=10, x=7..10)
    for (let y = 10; y <= 14; y++) {
      px(ctx, 4 * TILE, y * TILE, TILE, TILE, '#44546b');
      if (y >= 11 && y <= 13) {
        px(ctx, 4 * TILE + 4, y * TILE + 2, 8, 12, '#99cddb');
      }
    }
    [4, 7, 8, 9, 10].forEach((x) => {
      px(ctx, x * TILE, 10 * TILE, TILE, TILE, '#44546b');
      if (x >= 7 && x <= 10) {
        px(ctx, x * TILE + 1, 10 * TILE + 3, TILE - 2, 8, '#99cddb');
        px(ctx, x * TILE + 2, 10 * TILE + 4, TILE - 4, 3, '#d4f2fa');
      }
    });

    // 5. Vertical Glass Partition to 2F Measurement Lab (x=11, doorway at y=6..7)
    for (let y = 2; y <= 14; y++) {
      if (y !== 6 && y !== 7) {
        px(ctx, 11 * TILE, y * TILE, TILE, TILE, '#44546b');
        px(ctx, 11 * TILE + 4, y * TILE + 2, 8, 12, '#8cc4d4');
        px(ctx, 11 * TILE + 5, y * TILE + 3, 2, 10, '#c8edf7');
      }
    }
    // Keycard reader next to Lab door (11, 5)
    px(ctx, 11 * TILE + 2, 5 * TILE + 10, 4, 5, '#1e293b');
    px(ctx, 11 * TILE + 3, 5 * TILE + 11, 2, 2, tick % 60 < 45 ? '#34d399' : '#10b981');

    // 6. Assistant Office Furniture
    // Bookshelf (1, 2)
    px(ctx, 1 * TILE + 1, 2 * TILE - 4, 14, 19, '#6e4c30');
    px(ctx, 1 * TILE + 3, 2 * TILE - 2, 10, 5, '#4c3420');
    px(ctx, 1 * TILE + 4, 2 * TILE - 1, 2, 4, '#c75b39');
    px(ctx, 1 * TILE + 7, 2 * TILE - 1, 2, 4, '#3b82f6');
    px(ctx, 1 * TILE + 10, 2 * TILE - 1, 2, 4, '#10b981');
    px(ctx, 1 * TILE + 3, 2 * TILE + 5, 10, 5, '#4c3420');
    px(ctx, 1 * TILE + 4, 2 * TILE + 6, 3, 4, '#eab308');
    px(ctx, 1 * TILE + 8, 2 * TILE + 6, 3, 4, '#8b5cf6');

    // Water cooler / Coffee Nook (9, 2)
    px(ctx, 9 * TILE + 3, 2 * TILE + 2, 10, 13, '#e2e8f0');
    px(ctx, 9 * TILE + 4, 2 * TILE - 3, 8, 6, '#93c5fd');
    px(ctx, 9 * TILE + 5, 2 * TILE + 8, 2, 2, '#ef4444');
    px(ctx, 9 * TILE + 9, 2 * TILE + 8, 2, 2, '#3b82f6');

    // PC Desk (2..4, 3)
    drawDesk(ctx, 2, 3, 3, '#a47549', '#7d5633');
    const pcX = 3 * TILE;
    const pcY = 3 * TILE - 4;
    px(ctx, pcX + 1, pcY, 14, 11, '#293345');
    let pcAlert = false;
    let pcUnread = false;
    if (isCh2) {
      pcAlert = state.ch2.misuploaded && !state.ch2.contactedOrganizer;
      pcUnread = !state.ch2.openedPoster || pcAlert;
    } else if (isCh3) {
      pcAlert = state.ch3.interruptedByEarlyRevoke && !state.ch3.adminTransferCompleted;
      pcUnread = !state.ch3.openedChecklist || pcAlert;
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

    // Duty Desk (6..8, 3)
    drawDesk(ctx, 6, 3, 3, '#a47549', '#7d5633');
    px(ctx, 7 * TILE + 2, 3 * TILE + 2, 11, 10, '#fffdf5');
    px(ctx, 7 * TILE + 4, 3 * TILE + 4, 7, 1, '#2f7d6d');
    px(ctx, 7 * TILE + 4, 3 * TILE + 6, 6, 1, '#94a3b8');
    px(ctx, 7 * TILE + 4, 3 * TILE + 8, 7, 1, '#94a3b8');
    // Warm lamp
    px(ctx, 6 * TILE + 4, 3 * TILE + 2, 6, 5, '#e8b948');
    px(ctx, 6 * TILE + 6, 3 * TILE + 7, 2, 4, '#475569');

    // 7. Lead Office Furniture (x=5..10, y=11..14)
    drawDesk(ctx, 7, 13, 3, '#9a6d45', '#745030');
    // NDA Binder & coffee mug on lead desk
    px(ctx, 7 * TILE + 4, 13 * TILE + 2, 7, 9, '#2f7d6d');
    px(ctx, 7 * TILE + 5, 13 * TILE + 3, 5, 2, '#e2faf4');
    px(ctx, 9 * TILE + 4, 13 * TILE + 4, 5, 5, '#f8fafc');
    px(ctx, 9 * TILE + 5, 13 * TILE + 5, 3, 3, '#78350f');
    // NDA Contract Filing Cabinet (10, 11)
    px(ctx, 10 * TILE + 2, 11 * TILE, 12, 15, '#64748b');
    px(ctx, 10 * TILE + 4, 11 * TILE + 2, 8, 5, '#94a3b8');
    px(ctx, 10 * TILE + 4, 11 * TILE + 8, 8, 5, '#94a3b8');
    drawPlant(ctx, 5, 14);

    // 8. 2F Measurement Lab Furniture (x=12..22, y=2..14)
    // Whiteboard on Lab Top Wall (x=13..15, y=1)
    const wbX = 13 * TILE;
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
      px(ctx, wbX + 34, wbY + 6, 8, 10, '#e2e8f0');
      px(ctx, wbX + 35, wbY + 12, 2, 4, '#d64545');
      px(ctx, wbX + 38, wbY + 9, 2, 7, '#2f855a');
    }

    // Monitor Bench (18..20, 3)
    drawDesk(ctx, 18, 3, 3, '#9fb3c2', '#6d8291');
    const monX = 19 * TILE;
    const monY = 3 * TILE - 4;
    px(ctx, monX, monY, 16, 11, '#253142');
    if (isCh3) {
      // Lab Record Terminal showing file location/status in Ch3
      px(ctx, monX + 2, monY + 2, 12, 7, '#12314a');
      px(ctx, monX + 3, monY + 3, 9, 1, '#7dd3fc');
      px(ctx, monX + 3, monY + 6, state.ch3.rawLogLocation === 'project' ? 10 : 5, 2, state.ch3.rawLogLocation === 'project' ? '#4ade80' : '#fbbf24');
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

    // Tall Lab Cabinet (22, 2..3)
    px(ctx, 22 * TILE + 1, 2 * TILE, 14, 30, '#7c90a1');
    px(ctx, 22 * TILE + 3, 2 * TILE + 3, 10, 10, '#a4b7c7');
    px(ctx, 22 * TILE + 3, 2 * TILE + 16, 10, 11, '#a4b7c7');
    px(ctx, 22 * TILE + 4, 2 * TILE + 7, 2, 3, '#334155');
    px(ctx, 22 * TILE + 4, 2 * TILE + 20, 2, 3, '#334155');

    // Sample Island Bench (15..17, 11)
    drawDesk(ctx, 15, 11, 3, '#b8c8d4', '#7b8f9e');
    const smpX = 16 * TILE;
    const smpY = 11 * TILE;
    if (!isCh1 || state.labItems.samples) {
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

    // De-identified Measurement Instrument Racks (13, 13..14) and (20..21, 12..13)
    px(ctx, 13 * TILE + 1, 13 * TILE, 14, 30, '#475569');
    px(ctx, 13 * TILE + 3, 13 * TILE + 3, 10, 9, '#1e293b');
    px(ctx, 13 * TILE + 5, 13 * TILE + 6, 6, 2, tick % 40 < 25 ? '#38bdf8' : '#0284c7');
    px(ctx, 13 * TILE + 3, 13 * TILE + 15, 10, 12, '#64748b');

    px(ctx, 20 * TILE + 1, 12 * TILE, 30, 30, '#475569');
    px(ctx, 20 * TILE + 3, 12 * TILE + 3, 26, 11, '#1e293b');
    px(ctx, 20 * TILE + 5, 12 * TILE + 6, 8, 4, '#22c55e');
    px(ctx, 20 * TILE + 16, 12 * TILE + 6, 8, 2, tick % 35 < 20 ? '#facc15' : '#ca8a04');
    px(ctx, 20 * TILE + 3, 12 * TILE + 16, 26, 11, '#64748b');
    px(ctx, 20 * TILE + 6, 12 * TILE + 19, 20, 4, '#94a3b8');

    // Zone captions
    ctx.font = 'bold 7px sans-serif';
    ctx.fillStyle = 'rgba(65, 50, 30, 0.58)';
    ctx.fillText('2F 辦公區', 1 * TILE + 4, 6 * TILE + 12);
    ctx.fillText('組長辦公室', 6 * TILE + 6, 14 * TILE + 12);
    ctx.fillStyle = 'rgba(30, 72, 74, 0.62)';
    ctx.fillText('2F 量測實驗區', 15 * TILE + 2, 14 * TILE + 12);
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

  function findNearbyTarget(floor, pxTile, pyTile, dir, npcs) {
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
        return { type: 'object', id: obj.id, label: obj.label, x: obj.badgeX, y: obj.badgeY };
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
