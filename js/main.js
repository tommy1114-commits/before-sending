(function () {
  window.BS = window.BS || {};

  const $ = (id) => document.getElementById(id);
  const TILE = window.BS.Map.TILE;

  let currentChapter = 1;
  let state = window.BS.State.createStateForChapter(1);
  let npcs = window.BS.Map.createNPCsForChapter(1);

  const player = {
    x: 3,
    y: 9,
    px: 3 * TILE,
    py: 9 * TILE,
    dir: 'up',
    moving: false,
    fromX: 3,
    fromY: 9,
    toX: 3,
    toY: 9,
    moveProgress: 0,
    walkToggle: 0
  };

  const heldDirs = [];
  let tick = 0;
  let story = null;
  let nearbyTarget = null;

  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function resetPlayer(spawnX, spawnY, dir) {
    player.x = spawnX;
    player.y = spawnY;
    player.px = spawnX * TILE;
    player.py = spawnY * TILE;
    player.dir = dir || 'up';
    player.moving = false;
    player.moveProgress = 0;
    heldDirs.length = 0;
  }

  function moveNpcTo(npcId, tx, ty, dir) {
    const npc = npcs.find((n) => n.id === npcId);
    if (!npc) return;
    if (player.x === tx && player.y === ty) {
      npc.x = tx + 1;
      npc.y = ty;
    } else {
      npc.x = tx;
      npc.y = ty;
    }
    npc.dir = dir || 'down';
  }

  function advanceTime(mins) {
    const maxTime = currentChapter === 2 ? 18 * 60 + 55 : 16 * 60 + 5;
    state.timeMinutes = Math.min(maxTime, state.timeMinutes + mins);
  }

  function refreshHUD() {
    $('hud-chapter-badge').textContent = currentChapter === 2 ? 'Ch2 投稿前一晚' : 'Ch1 寄出之前';
    $('hud-clock').textContent = `🕒 ${window.BS.State.formatClock(state.timeMinutes)}`;
    $('hud-zone').textContent = window.BS.Map.getZoneName(player.x, player.y);

    const pill1 = $('pill-task1');
    const pill2 = $('pill-task2');
    pill1.className = 'task-pill';
    pill2.className = 'task-pill';

    if (currentChapter === 2) {
      const c = state.ch2;
      const wv = window.BS.State.getWorkingVersion(state);

      if (c.pendingReviewVersionId) {
        pill1.classList.add('warn');
        pill1.textContent = '🎨 海報：待阿明組長確認';
      } else if (wv.status === 'approved') {
        pill1.classList.add('done');
        pill1.textContent = `🎨 海報：${wv.id} 已核准`;
      } else if (wv.status === 'needs_reapproval') {
        pill1.classList.add('warn');
        pill1.textContent = `🎨 海報：${wv.id} 待重新確認`;
      } else if (c.openedPoster) {
        pill1.textContent = `🎨 海報：檢視中 (${wv.id})`;
      } else {
        pill1.textContent = '🎨 海報：看電腦草稿';
      }

      if (c.outcome === 'submitted_approved') {
        pill2.classList.add('done');
        pill2.textContent = '📤 投稿：核准版已提交';
      } else if (c.outcome === 'deferred') {
        pill2.classList.add('warn');
        pill2.textContent = '📤 投稿：已暫緩（可交班）';
      } else if (c.outcome === 'misuploaded') {
        if (c.contactedOrganizer && c.reportedToLead) {
          pill2.classList.add('warn');
          pill2.textContent = '📤 投稿：已撤換請求（待確認）';
        } else {
          pill2.classList.add('alert');
          pill2.textContent = !c.contactedOrganizer ? '🚨 誤傳：請回電腦聯絡主辦方' : '🚨 誤傳：請找阿明組長回報';
        }
      } else {
        pill2.textContent = '📤 投稿：待決定';
      }
    } else {
      // Chapter 1 pills
      if (state.email.misshared && (!state.email.linkRevoked || !state.email.reportedToLead)) {
        pill1.classList.add('alert');
        pill1.textContent = !state.email.linkRevoked ? '🚨 誤分享：請立即停權' : '🚨 誤分享：請找阿明組長通報';
      } else if (state.email.status === 'sent_safe') {
        pill1.classList.add('done');
        pill1.textContent = '✉ 來信：已安全寄出';
      } else if (state.email.status === 'misshared_remediated') {
        pill1.classList.add('warn');
        pill1.textContent = '✉ 來信：已停權並通報';
      } else if (state.email.status === 'sent_unverified') {
        pill1.classList.add('warn');
        pill1.textContent = '✉ 來信：已寄出(未核NDA)';
      } else if (state.email.status === 'holding') {
        pill1.classList.add('warn');
        pill1.textContent = '✉ 來信：已回覆確認中';
      } else {
        pill1.textContent = '✉ 來信：待處理';
      }

      if (state.visitor.status === 'done_entrance' || state.visitor.status === 'done_lab_clean') {
        pill2.classList.add('done');
        pill2.textContent = '📷 訪客：安全完成';
      } else if (state.visitor.status === 'done_lab_leaked') {
        pill2.classList.add('alert');
        pill2.textContent = '📷 訪客：敏感資訊入鏡';
      } else if (state.visitor.status === 'in_lab') {
        pill2.classList.add('warn');
        pill2.textContent = '📷 訪客：實驗區等候中';
      } else {
        pill2.textContent = '📷 訪客：入口等候';
      }
    }

    const unlocked = window.BS.State.loadUnlockedEndings();
    const total = window.BS.State.ENDINGS_CATALOG.length;
    $('title-ending-count').textContent = `${unlocked.length}/${total}`;
  }

  function startChapter(chapter) {
    currentChapter = chapter === 2 ? 2 : 1;
    window.BS.UI.closeAllModals();
    window.BS.UI.closeDialogue();
    $('title-screen').classList.add('hidden');

    state = window.BS.State.createStateForChapter(currentChapter);
    state.started = true;
    npcs = window.BS.Map.createNPCsForChapter(currentChapter);

    if (currentChapter === 2) {
      resetPlayer(7, 6, 'right'); // Facing 阿文 at office doorway (9,6) for opening scene
    } else {
      resetPlayer(3, 9, 'up'); // Standing by Duty Desk in Office
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
    state.started = false;
    $('title-screen').classList.remove('hidden');
    refreshHUD();
  }

  story = window.BS.Story.createStoryController({
    getState: () => state,
    getNPCs: () => npcs,
    advanceTime,
    refreshHUD,
    restartChapter,
    returnToMenu,
    moveNpcTo
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

  function triggerInteract() {
    if (window.BS.UI.isOverlayOpen()) {
      window.BS.UI.advanceDialogue();
      return;
    }
    if (nearbyTarget) {
      if (nearbyTarget.type === 'npc') {
        const npc = npcs.find((n) => n.id === nearbyTarget.id);
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

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const m = window.BS.UI.getActiveModal();
      if (m && m !== 'handover') {
        window.BS.Audio.cancel();
        window.BS.UI.closeAllModals();
        e.preventDefault();
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
      triggerInteract();
    }
  });

  window.addEventListener('keyup', (e) => {
    const dir = keyToDir(e.key);
    if (dir) releaseDir(dir);
  });

  window.addEventListener('blur', () => {
    heldDirs.length = 0;
  });

  function setupTouchControls() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 760;
    const padEl = $('touch-gamepad');
    const toggleBtn = $('btn-pad-toggle');

    function setPadVisible(vis) {
      padEl.classList.toggle('hidden', !vis);
      toggleBtn.classList.toggle('active', vis);
    }

    setPadVisible(isTouch);

    toggleBtn.addEventListener('click', () => {
      const nowVisible = padEl.classList.contains('hidden');
      setPadVisible(nowVisible);
      window.BS.Audio.select();
    });

    document.querySelectorAll('.dpad-btn').forEach((btn) => {
      const dir = btn.dataset.dir;
      const start = (ev) => {
        ev.preventDefault();
        btn.classList.add('pressed');
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
      triggerInteract();
    });

    $('touch-b').addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      const m = window.BS.UI.getActiveModal();
      if (m && m !== 'handover') {
        window.BS.Audio.cancel();
        window.BS.UI.closeAllModals();
      } else if (!window.BS.UI.isOverlayOpen()) {
        window.BS.Audio.select();
        window.BS.UI.openCluesModal(state);
      }
    });
  }

  function setupButtons() {
    window.BS.UI.bindStaticHandlers();

    $('btn-start-ch1').addEventListener('click', () => {
      window.BS.Audio.confirm();
      startChapter(1);
    });

    $('btn-start-ch2').addEventListener('click', () => {
      window.BS.Audio.confirm();
      startChapter(2);
    });

    $('btn-title-endings').addEventListener('click', () => {
      window.BS.Audio.select();
      window.BS.UI.openEndingsModal();
    });

    $('btn-clues').addEventListener('click', () => {
      if (!$('title-screen').classList.contains('hidden')) return;
      window.BS.Audio.select();
      if (window.BS.UI.getActiveModal() === 'clues') {
        window.BS.UI.closeAllModals();
      } else if (!window.BS.UI.isOverlayOpen()) {
        window.BS.UI.openCluesModal(state);
      }
    });

    $('btn-endings').addEventListener('click', () => {
      window.BS.Audio.select();
      if (window.BS.UI.getActiveModal() === 'endings') {
        window.BS.UI.closeAllModals();
      } else if (window.BS.UI.getActiveModal() !== 'handover') {
        window.BS.UI.closeAllModals();
        window.BS.UI.openEndingsModal();
      }
    });

    $('btn-restart').addEventListener('click', () => {
      if (!$('title-screen').classList.contains('hidden')) return;
      window.BS.Audio.confirm();
      restartChapter();
    });

    $('btn-menu').addEventListener('click', () => {
      window.BS.Audio.cancel();
      returnToMenu();
    });

    $('btn-sound').addEventListener('click', () => {
      const muted = window.BS.Audio.toggleMute();
      $('btn-sound').textContent = muted ? '🔇' : '🔊';
      if (!muted) window.BS.Audio.select();
    });

    canvas.addEventListener('click', () => {
      if (!window.BS.UI.isOverlayOpen() && nearbyTarget) {
        triggerInteract();
      }
    });
  }

  // ===== Update Loop =====
  const MOVE_SPEED = 0.135;

  function update() {
    tick++;

    if (!window.BS.UI.isOverlayOpen()) {
      if (player.moving) {
        player.moveProgress += MOVE_SPEED;
        if (player.moveProgress >= 1) {
          player.x = player.toX;
          player.y = player.toY;
          player.px = player.x * TILE;
          player.py = player.y * TILE;
          player.moving = false;
          player.moveProgress = 0;
          $('hud-zone').textContent = window.BS.Map.getZoneName(player.x, player.y);
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
        if (!window.BS.Map.isSolid(nx, ny, npcs)) {
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

    nearbyTarget = window.BS.Map.findNearbyTarget(player.x, player.y, player.dir, npcs);
    $('nearby-hint').textContent = nearbyTarget
      ? `按空白鍵 / A 互動：${nearbyTarget.label}`
      : '走近物件或同事查看提示';
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    window.BS.Map.drawMap(ctx, state, tick);

    // Depth-sorted characters
    const drawables = npcs.map((n) => ({
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

    // Chapter-specific quest markers
    if (currentChapter === 1) {
      if (state.email.misshared && !state.email.linkRevoked) {
        drawQuestBubble(3, 2.5, '!', '#ef4444', '#ffffff');
      } else if (state.email.misshared && state.email.linkRevoked && !state.email.reportedToLead) {
        drawQuestBubble(7, 3.6, '!', '#ef4444', '#ffffff');
      } else if (state.email.status === 'unread' || state.email.status === 'read' || state.email.status === 'holding') {
        drawQuestBubble(3, 2.5, '!', '#f59e0b', '#1e293b');
      }

      if (state.visitor.status === 'waiting' || state.visitor.status === 'in_lab') {
        const vNpc = npcs.find((n) => n.id === 'npc_visitor');
        if (vNpc) {
          drawQuestBubble(vNpc.x, vNpc.y - 0.3, '!', '#38bdf8', '#0f172a');
        }
      }
    } else {
      const c = state.ch2;
      if (c.misuploaded && !c.contactedOrganizer) {
        drawQuestBubble(3, 2.5, '!', '#ef4444', '#ffffff');
      } else if (!c.openedPoster || (c.outcome === 'in_progress' && c.lastApprovedVersionId)) {
        drawQuestBubble(3, 2.5, '!', '#f59e0b', '#1e293b');
      }

      if (c.misuploaded && !c.reportedToLead) {
        drawQuestBubble(7, 3.6, '!', '#ef4444', '#ffffff');
      } else if (c.pendingReviewVersionId) {
        drawQuestBubble(7, 3.6, '!', '#22c55e', '#ffffff');
      } else if (!c.clues.mingExplainedRules && c.outcome === 'in_progress') {
        drawQuestBubble(7, 3.6, '?', '#38bdf8', '#0f172a');
      }

      if (!c.clues.wenExplainedFig2 && c.outcome === 'in_progress') {
        const wen = npcs.find((n) => n.id === 'npc_colleague');
        if (wen) drawQuestBubble(wen.x, wen.y - 0.3, '?', '#38bdf8', '#0f172a');
      }
    }

    if (window.BS.State.canHandover(state) && !state.handoverDone) {
      drawQuestBubble(3, 7.5, '✓', '#22c55e', '#ffffff');
    }

    // Floating interaction tooltip
    if (nearbyTarget && !window.BS.UI.isOverlayOpen()) {
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
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  // Expose lightweight helper for debugging/verification without polluting global scope
  window.BS.App = {
    getState: () => state,
    getNPCs: () => npcs,
    getPlayer: () => player,
    startChapter,
    restartChapter,
    returnToMenu,
    triggerInteract
  };

  setupButtons();
  setupTouchControls();
  refreshHUD();
  requestAnimationFrame(loop);
})();
