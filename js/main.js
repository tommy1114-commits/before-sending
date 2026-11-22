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
    player.floor = floor;
    player.x = spawnX;
    player.y = spawnY;
    player.px = spawnX * TILE;
    player.py = spawnY * TILE;
    player.dir = dir || 'up';
    player.moving = false;
    player.moveProgress = 0;
    heldDirs.length = 0;
  }

  function transitionToFloor(targetFloor, spawnX, spawnY, spawnDir, onDone) {
    if (fade.active) return;
    const goingUp = targetFloor > player.floor;
    window.BS.Audio.stairs(goingUp);
    heldDirs.length = 0;
    player.moving = false;
    fade.active = true;
    fade.alpha = 0;
    fade.phase = 'out';
    fade.pending = { floor: targetFloor, x: spawnX, y: spawnY, dir: spawnDir || 'down', onDone: onDone || null };
  }

  function moveNpcTo(npcId, floor, tx, ty, dir) {
    const npc = npcs.find((n) => n.id === npcId);
    if (!npc) return;
    npc.floor = floor;
    if (player.floor === floor && player.x === tx && player.y === ty) {
      npc.x = tx + 1;
      npc.y = ty;
    } else {
      npc.x = tx;
      npc.y = ty;
    }
    npc.dir = dir || 'down';
  }

  function advanceTime(mins) {
    const maxTime =
      currentChapter === 4
        ? 17 * 60 + 25
        : currentChapter === 3
        ? 17 * 60 + 55
        : currentChapter === 2
        ? 18 * 60 + 55
        : 16 * 60 + 5;
    state.timeMinutes = Math.min(maxTime, state.timeMinutes + mins);
  }

  function refreshHUD() {
    const microHud = $('micro-hud');
    if (isTitleVisible()) {
      microHud.classList.add('hidden');
      return;
    }
    microHud.classList.remove('hidden');

    $('micro-chapter').textContent =
      currentChapter === 3
        ? 'Ch4 阿文的最後一天'
        : currentChapter === 4
        ? 'Ch3 今天的紀錄，明天找得到'
        : currentChapter === 2
        ? 'Ch2 投稿前一晚'
        : 'Ch1 寄出之前';
    $('micro-clock').textContent = `🕒 ${window.BS.State.formatClock(state.timeMinutes)}`;
    $('micro-zone').textContent = window.BS.Map.getZoneName(player.floor, player.x, player.y);

    const statusPill = $('micro-status');
    statusPill.className = 'micro-pill task hidden';

    const urgentAlert =
      (currentChapter === 1 && state.email.misshared && (!state.email.linkRevoked || !state.email.reportedToLead)) ||
      (currentChapter === 2 && state.ch2.misuploaded && (!state.ch2.contactedOrganizer || !state.ch2.reportedToLead)) ||
      (currentChapter === 3 && state.ch3.interruptedByEarlyRevoke && state.ch3.rawLogLocation !== 'project');

    const readyToastNow =
      currentChapter === 4
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
            ? '🚨 回 2F 電腦停權！'
            : '🚨 找 2F 阿明組長通報！'
          : currentChapter === 2
          ? !state.ch2.contactedOrganizer
            ? '🚨 回 2F 電腦聯絡主辦方！'
            : '🚨 找 2F 阿明組長回報！'
          : '🚨 下樓找 1F 阿明組長補救移交！';
    } else if (readyToastNow) {
      statusPill.classList.remove('hidden');
      statusPill.textContent = '✨ 任務完成！回 2F 值班桌交班';
      if (!handoverToastShown) {
        handoverToastShown = true;
        window.BS.UI.showToast('🎉 任務已處理完成！請回到 2F 辦公區值班桌（綠勾 ✓）完成交班與通關！', false, 5200);
      }
    }
  }

  function startChapter(chapter) {
    currentChapter = chapter === 4 ? 4 : chapter === 3 ? 3 : chapter === 2 ? 2 : 1;
    handoverToastShown = false;
    window.BS.Audio.stopTitleBgm(750);
    window.BS.UI.closeAllModals();
    window.BS.UI.closeDialogue();
    $('title-screen').classList.add('hidden');
    fade.active = false;
    fade.alpha = 0;

    state = window.BS.State.createStateForChapter(currentChapter);
    state.started = true;
    npcs = window.BS.Map.createNPCsForChapter(currentChapter);

    if (currentChapter === 2 || currentChapter === 3 || currentChapter === 4) {
      resetPlayer(2, 7, 5, 'right');
    } else {
      resetPlayer(2, 5, 5, 'up');
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
    const displayOrder = [1, 2, 4, 3];
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
          } else {
            npc.dir = dy > 0 ? 'down' : 'up';
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
        window.BS.UI.moveTitleCursor(-1);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
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
        window.BS.UI.movePauseCursor(-1);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
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

  function setupGBAControls() {
    document.querySelectorAll('.dpad-btn').forEach((btn) => {
      const dir = btn.dataset.dir;
      const start = (ev) => {
        ev.preventDefault();
        btn.classList.add('pressed');
        const modal = window.BS.UI.getActiveModal();
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
          if (dir === 'up') window.BS.UI.handleDialogueKey('ArrowUp');
          if (dir === 'down') window.BS.UI.handleDialogueKey('ArrowDown');
          return;
        }
        pushDir(dir);
      };
      const end = (ev) => {
        ev.preventDefault();
        btn.classList.remove('pressed');
        releaseDir(dir);
      };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointerleave', end);
      btn.addEventListener('pointercancel', end);
    });

    $('touch-a').addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      triggerA();
    });

    $('touch-b').addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      triggerB();
    });

    $('btn-start-gba').addEventListener('click', () => {
      togglePauseMenu();
    });

    $('btn-select-gba').addEventListener('click', () => {
      toggleSelectNotes();
    });
  }

  function setupButtons() {
    window.BS.UI.bindStaticHandlers();

    // Title Cursor Menu hover + click
    document.querySelectorAll('#title-menu-list .cursor-menu-item').forEach((btn) => {
      const idx = Number(btn.dataset.idx);
      btn.addEventListener('mouseenter', () => {
        window.BS.UI.setTitleCursor(idx);
        window.BS.Audio.select();
      });
    });

    $('btn-start-ch1').addEventListener('click', () => {
      window.BS.Audio.confirm();
      startChapter(1);
    });

    $('btn-start-ch2').addEventListener('click', () => {
      window.BS.Audio.confirm();
      startChapter(2);
    });

    $('btn-start-ch4').addEventListener('click', () => {
      window.BS.Audio.confirm();
      startChapter(4);
    });

    $('btn-start-ch3').addEventListener('click', () => {
      window.BS.Audio.confirm();
      startChapter(3);
    });

    canvas.addEventListener('click', () => {
      if (!window.BS.UI.isOverlayOpen() && nearbyTarget) {
        triggerA();
      }
    });
  }

  // ===== Update Loop =====
  const MOVE_SPEED = 0.135;

  function updateFade() {
    if (!fade.active) return;
    if (fade.phase === 'out') {
      fade.alpha += 0.14;
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
      fade.alpha -= 0.14;
      if (fade.alpha <= 0) {
        fade.alpha = 0;
        fade.active = false;
        const cb = fade.pending && fade.pending.onDone;
        fade.pending = null;
        if (cb) cb();
      }
    }
  }

  function update() {
    tick++;
    updateFade();

    if (isTitleVisible()) {
      $('nearby-hint').textContent = '↑↓ 移動游標選擇章節 · 按 A / START / Enter 進入';
      return;
    }

    if (!fade.active && !window.BS.UI.isOverlayOpen()) {
      if (player.moving) {
        player.moveProgress += MOVE_SPEED;
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
    $('nearby-hint').textContent = nearbyTarget
      ? `按 A / 空白鍵互動：${nearbyTarget.label}`
      : '走近物件或同事查看提示 · START 選單 · SELECT 筆記';
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
      sortY: n.y * TILE,
      draw: () => {
        const sp = window.BS.Sprites.getChar(n.sprite, n.dir, 0);
        ctx.drawImage(sp, n.x * TILE, n.y * TILE - 4);
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
      const emailUrgent = state.email.misshared && (!state.email.linkRevoked || !state.email.reportedToLead);
      const emailPending = state.email.status === 'unread' || state.email.status === 'read' || state.email.status === 'holding';
      const visitorWaiting1F = vNpc && vNpc.floor === 1 && state.visitor.status === 'waiting';
      const handoverReady = window.BS.State.canHandover(state) && !state.handoverDone;

      if (player.floor === 2) {
        if (state.email.misshared && !state.email.linkRevoked) {
          drawQuestBubble(3, 2.5, '!', '#ef4444', '#ffffff');
        } else if (state.email.misshared && state.email.linkRevoked && !state.email.reportedToLead) {
          drawQuestBubble(8, 11.6, '!', '#ef4444', '#ffffff');
        } else if (emailPending) {
          drawQuestBubble(3, 2.5, '!', '#f59e0b', '#1e293b');
        }
        if (vNpc && vNpc.floor === 2 && state.visitor.status === 'in_lab') {
          drawQuestBubble(vNpc.x, vNpc.y - 0.3, '!', '#38bdf8', '#0f172a');
        }
        if (visitorWaiting1F) {
          drawQuestBubble(3, 7.1, '▼', '#38bdf8', '#0f172a');
        }
        if (handoverReady) {
          drawQuestBubble(7, 2.5, '✓', '#22c55e', '#ffffff');
        }
      } else {
        if (visitorWaiting1F) {
          drawQuestBubble(vNpc.x, vNpc.y - 0.3, '!', '#38bdf8', '#0f172a');
        }
        if (emailUrgent) {
          drawQuestBubble(3, 7.1, '▲', '#ef4444', '#ffffff');
        } else if (handoverReady) {
          drawQuestBubble(3, 7.1, '▲', '#22c55e', '#ffffff');
        } else if (emailPending || state.visitor.status === 'in_lab') {
          drawQuestBubble(3, 7.1, '▲', '#f59e0b', '#1e293b');
        }
      }
    } else if (currentChapter === 2) {
      const c = state.ch2;
      const handoverReady = window.BS.State.canHandover(state) && !state.handoverDone;
      if (player.floor === 2) {
        if (c.misuploaded && !c.contactedOrganizer) {
          drawQuestBubble(3, 2.5, '!', '#ef4444', '#ffffff');
        } else if (!c.openedPoster || (c.outcome === 'in_progress' && c.lastApprovedVersionId)) {
          drawQuestBubble(3, 2.5, '!', '#f59e0b', '#1e293b');
        }

        if (c.misuploaded && !c.reportedToLead) {
          drawQuestBubble(8, 11.6, '!', '#ef4444', '#ffffff');
        } else if (c.pendingReviewVersionId) {
          drawQuestBubble(8, 11.6, '!', '#22c55e', '#ffffff');
        } else if (!c.clues.mingExplainedRules && c.outcome === 'in_progress') {
          drawQuestBubble(8, 11.6, '?', '#38bdf8', '#0f172a');
        }

        if (!c.clues.wenExplainedFig2 && c.outcome === 'in_progress') {
          const wen = npcs.find((n) => n.id === 'npc_colleague');
          if (wen && wen.floor === 2) drawQuestBubble(wen.x, wen.y - 0.3, '?', '#38bdf8', '#0f172a');
        }
        if (handoverReady) {
          drawQuestBubble(7, 2.5, '✓', '#22c55e', '#ffffff');
        }
      } else {
        drawQuestBubble(3, 7.1, '▲', c.misuploaded ? '#ef4444' : '#f59e0b', c.misuploaded ? '#ffffff' : '#1e293b');
      }
    } else if (currentChapter === 4) {
      // Chapter 3 (Internal 4): 今天的紀錄，明天找得到 cross-floor quest markers
      const c = state.ch4;
      const lookup = window.BS.State.evaluateCh4Lookup(state);
      const allDone = lookup.allOk && !state.handoverDone;
      const needInv = lookup.steps[0].cls !== 'ok';
      const needRec = lookup.steps[1].cls !== 'ok' || lookup.steps[3].cls !== 'ok' || (c.rawFileLocation === 'team' && c.record.rawFileLink !== 'team');
      const needRaw = c.rawFileLocation !== 'team';

      if (player.floor === 2) {
        if (needInv) {
          drawQuestBubble(3, 2.5, '!', '#f59e0b', '#1e293b');
        }
        const wen = npcs.find((n) => n.id === 'npc_colleague');
        if (wen && wen.floor === 2 && !c.clues.awenInfo) {
          drawQuestBubble(wen.x, wen.y - 0.3, '!', '#38bdf8', '#0f172a');
        }
        if (!c.clues.instrumentFile || needRaw) {
          drawQuestBubble(19, 2.5, '!', '#f59e0b', '#1e293b');
        }
        if (needRec) {
          drawQuestBubble(16, 10.6, '!', c.rawFileLocation === 'team' && c.record.rawFileLink !== 'team' ? '#ef4444' : '#38bdf8', '#ffffff');
        }
        if (!c.clues.qingChecklistReq) {
          drawQuestBubble(3, 7.1, '▼', '#38bdf8', '#0f172a');
        }
        if (allDone) {
          drawQuestBubble(7, 2.5, '✓', '#22c55e', '#ffffff');
        }
      } else {
        const qing = npcs.find((n) => n.id === 'npc_qing');
        if (qing && qing.floor === 1 && (!c.clues.qingChecklistReq || allDone)) {
          drawQuestBubble(qing.x, qing.y - 0.3, allDone ? '✓' : '!', allDone ? '#22c55e' : '#38bdf8', allDone ? '#ffffff' : '#0f172a');
        }
        const lead = npcs.find((n) => n.id === 'npc_lead');
        if (lead && lead.floor === 1 && !allDone) {
          drawQuestBubble(lead.x, lead.y - 0.3, '?', '#f59e0b', '#1e293b');
        }
        drawQuestBubble(3, 7.1, '▲', allDone ? '#22c55e' : '#f59e0b', allDone ? '#ffffff' : '#1e293b');
      }
    } else {
      // Chapter 4 (Internal 3) cross-floor quest markers!
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
          drawQuestBubble(3, 2.5, '!', '#f59e0b', '#1e293b');
        }
        const wen = npcs.find((n) => n.id === 'npc_colleague');
        if (wen && wen.floor === 2 && ((c.rawLogLocation !== 'project' && c.awenOrigAccess !== 'revoked') || !c.ndaRemindedToAwen)) {
          drawQuestBubble(wen.x, wen.y - 0.3, '!', '#38bdf8', '#0f172a');
        }
        const qing = npcs.find((n) => n.id === 'npc_qing');
        if (qing && qing.floor === 2 && !c.qingConfirmedOpen) {
          drawQuestBubble(
            qing.x,
            qing.y - 0.3,
            c.rawLogLocation === 'project' && c.qingHasProjectAccess ? '!' : '?',
            c.rawLogLocation === 'project' && c.qingHasProjectAccess ? '#22c55e' : '#38bdf8',
            c.rawLogLocation === 'project' && c.qingHasProjectAccess ? '#ffffff' : '#0f172a'
          );
        }
        if (need1F) {
          drawQuestBubble(3, 7.1, '▼', c.interruptedByEarlyRevoke && c.rawLogLocation !== 'project' ? '#ef4444' : '#38bdf8', '#ffffff');
        }
        if (allDone) {
          drawQuestBubble(7, 2.5, '✓', '#22c55e', '#ffffff');
        }
      } else {
        // On 1F in Ch3
        const lead = npcs.find((n) => n.id === 'npc_lead');
        if (lead && lead.floor === 1 && (!c.clues.mingConfirmedScope || (c.interruptedByEarlyRevoke && c.rawLogLocation !== 'project'))) {
          drawQuestBubble(lead.x, lead.y - 0.3, '!', c.interruptedByEarlyRevoke && c.rawLogLocation !== 'project' ? '#ef4444' : '#f59e0b', '#ffffff');
        }
        if (!c.badgeReturned) {
          drawQuestBubble(6.5, 10.3, '!', '#38bdf8', '#0f172a');
        }
        if (need2F) {
          drawQuestBubble(3, 7.1, '▲', allDone ? '#22c55e' : '#f59e0b', allDone ? '#ffffff' : '#1e293b');
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

  function loop() {
    update();
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
    // Always play Title Screen BGM automatically (with seamless gesture unlock if browser policy initially defers autoplay)
    const tryUnlock = (ev) => {
      if (!isTitleVisible()) return;
      if (ev.target && ev.target.closest && ev.target.closest('.cursor-menu-item')) return;
      window.BS.Audio.unlockTitleBgmIfNeeded();
    };
    window.addEventListener('pointerdown', tryUnlock, { capture: true });
    window.addEventListener('click', tryUnlock, { capture: true });
    window.addEventListener('touchstart', tryUnlock, { capture: true, passive: true });
    window.addEventListener('keydown', (ev) => {
      if (!isTitleVisible()) return;
      if (ev.key === 'Enter' || ev.key === ' ') return;
      window.BS.Audio.unlockTitleBgmIfNeeded();
    }, { capture: true });

    window.BS.Audio.startTitleBgm();
  }

  setupButtons();
  setupGBAControls();
  setupTitleBgm();
  refreshHUD();
  requestAnimationFrame(loop);
})();
