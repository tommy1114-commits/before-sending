(function () {
  window.BS = window.BS || {};

  const $ = (id) => document.getElementById(id);
  const TILE = window.BS.Map.TILE;

  let currentChapter = 1;
  let state = window.BS.State.createStateForChapter(1);
  let npcs = window.BS.Map.createNPCsForChapter(1);
  let handoverToastShown = false;

  const player = {
    floor: 2,
    x: 5,
    y: 5,
    px: 5 * TILE,
    py: 5 * TILE,
    dir: 'up',
    moving: false,
    fromX: 5,
    fromY: 5,
    toX: 5,
    toY: 5,
    moveProgress: 0,
    walkToggle: 0
  };

  const fade = {
    active: false,
    alpha: 0,
    phase: 'in',
    pending: null
  };

  const heldDirs = [];
  let tick = 0;
  let story = null;
  let nearbyTarget = null;

  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function isTitleVisible() {
    return !$('title-screen').classList.contains('hidden');
  }

  function resetPlayer(floor, spawnX, spawnY, dir) {
    let sx = spawnX;
    let sy = spawnY;
    if (sx < 1 || sx >= window.BS.Map.COLS - 1 || sy < 2 || sy >= window.BS.Map.ROWS - 1 || window.BS.Map.isSolid(floor, sx, sy, null)) {
      if (floor === 1) {
        sx = 7; sy = 12;
      } else {
        sx = 5; sy = 10;
      }
    }
    player.floor = floor;
    player.x = sx;
    player.y = sy;
    player.px = sx * TILE;
    player.py = sy * TILE;
    player.dir = dir || 'up';
    player.moving = false;
    player.moveProgress = 0;
    heldDirs.length = 0;
  }

  function transitionToFloor(targetFloor, spawnX, spawnY, spawnDir, onDone) {
    if (fade.active) return;
    // Instantly finish any active NPC paths on floor change
    for (const n of npcs) {
      if (n.walkingPath && n.walkingPath.length > 0) {
        const dest = n.walkingPath[n.walkingPath.length - 1];
        n.x = dest.x;
        n.y = dest.y;
        n.px = n.x * TILE;
        n.py = n.y * TILE;
        n.moving = false;
        n.walkingPath = null;
        if (n.finalDir) n.dir = n.finalDir;
        if (n.onWalkDone) {
          const cb = n.onWalkDone;
          n.onWalkDone = null;
          cb();
        }
      }
    }
    const goingUp = targetFloor > player.floor;
    window.BS.Audio.stairs(goingUp);
    heldDirs.length = 0;
    player.moving = false;
    fade.active = true;
    fade.alpha = 0;
    fade.phase = 'out';
    fade.pending = { floor: targetFloor, x: spawnX, y: spawnY, dir: spawnDir || 'down', onDone: onDone || null };
  }

  function walkNpcTo(npcId, floor, tx, ty, finalDir, onDone) {
    const npc = npcs.find((n) => n.id === npcId);
    if (!npc) return;
    if (npc.floor !== floor) {
      npc.floor = floor;
      npc.x = tx;
      npc.y = ty;
      npc.px = tx * TILE;
      npc.py = ty * TILE;
      npc.dir = finalDir || 'down';
      npc.moving = false;
      npc.walkingPath = null;
      if (onDone) onDone();
      return;
    }
    if (npc.x === tx && npc.y === ty) {
      npc.dir = finalDir || npc.dir;
      npc.moving = false;
      npc.walkingPath = null;
      if (onDone) onDone();
      return;
    }
    const path = window.BS.Map.findPath(floor, npc.x, npc.y, tx, ty);
    if (!path || path.length === 0) {
      npc.x = tx;
      npc.y = ty;
      npc.px = tx * TILE;
      npc.py = ty * TILE;
      npc.dir = finalDir || npc.dir;
      npc.moving = false;
      npc.walkingPath = null;
      if (onDone) onDone();
      return;
    }
    npc.walkingPath = path;
    npc.finalDir = finalDir || 'down';
    npc.onWalkDone = onDone || null;
    npc.fromX = npc.x;
    npc.fromY = npc.y;
    npc.toX = npc.x;
    npc.toY = npc.y;
    npc.px = (npc.px !== undefined) ? npc.px : npc.x * TILE;
    npc.py = (npc.py !== undefined) ? npc.py : npc.y * TILE;
    npc.moving = false;
    npc.moveProgress = 0;
    npc.walkToggle = 1;
  }

  function moveNpcTo(npcId, floor, tx, ty, dir, instant = false) {
    if (instant) {
      const npc = npcs.find((n) => n.id === npcId);
      if (!npc) return;
      npc.floor = floor;
      npc.x = tx;
      npc.y = ty;
      npc.px = tx * TILE;
      npc.py = ty * TILE;
      npc.dir = dir || 'down';
      npc.moving = false;
      npc.walkingPath = null;
      return;
    }
    walkNpcTo(npcId, floor, tx, ty, dir);
  }

  function advanceTime(mins) {
    const maxTime =
      currentChapter === 4
        ? 17 * 60 + 25
        : currentChapter === 3
        ? 17 * 60 + 55
        : currentChapter === 5
        ? 16 * 60 + 25
        : currentChapter === 2
        ? 18 * 60 + 55
        : 16 * 60 + 5;
    state.timeMinutes = Math.min(maxTime, state.timeMinutes + mins);
  }

  function refreshHUD() {
    const microHud = $('micro-hud');
    const progressStrip = $('chapter-progress-strip');
    if (isTitleVisible()) {
      microHud.classList.add('hidden');
      if (progressStrip) progressStrip.classList.add('hidden');
      return;
    }
    microHud.classList.remove('hidden');

    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';

    if (progressStrip) {
      progressStrip.classList.remove('hidden');
      if (player && typeof player.floor === 'number') {
        state.currentFloor = player.floor;
      }
      const p = window.BS.State && window.BS.State.getChapterProgress ? window.BS.State.getChapterProgress(state) : null;
      if (p) {
        const iconEl = $('progress-pill-icon');
        const textEl = $('progress-pill-text');
        const tagEl = $('progress-pill-tag');
        const pillBtn = $('chapter-progress-pill');

        if (iconEl) iconEl.textContent = p.icon;
        if (textEl) {
          textEl.textContent = isEn
            ? `${p.title}: ${p.isAllDone ? 'All Completed' : 'Completed'} ${p.done} / ${p.total}`
            : `${p.title}：${p.isAllDone ? '全數完成' : '已完成'} ${p.done} / ${p.total} ${p.unit || ''}`;
        }
        if (tagEl) {
          tagEl.textContent = isEn ? 'SELECT Notes' : 'SELECT 筆記';
        }
        if (pillBtn) {
          pillBtn.classList.toggle('completed', Boolean(p.isAllDone));
        }

        const nextHintText = $('next-hint-text');
        const nextHintWrap = $('mission-next-hint');
        if (nextHintText && p.nextHint) {
          nextHintText.textContent = p.nextHint;
          if (nextHintWrap) {
            nextHintWrap.classList.toggle('alert', Boolean(p.nextHintAlert));
            nextHintWrap.classList.toggle('success', Boolean(p.isAllDone));
          }
        }
      }
    }

    $('micro-chapter').textContent =
      currentChapter === 3
        ? (isEn ? 'Ch5 A-Wen\'s Last Day' : 'Ch5 阿文的最後一天')
        : currentChapter === 4
        ? (isEn ? 'Ch4 R&D Inventory' : 'Ch4 這批資料要列入清單嗎？')
        : currentChapter === 5
        ? (isEn ? 'Ch3 Label Document' : 'Ch3 這份文件要怎麼標？')
        : currentChapter === 2
        ? (isEn ? 'Ch2 Before Submission' : 'Ch2 投稿前一晚')
        : (isEn ? 'Ch1 Before Sending' : 'Ch1 寄出之前');
    $('micro-clock').textContent = `🕒 ${window.BS.State.formatClock(state.timeMinutes)}`;
    $('micro-zone').textContent = window.BS.Map.getZoneName(player.floor, player.x, player.y);

    const microHint = $('micro-hint') || document.querySelector('.micro-pill.hint');
    if (microHint) {
      microHint.textContent = isEn ? 'START Menu · SELECT Notes' : 'START 選單 · SELECT 筆記';
    }

    const statusPill = $('micro-status');
    statusPill.className = 'micro-pill task hidden';

    const urgentAlert =
      (currentChapter === 1 && state.email.misshared && (!state.email.linkRevoked || !state.email.reportedToLead)) ||
      (currentChapter === 2 && state.ch2.misuploaded && (!state.ch2.contactedOrganizer || !state.ch2.reportedToLead)) ||
      (currentChapter === 3 && state.ch3.interruptedByEarlyRevoke && state.ch3.rawLogLocation !== 'project');

    const readyToastNow =
      currentChapter === 5
        ? window.BS.State.isCh5FullyComplete(state) && !state.handoverDone
        : currentChapter === 4
        ? window.BS.State.isCh4FullyComplete(state) && !state.handoverDone
        : currentChapter === 3
        ? window.BS.State.isCh3FullyComplete(state) && !state.handoverDone
        : window.BS.State.canHandover(state) && !state.handoverDone;

    if (urgentAlert) {
      statusPill.classList.remove('hidden');
      statusPill.classList.add('alert');
      statusPill.textContent =
        currentChapter === 1
          ? !state.email.linkRevoked
            ? (isEn ? '🚨 Revoke link at 2F PC!' : '🚨 回 2F 電腦停權！')
            : (isEn ? '🚨 Report to A-Ming on 2F!' : '🚨 找 2F 阿明組長通報！')
          : currentChapter === 2
          ? !state.ch2.contactedOrganizer
            ? (isEn ? '🚨 Contact host at 2F PC!' : '🚨 回 2F 電腦聯絡主辦方！')
            : (isEn ? '🚨 Report to A-Ming on 2F!' : '🚨 找 2F 阿明組長回報！')
          : (isEn ? '🚨 Go to 1F and report to A-Ming!' : '🚨 下樓找 1F 阿明組長補救移交！');
    } else if (currentChapter === 5 && state.ch5) {
      const c = state.ch5;
      statusPill.classList.remove('hidden');
      if (!c.markingCompleted) {
        statusPill.textContent = isEn ? 'Goal: Review 3 docs & choose labels' : '目標：檢視三份文件並決定機密標示與版面預覽';
      } else if (!c.verifiedWithQing) {
        statusPill.textContent = isEn ? 'Goal: Hand over docs to Xiao-Qing on 2F' : '目標：在 2F 辦公區找小晴接手文件';
      } else {
        statusPill.textContent = isEn ? '✨ Done! Hand over to Xiao-Qing or desk' : '✨ 任務完成！向小晴或回值班桌完成交班';
        if (!handoverToastShown) {
          handoverToastShown = true;
          window.BS.UI.showToast(isEn ? '🎉 Document labels verified! Hand over to Xiao-Qing or at desk.' : '🎉 文件標示與交接已核對完成！向小晴或回值班桌完成交班。', false, 5200);
        }
      }
    } else if (currentChapter === 4 && state.ch4) {
      const c = state.ch4;
      statusPill.classList.remove('hidden');
      if (!c.cardsCompleted) {
        statusPill.textContent = isEn ? 'Goal: Review 3 cards with A-Wen in 2F Lab' : '目標：至 2F 實驗區找阿文辨識資料卡';
      } else if (player.floor === 1) {
        statusPill.textContent = isEn ? '▲ Go up to 2F office to review inventory' : '▲ 請走樓梯上 2F 辦公區，到值班電腦確認清單';
      } else if (!c.updatedSaved) {
        statusPill.textContent = isEn ? 'Goal: Review & save inventory at 2F PC' : '目標：在 2F 辦公區值班電腦確認與更新研發成果清單';
      } else if (!c.verifiedWithQing) {
        statusPill.textContent = isEn ? 'Goal: Review inventory with Xiao-Qing on 2F' : '目標：在 2F 辦公區找小晴核對清單';
      } else {
        statusPill.textContent = isEn ? '✨ Done! Hand over to Xiao-Qing or desk' : '✨ 任務完成！向小晴或回值班桌完成交班';
        if (!handoverToastShown) {
          handoverToastShown = true;
          window.BS.UI.showToast(isEn ? '🎉 Inventory verified! Hand over to Xiao-Qing or at desk.' : '🎉 研發成果清單已核對完成！向小晴或回值班桌完成交班。', false, 5200);
        }
      }
    } else if (readyToastNow) {
      statusPill.classList.remove('hidden');
      statusPill.textContent = isEn ? '✨ Done! Return to 2F duty desk' : '✨ 任務完成！回 2F 值班桌交班';
      if (!handoverToastShown) {
        handoverToastShown = true;
        window.BS.UI.showToast(isEn ? '🎉 Task completed! Return to 2F duty desk (✓) to finish!' : '🎉 任務已處理完成！請回到 2F 辦公區值班桌（綠勾 ✓）完成交班與通關！', false, 5200);
      }
    }
  }

  function startChapter(chapter) {
    const validChapters = [1, 2, 5, 4, 3];
    currentChapter = validChapters.includes(Number(chapter)) ? Number(chapter) : 1;
    handoverToastShown = false;
    window.BS.Audio.stopTitleBgm(750);
    window.BS.UI.closeAllModals();
    window.BS.UI.closeDialogue();
    $('title-screen').classList.add('hidden');
    fade.active = false;
    fade.alpha = 0;

    state = window.BS.State.createStateForChapter(currentChapter);
    state.started = true;
    if (window.BS.Analytics) {
      window.BS.Analytics.trackChapterStart(state);
    }
    npcs = window.BS.Map.createNPCsForChapter(currentChapter);

    if (currentChapter === 4) {
      resetPlayer(1, 9, 7, 'up');
    } else {
      resetPlayer(2, 5, 10, 'up');
    }

    refreshHUD();
    story.playIntro();
  }

  function restartChapter() {
    startChapter(currentChapter);
  }

  function returnToMenu() {
    window.BS.UI.closeAllModals();
    window.BS.UI.closeDialogue();
    heldDirs.length = 0;
    fade.active = false;
    fade.alpha = 0;
    state.started = false;
    $('title-screen').classList.remove('hidden');
    const displayOrder = [1, 2, 5, 4, 3];
    const menuIdx = displayOrder.indexOf(currentChapter);
    window.BS.UI.setTitleCursor(menuIdx >= 0 ? menuIdx : 0);
    window.BS.Audio.startTitleBgm();
    refreshHUD();
  }

  function togglePauseMenu() {
    if (fade.active) return;
    const modal = window.BS.UI.getActiveModal();

    // On Title Screen, pressing START confirms the selected menu item (classic GBA!)
    if (isTitleVisible()) {
      if (modal) {
        window.BS.Audio.cancel();
        window.BS.UI.closeAllModals();
      } else {
        window.BS.UI.confirmTitleCursor();
      }
      return;
    }

    if (modal === 'pause') {
      window.BS.Audio.cancel();
      window.BS.UI.closeAllModals();
      return;
    }

    if (modal === 'clear' || modal === 'handover') {
      return;
    }

    if (modal) {
      window.BS.Audio.cancel();
      window.BS.UI.closeAllModals();
      return;
    }

    if (window.BS.UI.isOverlayOpen()) return; // don't interrupt active dialogue

    heldDirs.length = 0;
    window.BS.Audio.select();
    const zoneName = window.BS.Map.getZoneName(player.floor, player.x, player.y);
    window.BS.UI.openPauseModal(state, zoneName, {
      onRestart: () => restartChapter(),
      onReturnMenu: () => returnToMenu()
    });
  }

  function toggleSelectNotes() {
    if (fade.active) return;
    const modal = window.BS.UI.getActiveModal();

    if (isTitleVisible()) {
      if (modal === 'endings') {
        window.BS.Audio.cancel();
        window.BS.UI.closeAllModals();
      } else if (!modal) {
        window.BS.UI.moveTitleCursor(1);
      }
      return;
    }

    if (modal === 'clues') {
      window.BS.Audio.cancel();
      window.BS.UI.closeAllModals();
      return;
    }

    if (modal === 'pause') {
      window.BS.Audio.select();
      window.BS.UI.closeAllModals();
      window.BS.UI.openCluesModal(state);
      return;
    }

    if (window.BS.UI.isOverlayOpen()) return;

    heldDirs.length = 0;
    window.BS.Audio.select();
    window.BS.UI.openCluesModal(state);
  }

  story = window.BS.Story.createStoryController({
    getState: () => state,
    getNPCs: () => npcs,
    getFloor: () => player.floor,
    advanceTime,
    refreshHUD,
    startChapter,
    restartChapter,
    returnToMenu,
    moveNpcTo,
    walkNpcTo,
    transitionToFloor
  });

  // ===== Input Handling =====
  function pushDir(d) {
    if (!heldDirs.includes(d)) {
      heldDirs.unshift(d);
    }
  }

  function releaseDir(d) {
    const idx = heldDirs.indexOf(d);
    if (idx !== -1) heldDirs.splice(idx, 1);
  }

  function keyToDir(key) {
    if (key === 'ArrowUp' || key === 'w' || key === 'W') return 'up';
    if (key === 'ArrowDown' || key === 's' || key === 'S') return 'down';
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') return 'left';
    if (key === 'ArrowRight' || key === 'd' || key === 'D') return 'right';
    return null;
  }

  function triggerA() {
    if (fade.active) return;
    const modal = window.BS.UI.getActiveModal();

    if (isTitleVisible() && !modal) {
      window.BS.UI.confirmTitleCursor();
      return;
    }
    if (modal === 'pause') {
      window.BS.UI.confirmPauseCursor();
      return;
    }
    if (window.BS.UI.isOverlayOpen()) {
      window.BS.UI.advanceDialogue();
      return;
    }
    if (nearbyTarget) {
      if (nearbyTarget.type === 'npc') {
        const npc = npcs.find((n) => n.id === nearbyTarget.id && n.floor === player.floor);
        if (npc) {
          const dx = player.x - npc.x;
          const dy = player.y - npc.y;
          if (Math.abs(dx) > Math.abs(dy)) {
            npc.dir = dx > 0 ? 'right' : 'left';
            player.dir = dx > 0 ? 'left' : 'right';
          } else {
            npc.dir = dy > 0 ? 'down' : 'up';
            player.dir = dy > 0 ? 'up' : 'down';
          }
        }
      }
      window.BS.Audio.select();
      heldDirs.length = 0;
      story.interact(nearbyTarget);
    }
  }

  function triggerB() {
    if (fade.active) return;
    const modal = window.BS.UI.getActiveModal();
    if (modal === 'handover') {
      $('btn-handover-close').click();
      return;
    }
    if (modal && modal !== 'clear') {
      window.BS.Audio.cancel();
      window.BS.UI.closeAllModals();
    }
  }

  let lastMenuNavTime = 0;

  window.addEventListener('keydown', (e) => {
    if (fade.active) return;

    // GBA START (Esc / P)
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePauseMenu();
      return;
    }

    // GBA SELECT (Tab)
    if (e.key === 'Tab') {
      e.preventDefault();
      toggleSelectNotes();
      return;
    }

    const modal = window.BS.UI.getActiveModal();

    // Title Screen Cursor Navigation
    if (isTitleVisible() && !modal) {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        const now = Date.now();
        if (now - lastMenuNavTime < 180) return;
        lastMenuNavTime = now;
        window.BS.UI.moveTitleCursor(-1);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const now = Date.now();
        if (now - lastMenuNavTime < 180) return;
        lastMenuNavTime = now;
        window.BS.UI.moveTitleCursor(1);
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        window.BS.UI.confirmTitleCursor();
        return;
      }
      return;
    }

    // Pause Menu Cursor Navigation
    if (modal === 'pause') {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        const now = Date.now();
        if (now - lastMenuNavTime < 180) return;
        lastMenuNavTime = now;
        window.BS.UI.movePauseCursor(-1);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const now = Date.now();
        if (now - lastMenuNavTime < 180) return;
        lastMenuNavTime = now;
        window.BS.UI.movePauseCursor(1);
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        window.BS.UI.confirmPauseCursor();
        return;
      }
      return;
    }

    // Scroll active modal window with keyboard ArrowUp/Down, W/S, PageUp/Down
    if (modal) {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (window.BS.UI.scrollActiveModal(-80)) {
          e.preventDefault();
          return;
        }
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (window.BS.UI.scrollActiveModal(80)) {
          e.preventDefault();
          return;
        }
      }
      if (e.key === 'PageUp') {
        if (window.BS.UI.scrollActiveModal(-280)) {
          e.preventDefault();
          return;
        }
      }
      if (e.key === 'PageDown') {
        if (window.BS.UI.scrollActiveModal(280)) {
          e.preventDefault();
          return;
        }
      }
    }

    if (window.BS.UI.handleDialogueKey(e.key)) {
      e.preventDefault();
      return;
    }

    if (window.BS.UI.isOverlayOpen()) return;

    const dir = keyToDir(e.key);
    if (dir) {
      e.preventDefault();
      pushDir(dir);
      return;
    }

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      triggerA();
    }
  });

  window.addEventListener('keyup', (e) => {
    const dir = keyToDir(e.key);
    if (dir) releaseDir(dir);
  });

  window.addEventListener('blur', () => {
    heldDirs.length = 0;
  });

  // Prevent mobile context menu and long-press selection popups (e.g. 複製 / 查詢 / 搜尋網頁)
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true, passive: false });

  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true, passive: false });

  function setupGBAControls() {
    const dpad = document.querySelector('.dpad');
    const dpadButtons = Array.from(document.querySelectorAll('.dpad-btn'));
    const activePointers = new Map(); // pointerId -> currentDir
    const menuLatchedPointers = new Set(); // pointerId -> already triggered menu action

    function clearAllDpadState() {
      dpadButtons.forEach((b) => b.classList.remove('pressed'));
      heldDirs.length = 0;
      activePointers.clear();
      menuLatchedPointers.clear();
    }

    function getDpadButtonAt(x, y) {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      return el.closest('.dpad-btn');
    }

    function activateDir(dir, btn, pointerId) {
      if (!dir) return;
      if (btn) btn.classList.add('pressed');
      const modal = window.BS.UI.getActiveModal();
      const inMenu = (isTitleVisible() && !modal) || (modal === 'pause') || window.BS.UI.isOverlayOpen();

      if (inMenu) {
        // Enforce discrete 1-tap = 1-step latching for any touch/pointer to prevent skipping
        if (pointerId !== undefined && pointerId !== null) {
          if (menuLatchedPointers.has(pointerId)) {
            return;
          }
          menuLatchedPointers.add(pointerId);
        }

        if (isTitleVisible() && !modal) {
          if (dir === 'up') window.BS.UI.moveTitleCursor(-1);
          if (dir === 'down') window.BS.UI.moveTitleCursor(1);
          return;
        }
        if (modal === 'pause') {
          if (dir === 'up') window.BS.UI.movePauseCursor(-1);
          if (dir === 'down') window.BS.UI.movePauseCursor(1);
          return;
        }
        if (window.BS.UI.isOverlayOpen()) {
          if (modal && modal !== 'pause') {
            if (dir === 'up') {
              if (window.BS.UI.scrollActiveModal(-80)) return;
            }
            if (dir === 'down') {
              if (window.BS.UI.scrollActiveModal(80)) return;
            }
          }
          if (dir === 'up') window.BS.UI.handleDialogueKey('ArrowUp');
          if (dir === 'down') window.BS.UI.handleDialogueKey('ArrowDown');
          return;
        }
        return;
      }
      pushDir(dir);
    }

    function deactivateDir(dir, btn) {
      if (btn) btn.classList.remove('pressed');
      if (dir) releaseDir(dir);
    }

    function updateDpadPointer(pointerId, x, y, explicitBtn) {
      const targetBtn = explicitBtn || getDpadButtonAt(x, y);
      const newDir = targetBtn ? targetBtn.dataset.dir : null;
      const prevDir = activePointers.get(pointerId);

      if (prevDir === newDir) return;

      if (prevDir) {
        const prevBtn = dpadButtons.find((b) => b.dataset.dir === prevDir);
        deactivateDir(prevDir, prevBtn);
      }

      if (newDir) {
        activePointers.set(pointerId, newDir);
        activateDir(newDir, targetBtn, pointerId);
      } else {
        activePointers.delete(pointerId);
      }
    }

    function releaseDpadPointer(pointerId) {
      if (pointerId !== undefined && pointerId !== null) {
        menuLatchedPointers.delete(pointerId);
      }
      const dir = activePointers.get(pointerId);
      if (dir) {
        const btn = dpadButtons.find((b) => b.dataset.dir === dir);
        deactivateDir(dir, btn);
        activePointers.delete(pointerId);
      }
      if (activePointers.size === 0) {
        dpadButtons.forEach((b) => b.classList.remove('pressed'));
        heldDirs.length = 0;
        menuLatchedPointers.clear();
      }
    }

    if (dpad) {
      dpad.addEventListener('touchstart', (ev) => {
        ev.preventDefault();
      }, { passive: false });

      dpad.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        try {
          dpad.setPointerCapture(ev.pointerId);
        } catch {}
        const explicitBtn = (ev.target && ev.target.closest) ? ev.target.closest('.dpad-btn') : null;
        updateDpadPointer(ev.pointerId, ev.clientX, ev.clientY, explicitBtn);
      }, { passive: false });

      dpad.addEventListener('pointermove', (ev) => {
        if (activePointers.has(ev.pointerId)) {
          ev.preventDefault();
          updateDpadPointer(ev.pointerId, ev.clientX, ev.clientY);
        }
      }, { passive: false });

      const onDpadEnd = (ev) => {
        ev.preventDefault();
        releaseDpadPointer(ev.pointerId);
        try {
          dpad.releasePointerCapture(ev.pointerId);
        } catch {}
      };

      dpad.addEventListener('pointerup', onDpadEnd, { passive: false });
      dpad.addEventListener('pointercancel', onDpadEnd, { passive: false });
      dpad.addEventListener('lostpointercapture', (ev) => {
        releaseDpadPointer(ev.pointerId);
      });
    }

    // Prevent default click, touch, and context menu on direction buttons
    dpadButtons.forEach((btn) => {
      btn.addEventListener('touchstart', (ev) => {
        ev.preventDefault();
      }, { passive: false });
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      });
      btn.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
      }, { capture: true, passive: false });
    });

    // Action button binder with pointer capture and latching
    function bindActionButton(id, triggerFn) {
      const btn = $(id);
      if (!btn) return;
      let pressedPointerId = null;

      const start = (ev) => {
        ev.preventDefault();
        if (pressedPointerId !== null) return;
        pressedPointerId = ev.pointerId;
        btn.classList.add('pressed');
        try {
          btn.setPointerCapture(ev.pointerId);
        } catch {}
        triggerFn();
      };

      const end = (ev) => {
        ev.preventDefault();
        if (pressedPointerId === ev.pointerId) {
          pressedPointerId = null;
        }
        btn.classList.remove('pressed');
        try {
          btn.releasePointerCapture(ev.pointerId);
        } catch {}
      };

      btn.addEventListener('touchstart', (ev) => ev.preventDefault(), { passive: false });
      btn.addEventListener('pointerdown', start, { passive: false });
      btn.addEventListener('pointerup', end, { passive: false });
      btn.addEventListener('pointercancel', end, { passive: false });
      btn.addEventListener('lostpointercapture', end);
      btn.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        return false;
      }, { capture: true, passive: false });
    }

    bindActionButton('touch-a', triggerA);
    bindActionButton('touch-b', triggerB);

    function bindPillButton(id, triggerFn) {
      const btn = $(id);
      if (!btn) return;
      let pressedPointerId = null;

      const start = (ev) => {
        ev.preventDefault();
        if (pressedPointerId !== null) return;
        pressedPointerId = ev.pointerId;
        btn.classList.add('pressed');
        try {
          btn.setPointerCapture(ev.pointerId);
        } catch {}
        triggerFn();
      };

      const end = (ev) => {
        ev.preventDefault();
        if (pressedPointerId === ev.pointerId) {
          pressedPointerId = null;
        }
        btn.classList.remove('pressed');
        try {
          btn.releasePointerCapture(ev.pointerId);
        } catch {}
      };

      btn.addEventListener('touchstart', (ev) => ev.preventDefault(), { passive: false });
      btn.addEventListener('pointerdown', start, { passive: false });
      btn.addEventListener('pointerup', end, { passive: false });
      btn.addEventListener('pointercancel', end, { passive: false });
      btn.addEventListener('lostpointercapture', end);
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
      });
      btn.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        return false;
      }, { capture: true, passive: false });
    }

    bindPillButton('btn-start-gba', togglePauseMenu);
    bindPillButton('btn-select-gba', toggleSelectNotes);

    const chapterProgPill = $('chapter-progress-pill');
    if (chapterProgPill) {
      chapterProgPill.addEventListener('click', (ev) => {
        ev.preventDefault();
        toggleSelectNotes();
      });
    }

    // Global Safety Net: clear all pressed states when all fingers leave the screen or blur occurs
    const safetyClear = (ev) => {
      if (!ev.touches || ev.touches.length === 0) {
        clearAllDpadState();
        document.querySelectorAll('.ab-btn, .gba-pill-btn').forEach((b) => b.classList.remove('pressed'));
      }
    };
    window.addEventListener('touchend', safetyClear, { passive: true });
    window.addEventListener('touchcancel', safetyClear, { passive: true });
    window.addEventListener('pointerup', (ev) => {
      if (ev.pointerType === 'touch' || !ev.buttons) {
        safetyClear(ev);
      }
    }, { passive: true });
    window.addEventListener('pointercancel', safetyClear, { passive: true });
    window.addEventListener('blur', clearAllDpadState);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearAllDpadState();
    });
  }

  function applyLanguageUI() {
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const t = window.BS.I18n ? window.BS.I18n.t : (k, fallback) => fallback || k;

    document.title = t('pageTitle');
    const kicker = document.querySelector('.title-kicker');
    if (kicker) kicker.textContent = t('kicker');
    const heading = $('title-heading');
    if (heading) heading.textContent = t('gameTitle');
    const subEn = document.querySelector('.title-sub-en');
    if (subEn) subEn.textContent = t('gameTitleSub');
    const footer = document.querySelector('.title-menu-footer');
    if (footer) footer.textContent = t('titleFooter');
    const toggleText = $('lang-toggle-text');
    if (toggleText) toggleText.textContent = t('langToggleText');

    const chMap = [
      { id: 'btn-start-ch1', title: t('ch1Title'), time: t('timeCh1') },
      { id: 'btn-start-ch2', title: t('ch2Title'), time: t('timeCh2') },
      { id: 'btn-start-ch5', title: t('ch3Title'), time: t('timeCh3') },
      { id: 'btn-start-ch4', title: t('ch4Title'), time: t('timeCh4') },
      { id: 'btn-start-ch3', title: t('ch5Title'), time: t('timeCh5') }
    ];

    chMap.forEach((item) => {
      const btn = $(item.id);
      if (btn) {
        const titleSpan = btn.querySelector('.menu-title-text');
        if (titleSpan) titleSpan.textContent = item.title;
        const timeVal = btn.querySelector('.time-val');
        if (timeVal) timeVal.textContent = item.time;
        const timeTag = btn.querySelector('.time-tag');
        if (timeTag) timeTag.textContent = t('timeTag');
        const menuTime = btn.querySelector('.menu-time');
        if (menuTime) menuTime.setAttribute('title', `${t('timeTag')}: ${item.time}`);
      }
    });

    const charBtn = $('btn-show-characters');
    if (charBtn) {
      const charTitle = charBtn.querySelector('.menu-title-text');
      if (charTitle) charTitle.textContent = t('charactersTitle');
      const charTimeVal = charBtn.querySelector('.time-val');
      if (charTimeVal) charTimeVal.textContent = t('charactersCount');
      const charTimeTag = charBtn.querySelector('.time-tag');
      if (charTimeTag) charTimeTag.textContent = t('charactersTag');
      const menuTime = charBtn.querySelector('.menu-time');
      if (menuTime) menuTime.setAttribute('title', `${t('charactersTag')}: ${t('charactersCount')}`);
    }

    const pillLabels = document.querySelectorAll('.gba-pill-label');
    if (pillLabels.length >= 2) {
      pillLabels[0].innerHTML = isEn ? 'SELECT<small>Notes</small>' : 'SELECT<small>筆記</small>';
      pillLabels[1].innerHTML = isEn ? 'START<small>Menu</small>' : 'START<small>暫停選單</small>';
    }
    const touchB = $('touch-b');
    if (touchB) touchB.innerHTML = isEn ? 'B<span>Back</span>' : 'B<span>返回</span>';
    const touchA = $('touch-a');
    if (touchA) touchA.innerHTML = isEn ? 'A<span>Action</span>' : 'A<span>互動</span>';

    const desktopHints = document.querySelectorAll('.desktop-key-hint span');
    if (desktopHints.length >= 4) {
      desktopHints[0].innerHTML = isEn ? '<kbd>WASD</kbd>/<kbd>Arrows</kbd> Move' : '<kbd>WASD</kbd>/<kbd>↑↓←→</kbd> 移動';
      desktopHints[1].innerHTML = isEn ? '<kbd>Space</kbd>/<kbd>Enter</kbd> Action' : '<kbd>Space</kbd>/<kbd>Enter</kbd> A鍵';
      desktopHints[2].innerHTML = isEn ? '<kbd>Tab</kbd> SELECT' : '<kbd>Tab</kbd> SELECT';
      desktopHints[3].innerHTML = isEn ? '<kbd>Esc</kbd>/<kbd>P</kbd> START' : '<kbd>Esc</kbd>/<kbd>P</kbd> START';
    }

    // Update Home Screen Language Buttons
    const curLang = window.BS.I18n.getLang();
    const btnTitleZh = $('title-btn-lang-zh');
    const btnTitleEn = $('title-btn-lang-en');
    if (btnTitleZh) {
      btnTitleZh.classList.toggle('active', curLang === 'zh');
      btnTitleZh.setAttribute('aria-pressed', curLang === 'zh' ? 'true' : 'false');
    }
    if (btnTitleEn) {
      btnTitleEn.classList.toggle('active', curLang === 'en');
      btnTitleEn.setAttribute('aria-pressed', curLang === 'en' ? 'true' : 'false');
    }

    const landText = document.querySelector('.landscape-lock-text');
    if (landText) landText.textContent = t('landscapeText');
    const landSub = document.querySelector('.landscape-lock-sub');
    if (landSub) landSub.textContent = t('landscapeSub');

    const modalTitles = {
      'pause-title': isEn ? '⏸ PAUSE — Game Paused' : '⏸ PAUSE — 遊戲暫停',
      'pc-title': isEn ? '💻 2F Duty PC — Email, NDA & Sharing' : '💻 2F 值班電腦 — 郵件、NDA 查核與雲端分享',
      'poster-title': isEn ? '💻 2F Office PC — Symposium Poster System' : '💻 2F 辦公區電腦 — 研討會海報編輯與投稿系統',
      'marking-title': isEn ? '🏷️ 2F Office — Document Confidentiality Marking' : '🏷️ 2F 辦公區 — 文件機密標示與版面預覽工作台',
      'record-title': isEn ? '📋 2F Duty PC — R&D Records Inventory' : '📋 2F 值班電腦 — 研發成果清單管理系統',
      'cards-title': isEn ? '🔍 2F Lab — R&D Data Cards Review' : '🔍 2F 量測實驗區 — 星空計畫三組研發成果資料卡',
      'lookup-title': isEn ? '📁 2F Lab — Lab Record Computer' : '📁 2F 實驗區 — 實驗紀錄路徑對照',
      'cam-title': isEn ? '📸 1F Lab — Visitor Photography Framing' : '📸 1F 管制實驗區 — 訪客相機取景預覽',
      'camera-title': isEn ? '📸 1F Lab — Visitor Photography Framing' : '📸 1F 管制實驗區 — 訪客相機取景預覽',
      'offboard-title': isEn ? '📋 2F Duty PC — Offboarding Handover' : '📋 2F 值班電腦 — 離職交接與存取權限系統',
      'clues-title': isEn ? '📋 Duty Notes & Progress (SELECT)' : '📋 值班筆記與任務進度（SELECT）',
      'endings-title': isEn ? '🏆 Endings Gallery' : '🏆 結局圖鑑',
      'handover-title': isEn ? '📝 End-of-Shift Handover Evaluation' : '📝 下班交班檢核表'
    };

    Object.entries(modalTitles).forEach(([id, text]) => {
      const el = $(id);
      if (el) el.textContent = text;
    });

    const microHint = $('micro-hint') || document.querySelector('.micro-pill.hint');
    if (microHint) {
      microHint.textContent = isEn ? 'START Menu · SELECT Notes' : 'START 選單 · SELECT 筆記';
    }
  }

  function setupButtons() {
    window.BS.UI.bindStaticHandlers();

    applyLanguageUI();
    // Show language selection screen on first entry or when not yet confirmed in current session
    if (!sessionStorage.getItem('before_sending_session_lang_confirmed')) {
      $('lang-screen').classList.remove('hidden');
    }

    const btnLangZh = $('btn-lang-zh');
    if (btnLangZh) {
      btnLangZh.addEventListener('click', () => {
        sessionStorage.setItem('before_sending_session_lang_confirmed', 'true');
        window.BS.Audio.confirm();
        window.BS.I18n.setLang('zh');
        $('lang-screen').classList.add('hidden');
        window.BS.Audio.startTitleBgm();
        applyLanguageUI();
        refreshHUD();
      });
    }

    const btnLangEn = $('btn-lang-en');
    if (btnLangEn) {
      btnLangEn.addEventListener('click', () => {
        sessionStorage.setItem('before_sending_session_lang_confirmed', 'true');
        window.BS.Audio.confirm();
        window.BS.I18n.setLang('en');
        $('lang-screen').classList.add('hidden');
        window.BS.Audio.startTitleBgm();
        applyLanguageUI();
        refreshHUD();
      });
    }

    // Home screen prominent language selection buttons
    const titleBtnZh = $('title-btn-lang-zh');
    if (titleBtnZh) {
      titleBtnZh.addEventListener('click', () => {
        window.BS.Audio.select();
        sessionStorage.setItem('before_sending_session_lang_confirmed', 'true');
        window.BS.I18n.setLang('zh');
        window.BS.Audio.unlockTitleBgmIfNeeded();
        applyLanguageUI();
        refreshHUD();
      });
    }

    const titleBtnEn = $('title-btn-lang-en');
    if (titleBtnEn) {
      titleBtnEn.addEventListener('click', () => {
        window.BS.Audio.select();
        sessionStorage.setItem('before_sending_session_lang_confirmed', 'true');
        window.BS.I18n.setLang('en');
        window.BS.Audio.unlockTitleBgmIfNeeded();
        applyLanguageUI();
        refreshHUD();
      });
    }

    const titleLangLabel = $('title-lang-label');
    if (titleLangLabel) {
      titleLangLabel.addEventListener('click', () => {
        window.BS.Audio.select();
        $('lang-screen').classList.remove('hidden');
      });
    }

    if (window.BS.I18n) {
      window.BS.I18n.onLangChange(() => {
        applyLanguageUI();
        refreshHUD();
      });
    }

    // Title Cursor Menu hover + click (only on fine pointer devices like desktop mouse)
    const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canHover) {
      document.querySelectorAll('#title-menu-list .cursor-menu-item').forEach((btn) => {
        const idx = Number(btn.dataset.idx);
        btn.addEventListener('mouseenter', () => {
          window.BS.UI.setTitleCursor(idx);
          window.BS.Audio.select();
        });
      });
    }

    document.querySelectorAll('#title-menu-list .cursor-menu-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.BS.Audio.confirm();
        if (btn.dataset.action === 'characters') {
          window.BS.UI.openCharactersModal();
          return;
        }
        const chId = Number(btn.dataset.chapter) || 1;
        startChapter(chId);
      });
    });

    canvas.addEventListener('click', () => {
      if (!window.BS.UI.isOverlayOpen() && nearbyTarget) {
        triggerA();
      }
    });
  }

  // ===== Update Loop =====
  const MOVE_SPEED = 0.135;
  const NPC_MOVE_SPEED = 0.065;

  function updateFade(timeScale = 1) {
    if (!fade.active) return;
    const fadeSpeed = 0.14 * timeScale;
    if (fade.phase === 'out') {
      fade.alpha += fadeSpeed;
      if (fade.alpha >= 1) {
        fade.alpha = 1;
        const p = fade.pending;
        if (p) {
          resetPlayer(p.floor, p.x, p.y, p.dir);
          refreshHUD();
        }
        fade.phase = 'in';
      }
    } else {
      fade.alpha -= fadeSpeed;
      if (fade.alpha <= 0) {
        fade.alpha = 0;
        fade.active = false;
        const cb = fade.pending && fade.pending.onDone;
        fade.pending = null;
        if (cb) cb();
      }
    }
  }

  function updateNPCs(timeScale = 1) {
    if (fade.active || window.BS.UI.isOverlayOpen()) return;

    for (const npc of npcs) {
      if (npc.floor !== player.floor) continue;

      if (npc.moving) {
        npc.moveProgress += NPC_MOVE_SPEED * timeScale;
        if (npc.moveProgress >= 1) {
          npc.x = npc.toX;
          npc.y = npc.toY;
          npc.px = npc.x * TILE;
          npc.py = npc.y * TILE;
          npc.moving = false;
          npc.moveProgress = 0;

          if (!npc.walkingPath || npc.walkingPath.length === 0) {
            if (npc.finalDir) {
              npc.dir = npc.finalDir;
            }
            if (npc.onWalkDone) {
              const cb = npc.onWalkDone;
              npc.onWalkDone = null;
              cb();
            }
          }
        } else {
          npc.px = (npc.fromX + (npc.toX - npc.fromX) * npc.moveProgress) * TILE;
          npc.py = (npc.fromY + (npc.toY - npc.fromY) * npc.moveProgress) * TILE;
        }
      }

      if (!npc.moving && npc.walkingPath && npc.walkingPath.length > 0) {
        const nextStep = npc.walkingPath[0];
        if (player.floor === npc.floor && player.x === nextStep.x && player.y === nextStep.y && !player.moving) {
          npc.blockedTicks = (npc.blockedTicks || 0) + 1;
          if (npc.blockedTicks > 30) {
            const dest = npc.walkingPath[npc.walkingPath.length - 1];
            const alt = window.BS.Map.findPath(npc.floor, npc.x, npc.y, dest.x, dest.y, (x, y) => x === player.x && y === player.y);
            if (alt && alt.length > 0) {
              npc.walkingPath = alt;
              npc.blockedTicks = 0;
              continue;
            } else if (npc.blockedTicks > 60) {
              npc.blockedTicks = 0;
            } else {
              continue;
            }
          } else {
            continue;
          }
        } else {
          npc.blockedTicks = 0;
        }

        const step = npc.walkingPath.shift();
        npc.dir = step.dir;
        npc.fromX = npc.x;
        npc.fromY = npc.y;
        npc.toX = step.x;
        npc.toY = step.y;
        npc.moving = true;
        npc.moveProgress = 0;
        npc.walkToggle = npc.walkToggle === 1 ? 2 : 1;
      }
    }
  }

  function update(timeScale = 1) {
    tick++;
    updateFade(timeScale);

    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';

    if (isTitleVisible()) {
      $('nearby-hint').textContent = isEn
        ? '↑↓ Move cursor to select chapter · Press A / START / Enter'
        : '↑↓ 移動游標選擇章節 · 按 A / START / Enter 進入';
      return;
    }

    if (!fade.active && !window.BS.UI.isOverlayOpen()) {
      updateNPCs(timeScale);
      if (player.moving) {
        player.moveProgress += MOVE_SPEED * timeScale;
        if (player.moveProgress >= 1) {
          player.x = player.toX;
          player.y = player.toY;
          player.px = player.x * TILE;
          player.py = player.y * TILE;
          player.moving = false;
          player.moveProgress = 0;
          $('micro-zone').textContent = window.BS.Map.getZoneName(player.floor, player.x, player.y);

          const trig = window.BS.Map.getFloorTrigger(player.floor, player.x, player.y);
          if (trig) {
            transitionToFloor(trig.toFloor, trig.spawnX, trig.spawnY, trig.spawnDir);
            return;
          }
        } else {
          player.px = (player.fromX + (player.toX - player.fromX) * player.moveProgress) * TILE;
          player.py = (player.fromY + (player.toY - player.fromY) * player.moveProgress) * TILE;
        }
      }

      if (!player.moving && heldDirs.length > 0) {
        const dir = heldDirs[0];
        player.dir = dir;
        const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
        const nx = player.x + delta[0];
        const ny = player.y + delta[1];
        if (!window.BS.Map.isSolid(player.floor, nx, ny, npcs)) {
          player.fromX = player.x;
          player.fromY = player.y;
          player.toX = nx;
          player.toY = ny;
          player.moving = true;
          player.moveProgress = 0;
          player.walkToggle = player.walkToggle === 1 ? 2 : 1;
          window.BS.Audio.step();
        }
      }
    }

    nearbyTarget = window.BS.Map.findNearbyTarget(player.floor, player.x, player.y, player.dir, npcs, currentChapter);
    const nearbyHintEl = $('nearby-hint');
    if (nearbyTarget) {
      if (nearbyTarget.type === 'npc') {
        nearbyHintEl.textContent = isEn
          ? `Press A to talk to ${nearbyTarget.label}`
          : `按 A 與 ${nearbyTarget.label} 對話`;
      } else {
        nearbyHintEl.textContent = isEn
          ? `Press A to inspect ${nearbyTarget.label}`
          : `按 A 查看 ${nearbyTarget.label}`;
      }
      nearbyHintEl.classList.add('has-target');
    } else {
      nearbyHintEl.classList.remove('has-target');
      if (currentChapter === 5 && state && state.ch5) {
        const c = state.ch5;
        if (!c.markingCompleted) {
          $('nearby-hint').textContent = isEn
            ? 'Office Area · Check 3 document markings at duty PC (top-left)'
            : '目前在辦公區 · 請至左上方值班電腦檢視三份文件標示';
        } else if (!c.verifiedWithQing) {
          $('nearby-hint').textContent = isEn
            ? 'Office Area · Confirm document labels & custody with Xiao-Qing'
            : '目前在辦公區 · 請找小晴確認文件標示與保管';
        } else {
          $('nearby-hint').textContent = isEn
            ? 'Office Area · Complete handover with Xiao-Qing or at duty desk'
            : '目前在辦公區 · 請向小晴或到值班桌完成交班';
        }
      } else if (currentChapter === 4 && state && state.ch4) {
        const c = state.ch4;
        if (!c.cardsCompleted) {
          if (player.floor === 1) {
            $('nearby-hint').textContent = isEn
              ? '1F Lobby · ▲ Take stairs on the left up to 2F Lab to find A-Wen'
              : '目前在 1F 大廳 · ▲ 請走左側樓梯上 2F 量測實驗區找阿文';
          } else {
            $('nearby-hint').textContent = isEn
              ? 'Measurement Lab · Talk to colleague A-Wen to identify 3 data cards'
              : '目前在量測實驗區 · 請向阿文辨識三組資料卡';
          }
        } else if (player.floor === 1) {
          $('nearby-hint').textContent = isEn
            ? '1F Lobby · ▲ Take stairs on the left up to 2F office'
            : '目前在 1F 大廳 · ▲ 請走左側樓梯上 2F 辦公區';
        } else if (!c.updatedSaved) {
          $('nearby-hint').textContent = isEn
            ? 'Office Area · Review & save inventory at duty PC (top-left)'
            : '目前在辦公區 · 請至左上方值班電腦確認清單';
        } else if (!c.verifiedWithQing) {
          $('nearby-hint').textContent = isEn
            ? 'Office Area · Verify inventory with Xiao-Qing'
            : '目前在辦公區 · 請找小晴核對清單';
        } else {
          $('nearby-hint').textContent = isEn
            ? 'Office Area · Complete handover with Xiao-Qing or at duty desk'
            : '目前在辦公區 · 請向小晴或到值班桌完成交班';
        }
      } else if (player.floor === 1) {
        $('nearby-hint').textContent = isEn
          ? '1F Lobby · Approach targets or take stairs to 2F · START Menu · SELECT Notes'
          : '目前在 1F 大廳 · 走近目標或由左側樓梯上 2F · START 選單 · SELECT 筆記';
      } else {
        $('nearby-hint').textContent = isEn
          ? 'Approach objects or colleagues · START Menu · SELECT Notes'
          : '走近物件或同事查看提示 · START 選單 · SELECT 筆記';
      }
    }
  }

  // ===== Render Loop =====
  function drawQuestBubble(tx, ty, text, bgColor, textColor) {
    const bob = Math.round(Math.sin(tick * 0.1) * 1.5);
    const cx = tx * TILE + 8;
    const cy = ty * TILE - 6 + bob;
    ctx.fillStyle = bgColor;
    ctx.fillRect(cx - 5, cy - 5, 10, 9);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 5.5, cy - 5.5, 11, 10);
    ctx.fillStyle = bgColor;
    ctx.fillRect(cx - 1, cy + 4, 2, 2);
    ctx.fillStyle = textColor;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, cy + 2);
    ctx.textAlign = 'left';
  }

  function drawNpcBubble(npc, text, bgColor, textColor) {
    if (!npc || npc.floor !== player.floor) return;
    const x = npc.moving ? (npc.px / TILE) : npc.x;
    const y = npc.moving ? (npc.py / TILE) : npc.y;
    drawQuestBubble(x, y - 0.3, text, bgColor, textColor);
  }

  function render() {
    if (isTitleVisible()) {
      window.BS.Sprites.drawTitleBackdrop($('title-bg-canvas'), tick);
      return;
    }

    if (window.BS.UI.getActiveModal() === 'clear') {
      window.BS.UI.renderClearFx(tick);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    window.BS.Map.drawMap(ctx, state, player.floor, tick);

    const floorNpcs = npcs.filter((n) => n.floor === player.floor);
    const drawables = floorNpcs.map((n) => ({
      sortY: n.moving ? (n.py || n.y * TILE) : n.y * TILE,
      draw: () => {
        const frame = n.moving ? n.walkToggle : 0;
        const sp = window.BS.Sprites.getChar(n.sprite, n.dir, frame);
        const drawX = n.moving ? Math.round(n.px) : n.x * TILE;
        const drawY = (n.moving ? Math.round(n.py) : n.y * TILE) - 4;
        ctx.drawImage(sp, drawX, drawY);
      }
    }));

    drawables.push({
      sortY: player.py,
      draw: () => {
        const frame = player.moving ? player.walkToggle : 0;
        const sp = window.BS.Sprites.getChar('player', player.dir, frame);
        ctx.drawImage(sp, Math.round(player.px), Math.round(player.py) - 4);
      }
    });

    drawables.sort((a, b) => a.sortY - b.sortY);
    drawables.forEach((d) => d.draw());

    if (currentChapter === 1) {
      const vNpc = npcs.find((n) => n.id === 'npc_visitor');
      const leadNpc = npcs.find((n) => n.id === 'npc_lead');
      const wenNpc = npcs.find((n) => n.id === 'npc_colleague');
      const emailUrgent = state.email.misshared && (!state.email.linkRevoked || !state.email.reportedToLead);
      const emailPending = state.email.status === 'unread' || state.email.status === 'read' || state.email.status === 'holding';
      const visitorWaiting1F = vNpc && vNpc.floor === 1 && state.visitor.status === 'waiting';
      const visitorResolved = window.BS.State.isVisitorResolved(state);
      const handoverReady = window.BS.State.canHandover(state) && !state.handoverDone;
      const talkedToWen = Boolean(state.clues && state.clues.meetingVersion);
      const visitorInLab = state.visitor && state.visitor.status === 'in_lab';
      const emailChecked = Boolean(state.email && state.email.status !== 'unread');

      if (player.floor === 2) {
        // 工作電腦提示
        if (state.email.misshared && !state.email.linkRevoked) {
          drawQuestBubble(3, 8.5, '!', '#ef4444', '#ffffff');
        } else if (emailPending) {
          drawQuestBubble(3, 8.5, '!', '#f59e0b', '#1e293b');
        }

        // 同事阿文驚嘆號提示（看過工作電腦後，且尚未確認會議圖版本前提醒交談）
        if (wenNpc && wenNpc.floor === 2 && emailChecked && emailPending && !talkedToWen) {
          drawNpcBubble(wenNpc, '!', '#38bdf8', '#0f172a');
        }

        // 阿明組長驚嘆號提示（若需通報，或看過工作電腦後且尚未確認NDA範圍前提示諮詢）
        if (leadNpc && leadNpc.floor === 2) {
          if (state.email.misshared && state.email.linkRevoked && !state.email.reportedToLead) {
            drawNpcBubble(leadNpc, '!', '#ef4444', '#ffffff');
          } else if (emailChecked && emailPending && !state.clues.ndaScope) {
            drawNpcBubble(leadNpc, '!', '#f59e0b', '#1e293b');
          }
        }

        // 2F 實驗區未整理的物品驚嘆號提示（白板、電腦螢幕、樣品架）
        // 依需求：主角跟阿文講完話後（阿文提醒實驗區需要清場），或訪客已進實驗區時才出現！
        if ((talkedToWen || visitorInLab) && !visitorResolved) {
          if (!state.labItems.whiteboard) {
            drawQuestBubble(9, 0.7, '!', '#f59e0b', '#1e293b');
          }
          if (!state.labItems.monitor) {
            drawQuestBubble(12, 2.3, '!', '#f59e0b', '#1e293b');
          }
          if (!state.labItems.samples) {
            drawQuestBubble(9.5, 6.3, '!', '#f59e0b', '#1e293b');
          }
        }

        if (vNpc && vNpc.floor === 2 && visitorInLab) {
          drawNpcBubble(vNpc, '!', '#38bdf8', '#0f172a');
        }
        if (visitorWaiting1F) {
          drawQuestBubble(2.5, 2.5, '▼', '#38bdf8', '#0f172a');
        }
        if (handoverReady) {
          drawQuestBubble(3, 11.5, '✓', '#22c55e', '#ffffff');
        }
      } else {
        // 1F 大廳
        if (visitorWaiting1F) {
          if (vNpc) drawNpcBubble(vNpc, '!', '#38bdf8', '#0f172a');
          drawQuestBubble(7, 10.3, '!', '#f59e0b', '#1e293b');
        }
        if (emailUrgent) {
          drawQuestBubble(2.5, 2.5, '▲', '#ef4444', '#ffffff');
        } else if (handoverReady) {
          drawQuestBubble(2.5, 2.5, '▲', '#22c55e', '#ffffff');
        } else if (emailPending || state.visitor.status === 'in_lab') {
          drawQuestBubble(2.5, 2.5, '▲', '#f59e0b', '#1e293b');
        }
      }
    } else if (currentChapter === 2) {
      const c = state.ch2;
      const handoverReady = window.BS.State.canHandover(state) && !state.handoverDone;
      if (player.floor === 2) {
        if (c.misuploaded && !c.contactedOrganizer) {
          drawQuestBubble(3, 8.5, '!', '#ef4444', '#ffffff');
        } else if (!c.openedPoster || (c.outcome === 'in_progress' && c.lastApprovedVersionId)) {
          drawQuestBubble(3, 8.5, '!', '#f59e0b', '#1e293b');
        }

        if (c.misuploaded && !c.reportedToLead) {
          drawQuestBubble(8, 16.5, '!', '#ef4444', '#ffffff');
        } else if (c.pendingReviewVersionId) {
          drawQuestBubble(8, 16.5, '!', '#22c55e', '#ffffff');
        } else if (!c.clues.mingExplainedRules && c.outcome === 'in_progress') {
          drawQuestBubble(8, 16.5, '?', '#38bdf8', '#0f172a');
        }

        if (!c.clues.wenExplainedFig2 && c.outcome === 'in_progress') {
          const wen = npcs.find((n) => n.id === 'npc_colleague');
          if (wen && wen.floor === 2) drawNpcBubble(wen, '?', '#38bdf8', '#0f172a');
        }
        if (handoverReady) {
          drawQuestBubble(3, 11.5, '✓', '#22c55e', '#ffffff');
        }
      } else {
        drawQuestBubble(2.5, 2.5, '▲', c.misuploaded ? '#ef4444' : '#f59e0b', c.misuploaded ? '#ffffff' : '#1e293b');
      }
    } else if (currentChapter === 4 && state.ch4) {
      // Chapter 3: 這批資料要列入清單嗎？
      const c = state.ch4;
      const allDone = c.verifiedWithQing && !state.handoverDone;

      if (player.floor === 1) {
        if (!c.cardsCompleted) {
          const wen = npcs.find((n) => n.id === 'npc_colleague');
          if (wen && wen.floor === 1) {
            drawNpcBubble(wen, '!', '#38bdf8', '#0f172a');
          }
        } else {
          // Cards completed on 1F, guide upstairs to 2F
          drawQuestBubble(2.5, 2.5, '▲', '#22c55e', '#ffffff');
        }
      } else {
        // Floor 2: office
        if (!c.updatedSaved) {
          drawQuestBubble(3, 8.5, '!', '#f59e0b', '#1e293b');
        } else if (!c.verifiedWithQing) {
          const qing = npcs.find((n) => n.id === 'npc_qing');
          if (qing && qing.floor === 2) {
            drawNpcBubble(qing, '!', '#38bdf8', '#0f172a');
          }
        } else if (allDone) {
          const qing = npcs.find((n) => n.id === 'npc_qing');
          if (qing && qing.floor === 2) {
            drawNpcBubble(qing, '✓', '#22c55e', '#ffffff');
          }
          drawQuestBubble(3, 11.5, '✓', '#22c55e', '#ffffff');
        }
      }
    } else if (currentChapter === 5 && state.ch5) {
      // Chapter 3 (Internal 5): 這份文件要怎麼標？
      const c = state.ch5;
      const allDone = c.markingCompleted && c.verifiedWithQing && !state.handoverDone;

      if (player.floor === 2) {
        if (!c.markingCompleted) {
          drawQuestBubble(3, 8.5, '!', '#f59e0b', '#1e293b');
        } else if (!c.verifiedWithQing) {
          const qing = npcs.find((n) => n.id === 'npc_qing');
          if (qing && qing.floor === 2) {
            drawNpcBubble(qing, '!', '#38bdf8', '#0f172a');
          }
        } else if (allDone) {
          const qing = npcs.find((n) => n.id === 'npc_qing');
          if (qing && qing.floor === 2) {
            drawNpcBubble(qing, '✓', '#22c55e', '#ffffff');
          }
          drawQuestBubble(3, 11.5, '✓', '#22c55e', '#ffffff');
        }
      }
    } else if (currentChapter === 3 && state.ch3) {
      // Chapter 5 (Internal 3) cross-floor quest markers!
      const c = state.ch3;
      const allDone = window.BS.State.isCh3FullyComplete(state) && !state.handoverDone;
      const need1F =
        !c.clues.mingConfirmedScope ||
        !c.badgeReturned ||
        (c.interruptedByEarlyRevoke && c.rawLogLocation !== 'project');
      const need2F =
        !c.openedChecklist ||
        c.rawLogLocation !== 'project' ||
        !c.qingConfirmedOpen ||
        c.awenOrigAccess !== 'revoked' ||
        !c.awenPaperGrant ||
        !c.ndaRemindedToAwen ||
        allDone;

      if (player.floor === 2) {
        if (!c.openedChecklist || (!c.qingHasProjectAccess && c.rawLogLocation === 'project') || (c.clues.mingConfirmedScope && (!c.awenPaperGrant || c.awenOrigAccess !== 'revoked'))) {
          drawQuestBubble(3, 8.5, '!', '#f59e0b', '#1e293b');
        }
        const wen = npcs.find((n) => n.id === 'npc_colleague');
        if (wen && wen.floor === 2 && ((c.rawLogLocation !== 'project' && c.awenOrigAccess !== 'revoked') || !c.ndaRemindedToAwen)) {
          drawNpcBubble(wen, '!', '#38bdf8', '#0f172a');
        }
        const qing = npcs.find((n) => n.id === 'npc_qing');
        if (qing && qing.floor === 2 && !c.qingConfirmedOpen) {
          const qText = c.rawLogLocation === 'project' && c.qingHasProjectAccess ? '!' : '?';
          const qBg = c.rawLogLocation === 'project' && c.qingHasProjectAccess ? '#22c55e' : '#38bdf8';
          const qColor = c.rawLogLocation === 'project' && c.qingHasProjectAccess ? '#ffffff' : '#0f172a';
          drawNpcBubble(qing, qText, qBg, qColor);
        }
        if (need1F) {
          drawQuestBubble(2.5, 2.5, '▼', c.interruptedByEarlyRevoke && c.rawLogLocation !== 'project' ? '#ef4444' : '#38bdf8', '#ffffff');
        }
        if (allDone) {
          drawQuestBubble(3, 11.5, '✓', '#22c55e', '#ffffff');
        }
      } else {
        // On 1F in Ch3
        const lead = npcs.find((n) => n.id === 'npc_lead');
        if (lead && lead.floor === 1 && (!c.clues.mingConfirmedScope || (c.interruptedByEarlyRevoke && c.rawLogLocation !== 'project'))) {
          drawNpcBubble(lead, '!', c.interruptedByEarlyRevoke && c.rawLogLocation !== 'project' ? '#ef4444' : '#f59e0b', '#ffffff');
        }
        if (!c.badgeReturned) {
          drawQuestBubble(7, 9.5, '!', '#38bdf8', '#0f172a');
        }
        if (need2F) {
          drawQuestBubble(2.5, 2.5, '▲', allDone ? '#22c55e' : '#f59e0b', allDone ? '#ffffff' : '#1e293b');
        }
      }
    }

    if (nearbyTarget && !fade.active && !window.BS.UI.isOverlayOpen()) {
      const label = nearbyTarget.label;
      ctx.font = 'bold 8px sans-serif';
      const tw = ctx.measureText(label).width;
      const boxW = Math.ceil(tw) + 12;
      const boxH = 13;
      let bx = Math.round(nearbyTarget.x * TILE + 8 - boxW / 2);
      let by = Math.round(nearbyTarget.y * TILE - 16);
      bx = Math.max(4, Math.min(canvas.width - boxW - 4, bx));
      by = Math.max(4, by);

      ctx.fillStyle = 'rgba(20, 28, 42, 0.9)';
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.strokeStyle = '#6ad4bc';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, bx + 6, by + 9.5);
    }

    if (fade.active || fade.alpha > 0) {
      ctx.fillStyle = `rgba(15, 21, 32, ${Math.min(1, Math.max(0, fade.alpha))})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  let lastLoopTime = 0;
  function loop(timestamp) {
    const now = typeof timestamp === 'number' ? timestamp : performance.now();
    if (!lastLoopTime) lastLoopTime = now;
    const rawDt = now - lastLoopTime;
    lastLoopTime = now;
    // Bound dt between 0 and 100ms to avoid huge jumps on tab switch
    const dt = Math.min(Math.max(rawDt, 0), 100);
    // Reference: 60 FPS => 16.6667ms per frame
    const timeScale = dt > 0 ? (dt / 16.6667) : 1;

    update(timeScale);
    render();
    requestAnimationFrame(loop);
  }

  window.BS.App = {
    getState: () => state,
    getNPCs: () => npcs,
    getPlayer: () => player,
    isTransitioning: () => fade.active,
    startChapter,
    restartChapter,
    returnToMenu,
    togglePauseMenu,
    toggleSelectNotes,
    transitionToFloor,
    triggerA
  };

  function setupTitleBgm() {
    // Attempt Title Screen BGM playback immediately, with seamless unlock on any user gesture
    const tryUnlock = () => {
      if (!isTitleVisible()) return;
      window.BS.Audio.unlockTitleBgmIfNeeded();
    };

    ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach((evt) => {
      window.addEventListener(evt, tryUnlock, { capture: true, passive: true });
    });

    // Try starting playback immediately upon loading
    window.BS.Audio.startTitleBgm();
  }

  setupButtons();
  setupGBAControls();
  setupTitleBgm();
  refreshHUD();
  requestAnimationFrame(loop);
})();
