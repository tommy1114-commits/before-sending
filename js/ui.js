(function () {
  window.BS = window.BS || {};

  const $ = (id) => document.getElementById(id);

  let dialogueQueue = [];
  let currentLine = null;
  let typingTimer = null;
  let typedIndex = 0;
  let selectedChoice = 0;
  let onDialogueEnd = null;
  let activeModal = null; // 'pc' | 'poster' | 'camera' | 'clues' | 'endings' | 'handover' | null
  let toastTimer = null;

  function isOverlayOpen() {
    return !!(currentLine || activeModal || !$('title-screen').classList.contains('hidden'));
  }

  function showToast(msg, isAlert = false, duration = 3600) {
    const el = $('toast-banner');
    el.textContent = msg;
    el.classList.toggle('alert', isAlert);
    el.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.add('hidden');
    }, duration);
  }

  // ===== Dialogue System =====
  function startDialogue(lines, onComplete) {
    dialogueQueue = lines.slice();
    onDialogueEnd = onComplete || null;
    $('dialogue-box').classList.remove('hidden');
    showNextLine();
  }

  function showNextLine() {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }

    if (dialogueQueue.length === 0) {
      closeDialogue();
      return;
    }

    currentLine = dialogueQueue.shift();
    $('dialogue-speaker').textContent = currentLine.speaker || '';
    $('dialogue-text').textContent = '';
    $('dialogue-choices').innerHTML = '';
    $('dialogue-choices').classList.add('hidden');
    $('dialogue-next-hint').classList.add('hidden');

    const portraitWrap = $('dialogue-portrait-wrap');
    if (currentLine.portrait) {
      portraitWrap.classList.remove('hidden');
      window.BS.Sprites.drawPortrait($('portrait-canvas'), currentLine.portrait);
    } else {
      portraitWrap.classList.add('hidden');
    }

    const fullText = currentLine.text || '';
    typedIndex = 0;

    typingTimer = setInterval(() => {
      typedIndex += 2;
      if (typedIndex >= fullText.length) {
        finishTyping();
      } else {
        $('dialogue-text').textContent = fullText.slice(0, typedIndex);
        if (typedIndex % 6 === 0) {
          window.BS.Audio.blip();
        }
      }
    }, 22);
  }

  function finishTyping() {
    if (!currentLine) return;
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
    $('dialogue-text').textContent = currentLine.text || '';

    if (currentLine.choices && currentLine.choices.length > 0) {
      renderChoices(currentLine.choices);
    } else {
      $('dialogue-next-hint').classList.remove('hidden');
    }
  }

  function renderChoices(choices) {
    const container = $('dialogue-choices');
    container.innerHTML = '';
    selectedChoice = 0;
    choices.forEach((ch, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn' + (idx === 0 ? ' selected' : '');
      btn.innerHTML = `<span class="choice-arrow">${idx === 0 ? '▶' : ''}</span><span>${ch.label}</span>`;
      btn.addEventListener('mouseenter', () => updateChoiceHighlight(idx));
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        chooseOption(idx);
      });
      container.appendChild(btn);
    });
    container.classList.remove('hidden');
  }

  function updateChoiceHighlight(idx) {
    if (!currentLine || !currentLine.choices) return;
    const count = currentLine.choices.length;
    selectedChoice = (idx + count) % count;
    const btns = $('dialogue-choices').querySelectorAll('.choice-btn');
    btns.forEach((b, i) => {
      b.classList.toggle('selected', i === selectedChoice);
      b.querySelector('.choice-arrow').textContent = i === selectedChoice ? '▶' : '';
    });
    window.BS.Audio.select();
  }

  function chooseOption(idx) {
    if (!currentLine || !currentLine.choices) return;
    const picked = currentLine.choices[idx];
    window.BS.Audio.confirm();
    const cb = picked.onSelect;
    currentLine = null;
    dialogueQueue = [];
    $('dialogue-box').classList.add('hidden');
    if (cb) cb();
  }

  function advanceDialogue() {
    if (!currentLine) return;
    if (typingTimer) {
      finishTyping();
      return;
    }
    if (currentLine.choices && currentLine.choices.length > 0) {
      chooseOption(selectedChoice);
      return;
    }
    window.BS.Audio.select();
    showNextLine();
  }

  function closeDialogue() {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
    currentLine = null;
    dialogueQueue = [];
    $('dialogue-box').classList.add('hidden');
    const cb = onDialogueEnd;
    onDialogueEnd = null;
    if (cb) cb();
  }

  function handleDialogueKey(key) {
    if (!currentLine) return false;
    if (currentLine.choices && currentLine.choices.length > 0 && !typingTimer) {
      if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        updateChoiceHighlight(selectedChoice - 1);
        return true;
      }
      if (key === 'ArrowDown' || key === 's' || key === 'S') {
        updateChoiceHighlight(selectedChoice + 1);
        return true;
      }
    }
    if (key === ' ' || key === 'Enter') {
      advanceDialogue();
      return true;
    }
    return false;
  }

  let titleCursorIdx = 0;
  let pauseCursorIdx = 0;
  let pauseActions = [];
  let clearFxParticles = [];
  let clearFxIsWarn = false;
  let lastClearContext = null;

  // ===== Modal Helpers =====
  function closeAllModals() {
    [
      'computer-modal',
      'poster-modal',
      'offboard-modal',
      'record-modal',
      'lookup-modal',
      'camera-modal',
      'clues-modal',
      'endings-modal',
      'handover-modal',
      'pause-modal',
      'clear-screen'
    ].forEach((id) => {
      const el = $(id);
      if (el) el.classList.add('hidden');
    });
    activeModal = null;
  }

  // ===== Title Screen Retro Cursor Menu =====
  function setTitleCursor(idx) {
    const items = Array.from(document.querySelectorAll('#title-menu-list .cursor-menu-item'));
    if (!items.length) return;
    titleCursorIdx = ((idx % items.length) + items.length) % items.length;
    items.forEach((btn, i) => btn.classList.toggle('selected', i === titleCursorIdx));
  }

  function moveTitleCursor(delta) {
    setTitleCursor(titleCursorIdx + delta);
    window.BS.Audio.select();
  }

  function confirmTitleCursor() {
    const items = Array.from(document.querySelectorAll('#title-menu-list .cursor-menu-item'));
    if (items[titleCursorIdx]) {
      items[titleCursorIdx].click();
    }
  }

  // ===== GBA START Pause Menu =====
  function setPauseCursor(idx) {
    const items = Array.from(document.querySelectorAll('#pause-menu-list .cursor-menu-item'));
    if (!items.length) return;
    pauseCursorIdx = ((idx % items.length) + items.length) % items.length;
    items.forEach((btn, i) => btn.classList.toggle('selected', i === pauseCursorIdx));
  }

  function movePauseCursor(delta) {
    setPauseCursor(pauseCursorIdx + delta);
    window.BS.Audio.select();
  }

  function confirmPauseCursor() {
    if (pauseActions[pauseCursorIdx]) {
      pauseActions[pauseCursorIdx]();
    }
  }

  function openPauseModal(state, zoneName, callbacks) {
    activeModal = 'pause';
    $('pause-modal').classList.remove('hidden');
    const unlocked = window.BS.State.loadUnlockedEndings();
    const total = window.BS.State.ENDINGS_CATALOG.length;
    const chLabel =
      state.chapter === 3
        ? '第四章「阿文的最後一天」'
        : state.chapter === 4
        ? '第三章「今天的紀錄，明天找得到」'
        : state.chapter === 2
        ? '第二章「投稿前一晚」'
        : '第一章「寄出之前」';
    const muted = window.BS.Audio.isMuted();

    const menuItems = [
      {
        label: '繼續遊戲',
        action: () => {
          window.BS.Audio.confirm();
          closeAllModals();
        }
      },
      {
        label: '📋 值班筆記與任務進度（SELECT）',
        action: () => {
          window.BS.Audio.select();
          closeAllModals();
          openCluesModal(state);
        }
      },
      {
        label: `🏆 第一章結局圖鑑（${unlocked.length}/${total}）`,
        action: () => {
          window.BS.Audio.select();
          closeAllModals();
          openEndingsModal();
        }
      },
      {
        label: '🔄 重新開始本章節（保留結局紀錄）',
        action: () => {
          window.BS.Audio.confirm();
          closeAllModals();
          callbacks.onRestart();
        }
      },
      {
        label: muted ? '🔇 音效：關閉（按確認開啟）' : '🔊 音效：開啟（按確認靜音）',
        action: () => {
          const nowMuted = window.BS.Audio.toggleMute();
          if (!nowMuted) window.BS.Audio.select();
          openPauseModal(state, zoneName, callbacks);
          setPauseCursor(4);
        }
      },
      {
        label: '🏠 返回首頁章節選單',
        action: () => {
          window.BS.Audio.cancel();
          closeAllModals();
          callbacks.onReturnMenu();
        }
      }
    ];

    pauseActions = menuItems.map((m) => m.action);
    pauseCursorIdx = 0;

    $('pause-body').innerHTML = `
      <div class="pause-meta-box">
        <strong>${chLabel}</strong><br>
        🕒 ${window.BS.State.formatClock(state.timeMinutes)} ｜ 📍 ${zoneName}
      </div>
      <div class="pause-menu-list" id="pause-menu-list">
        ${menuItems
          .map(
            (m, idx) => `
          <button class="cursor-menu-item ${idx === 0 ? 'selected' : ''}" data-pidx="${idx}" type="button">
            <span class="menu-cursor">▶</span>
            <span class="menu-body"><span class="menu-main">${m.label}</span></span>
          </button>
        `
          )
          .join('')}
      </div>
      <div style="margin-top:8px; text-align:center; font-size:11.5px; color:#5b6476;">
        ↑↓ 選擇 · A / Enter 確認 · START / B 繼續遊戲
      </div>
    `;

    $('pause-body').querySelectorAll('.cursor-menu-item').forEach((btn) => {
      const idx = Number(btn.dataset.pidx);
      btn.addEventListener('mouseenter', () => {
        setPauseCursor(idx);
        window.BS.Audio.select();
      });
      btn.addEventListener('click', () => {
        pauseActions[idx]();
      });
    });
  }

  // ===== Stage Clear Celebration Screen =====
  function initClearFx(isWarn) {
    clearFxIsWarn = isWarn;
    clearFxParticles = [];
    const colors = isWarn
      ? ['#f87171', '#fbbf24', '#fed7aa', '#ffffff']
      : ['#ffd166', '#5eead4', '#60a5fa', '#f472b6', '#ffffff'];
    for (let i = 0; i < 48; i++) {
      clearFxParticles.push({
        x: Math.random() * 384,
        y: Math.random() * 256,
        vx: (Math.random() - 0.5) * 0.7,
        vy: isWarn ? 0.25 + Math.random() * 0.45 : 0.45 + Math.random() * 0.85,
        size: Math.random() < 0.5 ? 3 : 4,
        color: colors[i % colors.length]
      });
    }
  }

  function renderClearFx(tick) {
    if (activeModal !== 'clear') return;
    const canvas = $('clear-fx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    clearFxParticles.forEach((p, idx) => {
      p.x += p.vx + Math.sin(tick * 0.05 + idx) * 0.25;
      p.y += p.vy;
      if (p.y > 260) {
        p.y = -6;
        p.x = Math.random() * 384;
      }
      if (p.x < -6) p.x = 388;
      if (p.x > 390) p.x = -4;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    });
  }

  function openClearScreen(result, callbacks) {
    activeModal = 'clear';
    lastClearContext = { result, callbacks };
    $('clear-screen').classList.remove('hidden');

    const isCh2 = result.chapter === 2;
    const isCh3 = result.chapter === 3;
    const isCh4 = result.chapter === 4;
    let isWarn = false;
    let rank = 'S';
    let kicker = isCh3
      ? '★ CHAPTER 4 CLEAR! ★'
      : isCh4
      ? '★ CHAPTER 3 CLEAR! ★'
      : isCh2
      ? '★ CHAPTER 2 CLEAR! ★'
      : '★ CHAPTER 1 CLEAR! ★';
    let headline = isCh3
      ? '恭喜完成第四章「阿文的最後一天」！'
      : isCh4
      ? '恭喜完成第三章「今天的紀錄，明天找得到」！'
      : isCh2
      ? '恭喜完成第二章「投稿前一晚」！'
      : '恭喜完成第一章「寄出之前」！';
    let icon = '🏆';
    let title = '';
    let desc = '';
    let extraNote = '';

    if (isCh4) {
      icon = result.banner.icon;
      title = result.banner.title;
      desc = result.banner.desc;
      if (result.hasRisk) {
        isWarn = true;
        rank = '!';
        kicker = '⚠ CHAPTER 3 ENDED · 隔天盤點尚有斷點';
        headline = '第三章結束（隔天查找仍有缺口）';
        extraNote = '交班紀錄已標示出小晴查找時卡住的環節，歡迎查看紀錄後再挑戰一次完整歸檔與原生留痕！';
      } else if (result.isRetroOnly) {
        rank = 'A';
        extraNote = '清冊、檔案與連結已全數就緒，覆寫後也如實加上事後補記；下次一開始就用「新增更正筆錄」即可拿下系統原生留痕 S 評價！';
      } else {
        rank = 'S';
        extraNote = '實驗紀錄、團隊歸檔、盤點清冊與系統原生更正歷程全數到位，明天小晴一次就找得到！';
      }
    } else if (isCh3) {
      icon = result.banner.icon;
      title = result.banner.title;
      desc = result.banner.desc;
      if (result.hasRisk) {
        isWarn = true;
        rank = '!';
        kicker = '⚠ CHAPTER 4 ENDED · 尚有未完成待辦';
        headline = '第四章結束（留下權限或交接待辦）';
        extraNote = '交班清單已詳細列出所有未完成與權限過廣項目，歡迎查看紀錄後再挑戰一次完整交接！';
      } else if (result.sections.transfer.badge.cls === 'warn') {
        rank = 'A';
        extraNote = '成功透過管理員補救移交指定檔案，未恢復整包原權限，穩健完成離職交接！';
      } else {
        rank = 'S';
        extraNote = '跨樓層完成研究交接、小晴實測確認、權限終止、限期授權與 1F 門禁收回，滿分典範！';
      }
    } else if (isCh2) {
      icon = result.banner.icon;
      title = result.banner.title;
      desc = result.banner.desc;
      if (result.sections.route.badge.cls === 'danger') {
        isWarn = true;
        rank = '!';
        kicker = '⚠ CHAPTER 2 ENDED · 尚有未補救項目';
        headline = '第二章結束（留下風險待處理）';
        extraNote = '沒關係，這正是情境練習的價值！看看交班紀錄，再挑戰一次完整補救或核准提交吧！';
      } else if (result.sections.route.badge.cls === 'warn') {
        rank = 'A';
        extraNote = '穩健面對風險與不確定性，已留下清楚的追蹤紀錄！';
      } else {
        rank = 'S';
        extraNote = '完美核對授權、版本綁定與檔名，穩妥完成研討會海報投稿！';
      }
    } else {
      icon = result.ending.icon;
      title = result.ending.title;
      desc = result.ending.desc;
      extraNote = `第一章結局圖鑑已收錄：${result.unlockedCount} / ${result.totalEndings}`;
      if (result.ending.id === 'alarm_handover') {
        isWarn = true;
        rank = '!';
        kicker = '⚠ CHAPTER 1 ENDED · 交班警報';
        headline = '第一章結束（仍有外洩風險）';
        extraNote = `沒關係，遊戲就是用來安全試錯的！查看交班紀錄了解風險，再重玩挑戰其他結局吧！（已收錄 ${result.unlockedCount}/${result.totalEndings}）`;
      } else if (result.ending.id === 'flawless') {
        rank = 'S';
      } else {
        rank = 'A';
      }
    }

    initClearFx(isWarn);

    const nextChNum = isCh3 ? 1 : isCh4 ? 3 : isCh2 ? 4 : 2;
    const nextChLabel = isCh3
      ? '▶ 重溫第一章「寄出之前」'
      : isCh4
      ? '▶ 繼續挑戰第四章「阿文的最後一天」'
      : isCh2
      ? '▶ 繼續挑戰第三章「今天的紀錄，明天找得到」'
      : '▶ 繼續挑戰第二章「投稿前一晚」';
    const card = $('clear-card');
    card.className = 'clear-card' + (isWarn ? ' warn-clear' : '');
    card.innerHTML = `
      <div class="clear-kicker">${kicker}</div>
      <h2 class="clear-headline" id="clear-headline">${headline}</h2>
      <div class="clear-badge-row">
        <div class="clear-rank-stamp ${isWarn ? 'rank-warn' : ''}">${rank}</div>
        <div>
          <div class="clear-ending-title">${icon} ${title}</div>
          <div class="clear-ending-desc">${desc}</div>
        </div>
      </div>
      <p style="margin:0 0 10px; font-size:12.5px; color:#384963; font-weight:600;">${extraNote}</p>
      <div class="clear-actions">
        <button class="pixel-btn primary" id="btn-clear-handover" type="button">📑 查看完整交班紀錄與自評表對照</button>
        <div class="clear-actions-row">
          <button class="pixel-btn warn" id="btn-clear-next-ch" type="button">${nextChLabel}</button>
          <button class="pixel-btn" id="btn-clear-replay" type="button">🔄 再玩一次本章</button>
          <button class="pixel-btn" id="btn-clear-menu" type="button">🏠 返回首頁選單</button>
        </div>
      </div>
    `;

    $('btn-clear-handover').onclick = () => {
      window.BS.Audio.confirm();
      closeAllModals();
      openHandoverModal(result, callbacks);
    };
    $('btn-clear-next-ch').onclick = () => {
      window.BS.Audio.confirm();
      closeAllModals();
      callbacks.onStartChapter(nextChNum);
    };
    $('btn-clear-replay').onclick = () => {
      window.BS.Audio.confirm();
      closeAllModals();
      callbacks.onReplay();
    };
    $('btn-clear-menu').onclick = () => {
      window.BS.Audio.select();
      closeAllModals();
      callbacks.onReturnMenu();
    };
  }

  // ===== Chapter 1: Computer Email & Cloud Share UI =====
  function openComputerModal(state, callbacks) {
    activeModal = 'pc';
    $('computer-modal').classList.remove('hidden');

    let selectedPayload = state.clues.meetingVersion ? 'charts_only' : 'full_folder';
    let selectedPerm = state.clues.ndaScope ? 'restricted_7d' : 'public_link';
    let showNdaRegistry = false;
    let ndaQuizFeedback = '';

    function render() {
      const e = state.email;
      const body = $('pc-body');

      // Case 1: Active mis-share needing revocation!
      if (e.misshared && !e.linkRevoked) {
        const isFull = e.sentPayload === 'full_folder';
        body.innerHTML = `
          <div class="pc-card" style="border-color:#d95d4c; background:#fff7f6;">
            <h3 style="color:#9e1f1f;">🚨 新郵件通知：來自 星海科技 蘇小姐（急件）</h3>
            <div class="email-meta">寄件者：su@starlight-tech.example ｜ 時間：${window.BS.State.formatClock(state.timeMinutes)}</div>
            <div class="email-content urgent">
              ${
                isFull
                  ? '「小安您好，收到連結了！點進去發現裡面除了兩張圖之外，還有原始量測數據和製程筆記。<br>我們有一家外部協力廠商等等也會進線，<strong>請問這個連結可以直接轉給協力廠商一起看嗎？</strong>」'
                  : '「小安您好，收到連結了！這個連結免登入誰都能開好方便喔！<br>我們有一家外部協力廠商等等也會進線，<strong>我就直接把連結轉給協力廠商一起看囉？</strong>」'
              }
            </div>
            <p style="margin:6px 0; font-size:13px;">
              <strong>目前雲端分享狀態：</strong>
              <span class="file-tag secret">${e.sentPermission === 'public_link' ? '⚠ 持連結者皆可存取（公開連結啟用中）' : '⚠ 超出授權範圍之檔案分享中'}</span><br>
              涵蓋檔案：${isFull ? 'ClearSky_TestData 全資料夾（含 RAW 原始數據與未審製程筆記）' : 'ClearSky_會議用摘要圖_v2（但連結未限制存取對象）'}
            </p>
            <div class="pc-actions">
              <button class="pixel-btn danger" id="pc-revoke-btn" type="button">🔒 立即停用／限制連結存取</button>
              <button class="pixel-btn" id="pc-later-btn" type="button">先關閉視窗</button>
            </div>
          </div>
        `;
        $('pc-revoke-btn').onclick = () => {
          window.BS.Audio.confirm();
          closeAllModals();
          callbacks.onRevokeLink();
        };
        $('pc-later-btn').onclick = () => {
          window.BS.Audio.cancel();
          closeAllModals();
        };
        return;
      }

      // Case 2: Already safely sent OR remediated
      if (e.status === 'sent_safe' || e.status === 'sent_unverified' || (e.misshared && e.linkRevoked)) {
        const permLabel =
          e.sentPermission === 'restricted_7d'
            ? '僅限指定收件人（蘇小姐）唯讀・7 天效期'
            : e.sentPermission === 'restricted_noexp'
            ? '僅限指定收件人（蘇小姐）唯讀・無期限'
            : '原公開連結已停用';

        body.innerHTML = `
          <div class="pc-card">
            <h3>📨 郵件與分享紀錄</h3>
            <div class="email-meta">收件人：星海科技 專案窗口 蘇小姐</div>
            ${
              e.misshared
                ? `<div class="email-content urgent">
                    <strong>已執行止血：</strong>原本誤設為公開存取的 <code>ClearSky_TestData</code> 連結已停用。<br>
                    <strong>通報狀態：</strong>${e.reportedToLead ? '✅ 已向阿明組長完成異常通報（含四要素）' : '⚠ 尚未向負責人阿明組長通報！請盡快找阿明組長回報。'}
                    ${e.sentSafeAfterFix ? '<br><strong>後續補寄：</strong>✅ 已改寄核准的會議用兩張圖（限定收件人、7天效期）。' : ''}
                  </div>`
                : `<div class="email-content">
                    <strong>已寄出檔案：</strong>ClearSky_會議用摘要圖_v2（僅圖A、圖B）<br>
                    <strong>權限設定：</strong>${permLabel}<br>
                    <strong>保密約定核對：</strong>${e.sentWithNdaCheck ? '✅ 已由阿明組長確認 NDA-CS-2026 涵蓋範圍' : '⚠ 寄出前未確認 NDA 涵蓋範圍'}
                  </div>`
            }
            <div class="pc-actions">
              ${
                e.misshared && e.linkRevoked && !e.sentSafeAfterFix && state.clues.meetingVersion && state.clues.ndaScope
                  ? '<button class="pixel-btn primary" id="pc-resend-safe" type="button">📤 補寄核准的兩張會議圖（限定權限）</button>'
                  : ''
              }
              <button class="pixel-btn" id="pc-done-close" type="button">關閉電腦</button>
            </div>
          </div>
        `;
        if ($('pc-resend-safe')) {
          $('pc-resend-safe').onclick = () => {
            window.BS.Audio.success();
            closeAllModals();
            callbacks.onResendSafeAfterFix();
          };
        }
        $('pc-done-close').onclick = () => {
          window.BS.Audio.cancel();
          closeAllModals();
        };
        return;
      }

      // Case 3A: Interactive NDA Signing Registry & Verification Check
      if (showNdaRegistry) {
        body.innerHTML = `
          <div class="pc-card" style="margin-bottom:10px;">
            <h3>📑 實驗室外部合作 NDA（保密協議）簽署清單</h3>
            <p style="margin:0 0 8px; font-size:12.5px; color:#4b576d;">
              與外部廠商交流研究資料前，請先確認對方<strong>是否已簽署 NDA、是否仍在效期內，以及涵蓋的對象與資料範圍</strong>。
            </p>
            <table class="checklist-table">
              <thead>
                <tr>
                  <th>外部廠商</th>
                  <th>NDA 簽署狀態與效期</th>
                  <th>涵蓋對象與資料範圍</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>晨曦光電</strong></td>
                  <td><span class="status-badge danger">未簽署</span><br>尚在初步洽談</td>
                  <td>尚未簽署保密協議，禁止提供任何機密或未公開測試資料。</td>
                </tr>
                <tr style="background:#f3fbf7;">
                  <td><strong>星海科技</strong><br><span style="font-size:11px;color:#475569;">晴空計畫</span></td>
                  <td><span class="status-badge ok">已簽署有效</span><br><code>NDA-CS-2026</code><br>2026/01/01～2027/12/31</td>
                  <td>限星海科技專案窗口（蘇小姐）於階段進度會議使用「核准摘要圖表」；<strong>不含原始量測數據、製程筆記，且未授權轉傳協力廠商</strong>。</td>
                </tr>
                <tr>
                  <td><strong>遠航精密</strong></td>
                  <td><span class="status-badge warn">已到期</span><br><code>NDA-YH-2024</code><br>2025/12/31 屆滿</td>
                  <td>原合約已過期，須完成續簽後才可再提供研究資料。</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pc-card">
            <h3>✅ NDA 簽署核對確認</h3>
            ${
              state.clues.ndaScope
                ? '<div class="inline-ok-box">✅ 你已完成星海科技 NDA 簽署查核（NDA-CS-2026 有效，僅限蘇小姐檢視兩張會議摘要圖）。</div>'
                : `
                  <p style="margin:0 0 8px; font-size:13px;">
                    依上方清單，星海科技蘇小姐今天來信索取測試資料，以下哪一項判斷正確？
                  </p>
                  ${ndaQuizFeedback ? `<div class="inline-warning-box">${ndaQuizFeedback}</div>` : ''}
                  <div style="display:flex; flex-direction:column; gap:6px;">
                    <button class="choice-btn" id="nda-opt-ok" type="button">
                      <span class="choice-arrow">▶</span>
                      <span>星海科技已簽署有效 NDA-CS-2026（在效期內），但僅限蘇小姐看會議用摘要圖，不可提供原始數據或轉傳協力廠商。</span>
                    </button>
                    <button class="choice-btn" id="nda-opt-over" type="button">
                      <span class="choice-arrow">▶</span>
                      <span>只要廠商有簽過 NDA，就能把整個測試資料夾直接寄出並讓對方轉給協力廠商。</span>
                    </button>
                    <button class="choice-btn" id="nda-opt-expired" type="button">
                      <span class="choice-arrow">▶</span>
                      <span>星海科技的 NDA 已經到期，所以今天完全不能提供任何檔案。</span>
                    </button>
                  </div>
                `
            }
          </div>

          <div class="pc-actions">
            <button class="pixel-btn" id="btn-nda-back" type="button">← 返回郵件與分享設定</button>
          </div>
        `;

        if ($('nda-opt-ok')) {
          $('nda-opt-ok').onclick = () => {
            window.BS.Audio.success();
            ndaQuizFeedback = '';
            selectedPerm = 'restricted_7d';
            if (callbacks.onVerifyNda) callbacks.onVerifyNda();
            showNdaRegistry = false;
            render();
          };
          $('nda-opt-over').onclick = () => {
            window.BS.Audio.alert();
            ndaQuizFeedback = '⚠ 不對喔！有簽 NDA 不代表全部資料都能給。NDA-CS-2026 僅涵蓋「會議用摘要圖表」給「蘇小姐」，不含原始量測數據、製程筆記與協力廠商！';
            render();
          };
          $('nda-opt-expired').onclick = () => {
            window.BS.Audio.alert();
            ndaQuizFeedback = '⚠ 看錯廠商囉！已到期的是「遠航精密（NDA-YH-2024）」，星海科技的 NDA-CS-2026 效期至 2027/12/31，仍在有效期間內。';
            render();
          };
        }
        $('btn-nda-back').onclick = () => {
          window.BS.Audio.select();
          showNdaRegistry = false;
          render();
        };
        return;
      }

      // Case 3: Normal Compose & Share Panel
      const isPublic = selectedPerm === 'public_link';
      const isFull = selectedPayload === 'full_folder';
      const missingNda = !state.clues.ndaScope;
      const previewRisky = isPublic || isFull || missingNda;

      let previewHtml = '';
      if (isPublic && isFull) {
        previewHtml = `<strong>👁 收件人視角預覽：</strong>任何取得連結的人（包含被轉傳的協力廠商）都能開啟並下載 <strong>4 個檔案</strong>，內含 <code>原始量測數據</code> 與 <code>未審製程筆記</code>！${missingNda ? ' <strong>且你尚未確認廠商是否簽署有效 NDA！</strong>' : ''}`;
      } else if (isPublic && !isFull) {
        previewHtml = `<strong>👁 收件人視角預覽：</strong>雖然只有兩張會議圖，但連結設為「持連結者皆可存取」，若遭轉傳給非授權對象仍可直接開啟！`;
      } else if (!isPublic && isFull) {
        previewHtml = `<strong>👁 收件人視角預覽：</strong>僅蘇小姐可開啟，但資料夾仍包含超出會議需求的 <code>原始量測數據</code> 與 <code>未審製程筆記</code>！`;
      } else if (missingNda) {
        previewHtml = `<strong>👁 收件人視角預覽：</strong>檔案已限縮為 2 張會議圖且指定蘇小姐，但<strong>尚未確認星海科技是否已簽署有效 NDA</strong>！請先按上方「📑 查詢 NDA 合約清單」或詢問阿明組長。`;
      } else {
        previewHtml = `<strong>👁 收件人視角預覽：</strong>已確認有效 NDA-CS-2026；僅星海科技蘇小姐可唯讀檢視 <strong>2 張已核准會議圖</strong>${selectedPerm === 'restricted_7d' ? '，且 7 天後自動失效' : '（未設定到期日）'}。`;
      }

      const ndaStatusBar = state.clues.ndaScope
        ? `<div class="inline-ok-box" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span><strong>✅ NDA 簽署查核通過：</strong>星海科技已簽署有效 <code>NDA-CS-2026</code>（限蘇小姐｜僅會議摘要圖，不含原始數據與協力廠商）</span>
            <button class="pixel-btn" id="btn-open-nda-list" type="button" style="padding:4px 10px; font-size:12px;">📑 檢視 NDA 清單</button>
          </div>`
        : `<div class="inline-warning-box" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span><strong>❓ 步驟 0 — NDA 簽署查核：</strong>尚未確認「星海科技」是否已簽署有效 NDA（保密協議）與適用範圍！</span>
            <button class="pixel-btn warn" id="btn-open-nda-list" type="button" style="padding:5px 10px; font-size:12px;">📑 查詢實驗室 NDA 合約清單</button>
          </div>`;

      body.innerHTML = `
        ${ndaStatusBar}
        <div class="pc-grid">
          <div class="pc-card">
            <h3>✉ 合作方來信（四點會議急件）</h3>
            <div class="email-meta">寄件者：星海科技 蘇小姐 ｜ 主旨：晴空計畫 16:00 會議資料</div>
            <div class="email-content">
              「小安您好，四點就要開進度會議了！麻煩把 <strong>ClearSky_TestData 整個測試資料夾</strong>設成連結寄給我，我們開會只需要看裡面<strong>兩張結果圖</strong>，謝謝！」
            </div>
            ${e.usedHoldingReply ? '<div style="font-size:12px;color:#1d6b58;margin-bottom:6px;">✅ 你已先回覆「正在確認 NDA 與核准版本」，蘇小姐表示沒問題。</div>' : ''}
            <div style="font-size:12px;font-weight:700;color:#39465e;margin-bottom:4px;">📂 ClearSky_TestData 資料夾內容：</div>
            <div class="file-list">
              <div class="file-item"><span>01_會議摘要圖A.png / 02_摘要圖B.png</span><span class="file-tag safe">${state.clues.meetingVersion ? '已核准版本' : '待確認版本'}</span></div>
              <div class="file-item"><span>03_原始量測數據_RAW.csv</span><span class="file-tag secret">內部機密</span></div>
              <div class="file-item"><span>04_製程筆記_草稿.md</span><span class="file-tag unverified">未審核對外</span></div>
            </div>
            <div style="font-size:12px;color:#525f75;margin-top:6px;">
              <strong>核對狀態：</strong><br>
              • NDA 簽署：${state.clues.ndaScope ? '<span style="color:#1b6e44;font-weight:700;">✅ 已確認有效 NDA-CS-2026</span>' : '<span style="color:#9a5b13;">尚未確認（點上方查詢清單或問阿明組長）</span>'}<br>
              • 核准版本：${state.clues.meetingVersion ? '<span style="color:#1b6e44;font-weight:700;">✅ 已問過阿文（找到會議用兩張圖）</span>' : '<span style="color:#9a5b13;">尚未確認（可到實驗區問同事阿文）</span>'}
            </div>
          </div>

          <div class="pc-card">
            <h3>🔗 設定分享檔案與權限</h3>
            <div class="share-option-group">
              <label class="group-title">1. 選擇要分享的內容</label>
              <div class="radio-row">
                <label class="radio-pill ${selectedPayload === 'full_folder' ? 'active' : ''}">
                  <input type="radio" name="pc-payload" value="full_folder" ${selectedPayload === 'full_folder' ? 'checked' : ''}>
                  <span><strong>整個 ClearSky_TestData 資料夾</strong>（含 4 個檔案）</span>
                </label>
                <label class="radio-pill ${!state.clues.meetingVersion ? 'locked' : selectedPayload === 'charts_only' ? 'active' : ''}">
                  <input type="radio" name="pc-payload" value="charts_only" ${!state.clues.meetingVersion ? 'disabled' : ''} ${selectedPayload === 'charts_only' ? 'checked' : ''}>
                  <span><strong>僅會議用兩張圖（圖A、圖B）</strong>${state.clues.meetingVersion ? ' — 阿文已整理核准版' : '（🔒 先問實驗區同事阿文才能找到）'}</span>
                </label>
              </div>
            </div>

            <div class="share-option-group">
              <label class="group-title">2. 連結存取權限與期限</label>
              <div class="radio-row">
                <label class="radio-pill ${selectedPerm === 'public_link' ? 'active' : ''}">
                  <input type="radio" name="pc-perm" value="public_link" ${selectedPerm === 'public_link' ? 'checked' : ''}>
                  <span><strong>持連結者皆可存取</strong>（最快速，免登入）</span>
                </label>
                <label class="radio-pill ${selectedPerm === 'restricted_noexp' ? 'active' : ''}">
                  <input type="radio" name="pc-perm" value="restricted_noexp" ${selectedPerm === 'restricted_noexp' ? 'checked' : ''}>
                  <span><strong>指定收件人（蘇小姐）唯讀</strong>・不設期限</span>
                </label>
                <label class="radio-pill ${selectedPerm === 'restricted_7d' ? 'active' : ''}">
                  <input type="radio" name="pc-perm" value="restricted_7d" ${selectedPerm === 'restricted_7d' ? 'checked' : ''}>
                  <span><strong>指定收件人（蘇小姐）唯讀</strong>・7 天自動到期</span>
                </label>
              </div>
            </div>

            <div class="recipient-preview ${previewRisky ? 'risky' : 'safe'}">
              ${previewHtml}
            </div>
          </div>
        </div>

        <div class="pc-actions">
          ${
            !e.usedHoldingReply && (!state.clues.meetingVersion || !state.clues.ndaScope)
              ? '<button class="pixel-btn warn" id="pc-hold-btn" type="button">⏳ 先回覆「正在確認中」，等等再寄</button>'
              : ''
          }
          <button class="pixel-btn" id="pc-cancel-btn" type="button">暫不寄出（先去查證）</button>
          <button class="pixel-btn ${previewRisky ? 'danger' : 'primary'}" id="pc-send-btn" type="button">📤 確認並寄出連結</button>
        </div>
      `;

      if ($('btn-open-nda-list')) {
        $('btn-open-nda-list').onclick = () => {
          window.BS.Audio.select();
          showNdaRegistry = true;
          ndaQuizFeedback = '';
          render();
        };
      }

      body.querySelectorAll('input[name="pc-payload"]').forEach((inp) => {
        inp.onchange = () => {
          selectedPayload = inp.value;
          window.BS.Audio.select();
          render();
        };
      });
      body.querySelectorAll('input[name="pc-perm"]').forEach((inp) => {
        inp.onchange = () => {
          selectedPerm = inp.value;
          window.BS.Audio.select();
          render();
        };
      });

      if ($('pc-hold-btn')) {
        $('pc-hold-btn').onclick = () => {
          window.BS.Audio.confirm();
          closeAllModals();
          callbacks.onHoldingReply();
        };
      }
      $('pc-cancel-btn').onclick = () => {
        window.BS.Audio.cancel();
        closeAllModals();
      };
      $('pc-send-btn').onclick = () => {
        window.BS.Audio.confirm();
        closeAllModals();
        callbacks.onSend({ payload: selectedPayload, permission: selectedPerm });
      };
    }

    render();
  }

  // ===== Chapter 2: Poster Review, Version Comparison & Submit UI =====
  function drawPosterFigureThumb(canvas, figKey, slotState) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const w = canvas.width;
    const h = canvas.height;
    const px = (x, y, rw, rh, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, rw, rh);
    };

    px(ctx, 0, 0, w, h, '#eef3f8');

    if (figKey === 'fig1') {
      // Equipment layout schematic (public safe)
      px(ctx, 10, 18, 28, 22, '#2f7d6d');
      px(ctx, 14, 22, 20, 14, '#a7f3d0');
      px(ctx, 38, 27, 22, 4, '#475569');
      px(ctx, 60, 14, 34, 30, '#3b5a8a');
      px(ctx, 64, 18, 26, 22, '#bfdbfe');
      px(ctx, 94, 27, 20, 4, '#475569');
      px(ctx, 114, 20, 26, 18, '#64748b');
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('PUBLIC SCHEMATIC', 26, 56);
    } else if (figKey === 'fig2') {
      if (slotState === 'alt') {
        // Replacement self-developed calibration trend chart
        px(ctx, 0, 0, w, h, '#edf7f4');
        px(ctx, 14, 48, 122, 2, '#334155');
        px(ctx, 14, 10, 2, 40, '#334155');
        const pts = [[22, 42], [44, 34], [66, 28], [88, 22], [110, 16], [128, 14]];
        pts.forEach(([x, y]) => {
          px(ctx, x, y, 6, 6, '#2f7d6d');
        });
        ctx.fillStyle = '#165935';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('ALT CALIBRATION', 30, 59);
      } else {
        // Original partner measurement chart
        px(ctx, 0, 0, w, h, '#fdf2f2');
        px(ctx, 14, 48, 122, 2, '#7f1d1d');
        px(ctx, 14, 10, 2, 40, '#7f1d1d');
        px(ctx, 22, 34, 16, 14, '#e05252');
        px(ctx, 44, 22, 16, 26, '#e05252');
        px(ctx, 66, 28, 16, 20, '#f59e0b');
        px(ctx, 88, 16, 16, 32, '#e05252');
        px(ctx, 110, 24, 16, 24, '#f59e0b');
        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('PARTNER DATA', 36, 59);
      }
    } else if (figKey === 'fig3') {
      if (slotState === 'removed') {
        px(ctx, 0, 0, w, h, '#eceef2');
        ctx.strokeStyle = '#94a3b8';
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(8, 8, w - 16, h - 16);
        ctx.setLineDash([]);
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('已從公開版移除', 38, 36);
      } else {
        // Patent-pending test conditions table
        px(ctx, 0, 0, w, h, '#fffbeb');
        px(ctx, 12, 10, 126, 10, '#d97706');
        px(ctx, 12, 22, 126, 8, '#fde68a');
        px(ctx, 12, 32, 126, 8, '#fef3c7');
        px(ctx, 12, 42, 126, 8, '#fde68a');
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('PATENT PENDING?', 30, 60);
      }
    }
  }

  function openPosterModal(state, callbacks) {
    activeModal = 'poster';
    $('poster-modal').classList.remove('hidden');

    const c = state.ch2;
    let activeTab = c.misuploaded ? 'submit' : 'edit'; // 'edit' | 'submit'
    let compareView = 'current'; // 'original' | 'current'
    let selectedFig = 'fig2';
    let selectedUploadId = c.lastApprovedVersionId || c.workingVersionId;
    let reviewFeedback = null; // { ok, issues, message }

    function render() {
      const body = $('poster-body');
      const workingVer = window.BS.State.getWorkingVersion(state);
      const originalVer = c.versions[0];
      const displayVer = compareView === 'original' ? originalVer : workingVer;
      const workingMeta = window.BS.State.getVersionStatusMeta(workingVer.status);
      const workingIssues = window.BS.State.getVersionIssues(workingVer, c.clues);

      if (!c.versions.some((v) => v.id === selectedUploadId)) {
        selectedUploadId = workingVer.id;
      }

      // Emergency Mis-upload Banner (visible at top if mis-uploaded!)
      let misuploadBanner = '';
      if (c.misuploaded) {
        misuploadBanner = `
          <div class="inline-danger-box">
            <strong>🚨 誤傳事件處理中：</strong>已於 ${c.misuploadTimeStr || '18:15'} 上傳未確認檔案 <code>${c.submittedFilename}</code>。<br>
            ${
              c.contactedOrganizer
                ? `<span style="color:#7c340b; font-weight:700;">📨 聯絡主辦方狀態：已提出撤換請求，公開狀態待確認（${c.contactedOrganizerTimeStr}）。</span>`
                : '<span style="font-weight:700;">⚠ 尚未聯絡研討會主辦方申請撤換或下架！</span>'
            }<br>
            ${
              c.reportedToLead
                ? '<span style="color:#155e3a; font-weight:700;">✅ 已向辦公區阿明組長回報此誤傳事件。</span>'
                : '<span style="font-weight:700;">⚠ 尚未向辦公區阿明組長回報！</span>'
            }
            <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">
              ${
                !c.contactedOrganizer
                  ? '<button class="pixel-btn danger" id="btn-ch2-contact-org" type="button">📞 聯絡主辦方提出撤換請求</button>'
                  : ''
              }
              <button class="pixel-btn" id="btn-ch2-close-remedy" type="button">關閉電腦（去地圖找阿明組長或交班）</button>
            </div>
          </div>
        `;
      }

      // Build Tab 1 (Edit & Compare)
      let tabContentHtml = '';
      if (activeTab === 'edit') {
        const isViewingOrig = compareView === 'original';

        // Figure 2 labels
        const f2Alt = displayVer.slots.fig2 === 'alt';
        const f2Title = f2Alt ? '圖二：自研校準趨勢示意圖（替代圖）' : '圖二：合作方量測圖';
        let f2DiffBadge = '<span class="diff-badge keep">保留原圖</span>';
        if (f2Alt) {
          f2DiffBadge = '<span class="diff-badge replaced">已替換</span>';
        }
        let f2StatusBadge = '';
        if (f2Alt) {
          f2StatusBadge =
            displayVer.status === 'approved'
              ? '<span class="diff-badge safe">已核准公開</span>'
              : '<span class="diff-badge warn">可送審替代圖・待隨版核准</span>';
        } else {
          f2StatusBadge = c.clues.wenExplainedFig2
            ? '<span class="diff-badge danger">合作會議用・未核准公開</span>'
            : '<span class="diff-badge warn">來源待確認</span>';
        }

        // Figure 3 labels
        const f3Removed = displayVer.slots.fig3 === 'removed';
        const f3DiffBadge = f3Removed
          ? '<span class="diff-badge removed">已移除</span>'
          : '<span class="diff-badge keep">保留原圖</span>';
        const f3StatusBadge = f3Removed
          ? '<span class="diff-badge safe">本次公開版不含此圖</span>'
          : '<span class="diff-badge danger">專利安排待確認</span>';

        // Inspector HTML for selectedFig
        let inspectorHtml = '';
        if (selectedFig === 'fig1') {
          inspectorHtml = `
            <h4>圖一「設備配置示意」</h4>
            <p style="margin:4px 0;"><strong>來源與狀態：</strong>實驗室既有公開架構圖，<strong>已確認可公開</strong>。可安全保留於研討會海報中。</p>
          `;
        } else if (selectedFig === 'fig2') {
          const curAlt = workingVer.slots.fig2 === 'alt';
          inspectorHtml = `
            <h4>圖二「${curAlt ? '自研校準趨勢示意圖（替代圖）' : '合作方量測圖'}」</h4>
            <p style="margin:4px 0;">
              <strong>來源說明：</strong>${
                curAlt
                  ? '阿文另行繪製的自研校準趨勢示意圖，不含合作方量測資料。<strong>仍須隨目前海報版本送交阿明組長確認核准。</strong>'
                  : c.clues.wenExplainedFig2
                  ? '曾用於上次與星海科技的<strong>合作會議</strong>，目前尚未確認合作約定是否涵蓋公開研討會海報用途。'
                  : '<strong>來源待確認</strong>（是否可用於公開海報待確認）。提示：可到<strong>實驗區找阿文</strong>詢問這張圖的來源。'
              }
            </p>
            <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">
              ${
                c.clues.hasReplacementFig2
                  ? curAlt
                    ? '<button class="pixel-btn" id="btn-fig2-restore" type="button">↩ 改回原始「合作方量測圖」</button>'
                    : '<button class="pixel-btn primary" id="btn-fig2-replace" type="button">🔄 替換為阿文提供的替代圖</button>'
                  : '<button class="pixel-btn" type="button" disabled>🔒 需先找實驗區的阿文取得替代圖</button>'
              }
            </div>
          `;
        } else {
          const curRemoved = workingVer.slots.fig3 === 'removed';
          inspectorHtml = `
            <h4>圖三「測試條件與結果摘要」</h4>
            <p style="margin:4px 0;">
              <strong>來源與狀態：</strong>${
                curRemoved
                  ? '已從目前編輯的公開海報版本中移除，避免影響後續專利申請安排。'
                  : c.clues.mingExplainedRules
                  ? '涉及<strong>尚待確認的專利申請安排</strong>，公開時點在本章尚未定案。阿明組長建議先從本次公開版移除，或暫緩整份投稿。'
                  : '涉及<strong>尚待確認的專利申請安排</strong>（公開時點待確認）。提示：可先找<strong>辦公區的阿明組長</strong>確認處理方式。'
              }
            </p>
            <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">
              ${
                curRemoved
                  ? '<button class="pixel-btn" id="btn-fig3-restore" type="button">↩ 放回圖三「測試條件與結果摘要」</button>'
                  : '<button class="pixel-btn warn" id="btn-fig3-remove" type="button">🗑 從本次公開版本移除圖三</button>'
              }
            </div>
          `;
        }

        // Status & review guidance banner
        let statusBannerHtml = '';
        if (reviewFeedback) {
          statusBannerHtml = reviewFeedback.ok
            ? `<div class="inline-ok-box">${reviewFeedback.message}</div>`
            : `<div class="inline-warning-box"><strong>⚠ 尚未符合送審條件，請先處理以下圖片：</strong><br>• ${reviewFeedback.issues.join('<br>• ')}</div>`;
        } else if (workingVer.status === 'approved') {
          statusBannerHtml = `<div class="inline-ok-box">✅ 目前檢視的版本 <code>${workingVer.filename}</code> 已由<strong>阿明組長核准</strong>（${workingVer.approvedAt}）。可直接切到「提交投稿」上傳；若再次修改圖片，系統會建立「待重新確認」的新版本，不會覆寫這份已核准紀錄。</div>`;
        } else if (workingVer.status === 'pending_review') {
          statusBannerHtml = `<div class="inline-warning-box">📨 <code>${workingVer.filename}</code> 已送審，請關閉電腦並向<strong>辦公區的阿明組長</strong>確認核准！</div>`;
        } else if (workingVer.status === 'needs_reapproval') {
          statusBannerHtml = `<div class="inline-warning-box">⚠ <strong>核准後已再次編輯：</strong>目前版本 <code>${workingVer.filename}</code> 狀態為<strong>「待重新確認」</strong>，原核准版本紀錄仍保留於版本清單中。${workingIssues.length > 0 ? '<br>待處理圖片：' + workingIssues.join('；') : '可重新送交阿明組長確認。'}</div>`;
        } else if (workingIssues.length > 0) {
          statusBannerHtml = `<div class="inline-warning-box"><strong>目前版本尚有未確認可公開的圖片：</strong><br>• ${workingIssues.join('<br>• ')}</div>`;
        } else {
          statusBannerHtml = `<div class="inline-ok-box">👍 目前版本已替換圖二並移除圖三！請點「送交阿明組長確認」，再向辦公區的阿明組長取得核准。</div>`;
        }

        tabContentHtml = `
          <div class="view-compare-bar">
            <div class="view-toggle-group">
              <button class="view-toggle-btn ${isViewingOrig ? 'active' : ''}" id="btn-view-orig" type="button">📄 原始草稿 (v1)</button>
              <button class="view-toggle-btn ${!isViewingOrig ? 'active' : ''}" id="btn-view-curr" type="button">✏ 目前編輯版本 (${workingVer.id})</button>
            </div>
            <span class="status-badge ${window.BS.State.getVersionStatusMeta(displayVer.status).badgeCls}">
              ${displayVer.filename}｜${window.BS.State.getVersionStatusMeta(displayVer.status).text}
            </span>
          </div>

          <div class="poster-sheet">
            <div class="poster-sheet-header">
              <span class="poster-sheet-title">2026 材料研討會海報 — 晴空薄膜製程進度</span>
              <span class="poster-sheet-meta">${isViewingOrig ? '檢視模式：原始草稿（唯讀對照）' : '檢視模式：目前編輯版本'}</span>
            </div>
            <div class="poster-fig-grid">
              <button class="fig-card ${selectedFig === 'fig1' ? 'selected' : ''}" data-fig="fig1" type="button">
                <canvas class="fig-thumb" id="thumb-fig1" width="150" height="64"></canvas>
                <div class="fig-title">圖一：設備配置示意</div>
                <div class="fig-badges">
                  <span class="diff-badge keep">保留</span>
                  <span class="diff-badge safe">已確認可公開</span>
                </div>
              </button>

              <button class="fig-card ${selectedFig === 'fig2' ? 'selected' : ''}" data-fig="fig2" type="button">
                <canvas class="fig-thumb" id="thumb-fig2" width="150" height="64"></canvas>
                <div class="fig-title">${f2Title}</div>
                <div class="fig-badges">
                  ${f2DiffBadge}
                  ${f2StatusBadge}
                </div>
              </button>

              <button class="fig-card ${selectedFig === 'fig3' ? 'selected' : ''} ${f3Removed ? 'removed' : ''}" data-fig="fig3" type="button">
                <canvas class="fig-thumb" id="thumb-fig3" width="150" height="64"></canvas>
                <div class="fig-title">圖三：測試條件與結果摘要</div>
                <div class="fig-badges">
                  ${f3DiffBadge}
                  ${f3StatusBadge}
                </div>
              </button>
            </div>
          </div>

          <div class="fig-inspector">
            ${inspectorHtml}
          </div>

          ${statusBannerHtml}

          <div class="pc-actions">
            <button class="pixel-btn" id="btn-poster-goto-submit" type="button">📤 前往選擇檔案提交／暫緩 →</button>
            ${
              c.outcome === 'in_progress'
                ? `<button class="pixel-btn primary" id="btn-poster-send-review" type="button">📨 送交目前版本 (${workingVer.id}) 給阿明組長確認</button>`
                : ''
            }
          </div>
        `;
      } else {
        // Tab 2: Versions & Upload / Defer
        const chosenVer = window.BS.State.getVersionById(state, selectedUploadId) || workingVer;
        const chosenMeta = window.BS.State.getVersionStatusMeta(chosenVer.status);
        const chosenApproved = chosenVer.status === 'approved';

        tabContentHtml = `
          <div class="pc-card" style="margin-bottom:10px;">
            <h3>🗂 選擇實際要上傳給研討會主辦方的海報檔案</h3>
            <p style="margin:0 0 8px; font-size:12.5px; color:#4b576d;">
              請仔細核對<strong>檔名、版本內容與確認狀態</strong>。即使資料夾裡已有核准版，選錯舊檔仍會造成誤傳。
            </p>
            <div>
              ${c.versions
                .map((v) => {
                  const m = window.BS.State.getVersionStatusMeta(v.status);
                  const isSel = v.id === selectedUploadId;
                  return `
                    <label class="version-row ${isSel ? 'active' : ''} ${v.status === 'approved' ? 'approved-row' : ''}">
                      <input type="radio" name="ch2-upload-ver" value="${v.id}" ${isSel ? 'checked' : ''} ${c.outcome !== 'in_progress' ? 'disabled' : ''}>
                      <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                          <strong>${v.filename}</strong>
                          <span class="status-badge ${m.badgeCls}">${m.text}</span>
                        </div>
                        <div class="version-meta-line">${v.summary}</div>
                        ${v.approvedBy ? `<div class="version-meta-line" style="color:#165935; font-weight:700;">✔ 核准紀錄：${v.approvedBy} 於 ${v.approvedAt} 確認核准（綁定此版本）</div>` : ''}
                      </div>
                    </label>
                  `;
                })
                .join('')}
            </div>

            <div class="recipient-preview ${chosenApproved ? 'safe' : 'risky'}">
              ${
                chosenApproved
                  ? `<strong>✅ 上傳前核對：</strong>已選取阿明組長核准的 <code>${chosenVer.filename}</code>，圖二已替換、圖三已移除，可安全提交！`
                  : `<strong>⚠ 上傳前核對：</strong>目前選取的 <code>${chosenVer.filename}</code> 狀態為「<strong>${chosenMeta.text}</strong>」，尚未取得阿明組長核准。若現在上傳，將會誤傳未確認版本！`
              }
            </div>
          </div>

          <div class="pc-actions">
            <button class="pixel-btn" id="btn-poster-back-edit" type="button">← 返回編輯與比較海報</button>
            ${
              c.outcome === 'in_progress'
                ? `
                  <button class="pixel-btn warn" id="btn-poster-defer" type="button">⏸ 暫緩上傳（尚有待確認事項）</button>
                  <button class="pixel-btn ${chosenApproved ? 'primary' : 'danger'}" id="btn-poster-upload" type="button">📤 提交選取檔案 (${chosenVer.id})</button>
                `
                : `<span class="status-badge ${c.outcome === 'submitted_approved' ? 'ok' : c.outcome === 'deferred' ? 'warn' : 'danger'}">
                    ${c.outcome === 'submitted_approved' ? '✅ 已完成核准版提交，可回值班桌交班' : c.outcome === 'deferred' ? '⏸ 已紀錄暫緩投稿，可回值班桌交班' : '🚨 誤傳處理中，完成後可回值班桌交班'}
                  </span>`
            }
          </div>
        `;
      }

      body.innerHTML = `
        ${misuploadBanner}
        <div class="poster-tabs">
          <button class="poster-tab-btn ${activeTab === 'edit' ? 'active' : ''}" id="tab-poster-edit" type="button">🎨 海報編輯與版本比較</button>
          <button class="poster-tab-btn ${activeTab === 'submit' ? 'active' : ''}" id="tab-poster-submit" type="button">📤 版本紀錄與提交投稿 (${c.versions.length} 版)</button>
        </div>
        ${tabContentHtml}
      `;

      // Bind remediation buttons
      if ($('btn-ch2-contact-org')) {
        $('btn-ch2-contact-org').onclick = () => {
          window.BS.Audio.confirm();
          callbacks.onContactOrganizer();
          render();
        };
      }
      if ($('btn-ch2-close-remedy')) {
        $('btn-ch2-close-remedy').onclick = () => {
          window.BS.Audio.cancel();
          closeAllModals();
        };
      }

      // Bind tabs
      $('tab-poster-edit').onclick = () => {
        activeTab = 'edit';
        reviewFeedback = null;
        window.BS.Audio.select();
        render();
      };
      $('tab-poster-submit').onclick = () => {
        activeTab = 'submit';
        window.BS.Audio.select();
        render();
      };

      if (activeTab === 'edit') {
        // Draw pixel thumbnails
        drawPosterFigureThumb($('thumb-fig1'), 'fig1', displayVer.slots.fig1);
        drawPosterFigureThumb($('thumb-fig2'), 'fig2', displayVer.slots.fig2);
        drawPosterFigureThumb($('thumb-fig3'), 'fig3', displayVer.slots.fig3);

        $('btn-view-orig').onclick = () => {
          compareView = 'original';
          window.BS.Audio.select();
          render();
        };
        $('btn-view-curr').onclick = () => {
          compareView = 'current';
          window.BS.Audio.select();
          render();
        };

        body.querySelectorAll('.fig-card').forEach((card) => {
          card.onclick = () => {
            selectedFig = card.dataset.fig;
            window.BS.Audio.select();
            render();
          };
        });

        if ($('btn-fig2-replace')) {
          $('btn-fig2-replace').onclick = () => {
            const newVer = callbacks.onEditPoster({ fig2: 'alt' });
            compareView = 'current';
            selectedUploadId = newVer.id;
            reviewFeedback = null;
            window.BS.Audio.confirm();
            render();
          };
        }
        if ($('btn-fig2-restore')) {
          $('btn-fig2-restore').onclick = () => {
            const newVer = callbacks.onEditPoster({ fig2: 'orig' });
            compareView = 'current';
            selectedUploadId = newVer.id;
            reviewFeedback = null;
            window.BS.Audio.select();
            render();
          };
        }
        if ($('btn-fig3-remove')) {
          $('btn-fig3-remove').onclick = () => {
            const newVer = callbacks.onEditPoster({ fig3: 'removed' });
            compareView = 'current';
            selectedUploadId = newVer.id;
            reviewFeedback = null;
            window.BS.Audio.confirm();
            render();
          };
        }
        if ($('btn-fig3-restore')) {
          $('btn-fig3-restore').onclick = () => {
            const newVer = callbacks.onEditPoster({ fig3: 'orig' });
            compareView = 'current';
            selectedUploadId = newVer.id;
            reviewFeedback = null;
            window.BS.Audio.select();
            render();
          };
        }

        $('btn-poster-goto-submit').onclick = () => {
          activeTab = 'submit';
          window.BS.Audio.select();
          render();
        };

        if ($('btn-poster-send-review')) {
          $('btn-poster-send-review').onclick = () => {
            const res = callbacks.onSendForReview();
            if (!res.ok) {
              window.BS.Audio.alert();
              reviewFeedback = { ok: false, issues: res.issues };
              render();
            } else if (res.alreadyApproved) {
              window.BS.Audio.select();
              reviewFeedback = { ok: true, message: `✅ ${res.version.filename} 已經由阿明組長核准，可直接前往「提交投稿」！` };
              render();
            } else {
              window.BS.Audio.success();
              closeAllModals();
              callbacks.onAfterSendForReview(res.version);
            }
          };
        }
      } else {
        body.querySelectorAll('input[name="ch2-upload-ver"]').forEach((inp) => {
          inp.onchange = () => {
            selectedUploadId = inp.value;
            window.BS.Audio.select();
            render();
          };
        });
        $('btn-poster-back-edit').onclick = () => {
          activeTab = 'edit';
          window.BS.Audio.select();
          render();
        };
        if ($('btn-poster-defer')) {
          $('btn-poster-defer').onclick = () => {
            window.BS.Audio.confirm();
            closeAllModals();
            callbacks.onDeferSubmission();
          };
        }
        if ($('btn-poster-upload')) {
          $('btn-poster-upload').onclick = () => {
            window.BS.Audio.confirm();
            closeAllModals();
            callbacks.onSubmitVersion(selectedUploadId);
          };
        }
      }
    }

    render();
  }

  // ===== Chapter 1: Visitor Camera Viewfinder UI =====
  function openCameraModal(state, mode, callbacks) {
    activeModal = 'camera';
    $('camera-modal').classList.remove('hidden');
    $('cam-title').textContent =
      mode === 'entrance' ? '📷 相機取景預覽 — 訪客入口核准角度' : '📷 相機取景預覽 — 實驗區現場鏡頭';

    const exposed = mode === 'lab' ? window.BS.State.getExposedLabItems(state) : [];
    const body = $('cam-body');

    body.innerHTML = `
      <div class="cam-frame-wrap">
        <canvas id="cam-preview-canvas" width="288" height="160"></canvas>
        <div class="cam-hud-tags" id="cam-tags"></div>
      </div>
      <p style="margin:4px 0 8px; font-size:13px;">
        ${
          mode === 'entrance'
            ? '陳先生舉起相機對準入口形象牆。畫面只拍到實驗室招牌與玻璃隔間外觀，沒有任何實驗數據入鏡。'
            : exposed.length > 0
            ? `<strong>⚠ 注意鏡頭背景！</strong>預覽畫面清楚拍到了<strong>「${exposed.join('、')}」</strong>！陳先生打算把這張照片放進對外參訪報告。`
            : '太好了！你已經把白板、螢幕與樣品標籤都處理完畢，實驗區取景畫面乾淨又專業。'
        }
      </p>
      <div class="cam-actions">
        ${
          mode === 'lab' && exposed.length > 0
            ? `
              <button class="pixel-btn primary" id="cam-pause-fix" type="button">✋ 暫停拍攝，先去整理現場</button>
              <button class="pixel-btn warn" id="cam-switch-entrance" type="button">↩ 改回訪客入口指定角度拍</button>
              <button class="pixel-btn danger" id="cam-shoot-anyway" type="button">📷 就這樣按下快門</button>
            `
            : `
              <button class="pixel-btn" id="cam-cancel" type="button">先等一下</button>
              <button class="pixel-btn primary" id="cam-shoot-ok" type="button">📷 按下快門完成拍攝</button>
            `
        }
      </div>
    `;

    drawCameraPreview($('cam-preview-canvas'), state, mode);

    const tagsEl = $('cam-tags');
    if (mode === 'entrance') {
      tagsEl.innerHTML = '<span class="cam-tag ok">✓ 訪客入口指定角度</span><span class="cam-tag ok">✓ 無研究資訊入鏡</span>';
    } else {
      tagsEl.innerHTML = [
        state.labItems.whiteboard
          ? '<span class="cam-tag ok">✓ 白板已擦拭遮蔽</span>'
          : '<span class="cam-tag leak">⚠ 白板配方參數入鏡</span>',
        state.labItems.monitor
          ? '<span class="cam-tag ok">✓ 螢幕已鎖定畫面</span>'
          : '<span class="cam-tag leak">⚠ 螢幕原始量測數據入鏡</span>',
        state.labItems.samples
          ? '<span class="cam-tag ok">✓ 樣品標籤已收妥</span>'
          : '<span class="cam-tag leak">⚠ 樣品代碼標籤入鏡</span>'
      ].join('');
    }

    if ($('cam-pause-fix')) {
      $('cam-pause-fix').onclick = () => {
        window.BS.Audio.confirm();
        closeAllModals();
        callbacks.onPauseToFix();
      };
      $('cam-switch-entrance').onclick = () => {
        window.BS.Audio.select();
        closeAllModals();
        callbacks.onSwitchToEntrance();
      };
      $('cam-shoot-anyway').onclick = () => {
        window.BS.Audio.shutter();
        closeAllModals();
        callbacks.onShoot(mode, exposed);
      };
    } else {
      $('cam-cancel').onclick = () => {
        window.BS.Audio.cancel();
        closeAllModals();
      };
      $('cam-shoot-ok').onclick = () => {
        window.BS.Audio.shutter();
        closeAllModals();
        callbacks.onShoot(mode, []);
      };
    }
  }

  function drawCameraPreview(canvas, state, mode) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const w = canvas.width;
    const h = canvas.height;
    const px = (x, y, rw, rh, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, rw, rh);
    };

    if (mode === 'entrance') {
      px(ctx, 0, 0, w, 110, '#d8e3e8');
      px(ctx, 0, 110, w, 50, '#c6cdd6');
      px(ctx, 18, 22, 74, 80, '#a6cedb');
      px(ctx, 22, 26, 66, 72, '#c8e6ef');
      px(ctx, 104, 28, 146, 46, '#20594e');
      px(ctx, 108, 32, 138, 38, '#2f7d6d');
      ctx.fillStyle = '#e8fff9';
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('中研院RCCI實驗室', 177, 50);
      ctx.font = 'bold 8px monospace';
      ctx.fillText('ACADEMIA SINICA RCCI LAB', 177, 63);
      ctx.textAlign = 'left';
      px(ctx, 256, 86, 18, 24, '#a85a3a');
      px(ctx, 250, 62, 30, 26, '#2f7d4f');
      px(ctx, 256, 52, 18, 14, '#47a36b');
    } else {
      px(ctx, 0, 0, w, 102, '#cde0e3');
      px(ctx, 0, 102, w, 58, '#b5cfd1');

      px(ctx, 18, 20, 88, 56, '#5a667a');
      px(ctx, 22, 24, 80, 48, '#f8fafc');
      if (!state.labItems.whiteboard) {
        ctx.fillStyle = '#c53030';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('配方比例 14.2%', 26, 38);
        ctx.fillStyle = '#2b6cb0';
        ctx.fillText('退火 380°C/4h', 26, 50);
        ctx.fillStyle = '#d97706';
        ctx.fillText('晴空計畫 B4', 26, 62);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(16, 18, 92, 60);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px sans-serif';
        ctx.fillText('（已擦拭乾淨）', 36, 50);
      }

      px(ctx, 182, 34, 84, 52, '#273242');
      px(ctx, 186, 38, 76, 40, state.labItems.monitor ? '#1e293b' : '#0f2238');
      px(ctx, 214, 86, 20, 10, '#475569');
      px(ctx, 174, 96, 100, 16, '#8da4b5');
      if (!state.labItems.monitor) {
        px(ctx, 192, 68, 12, 3, '#4ade80');
        px(ctx, 204, 58, 12, 3, '#4ade80');
        px(ctx, 216, 52, 12, 3, '#facc15');
        px(ctx, 228, 46, 14, 3, '#f87171');
        ctx.fillStyle = '#fca5a5';
        ctx.font = '7px monospace';
        ctx.fillText('RAW_DATA.csv', 190, 46);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(180, 32, 88, 56);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px sans-serif';
        ctx.fillText('🔒 畫面已鎖定', 198, 60);
      }

      px(ctx, 102, 114, 86, 34, '#95a8b8');
      if (!state.labItems.samples) {
        px(ctx, 112, 92, 14, 28, '#7dd3fc');
        px(ctx, 136, 92, 14, 28, '#86efac');
        px(ctx, 160, 92, 14, 28, '#fde047');
        px(ctx, 111, 102, 16, 10, '#ffffff');
        px(ctx, 135, 102, 16, 10, '#ffffff');
        px(ctx, 159, 102, 16, 10, '#ffffff');
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 6px monospace';
        ctx.fillText('CS-B4', 112, 109);
        ctx.fillText('CS-B5', 136, 109);
        ctx.fillText('CS-B6', 160, 109);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(106, 88, 76, 38);
      } else {
        px(ctx, 114, 96, 62, 26, '#3b526b');
        px(ctx, 118, 100, 54, 18, '#516c8a');
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '8px sans-serif';
        ctx.fillText('已收妥遮蔽', 125, 112);
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    const m = 8;
    const len = 14;
    ctx.beginPath(); ctx.moveTo(m, m + len); ctx.lineTo(m, m); ctx.lineTo(m + len, m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - m - len, m); ctx.lineTo(w - m, m); ctx.lineTo(w - m, m + len); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m, h - m - len); ctx.lineTo(m, h - m); ctx.lineTo(m + len, h - m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - m - len, h - m); ctx.lineTo(w - m, h - m); ctx.lineTo(w - m, h - m - len); ctx.stroke();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fillRect(14, 10, 82, 14);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('PREVIEW 16:9', 20, 20);
  }

  // ===== Chapter 3: Offboarding Checklist & Access Perspective Preview =====
  function openOffboardModal(state, callbacks) {
    activeModal = 'offboard';
    $('offboard-modal').classList.remove('hidden');

    let activeTab = 'checklist'; // 'checklist' | 'preview'
    let previewRole = 'awen';    // 'awen' | 'qing'
    let inlineNotice = '';

    function render() {
      const c = state.ch3;
      const body = $('offboard-body');
      const pending = window.BS.State.getCh3PendingItems(state);
      const transferred = c.rawLogLocation === 'project';
      const origRevoked = c.awenOrigAccess === 'revoked';

      // Next-step dynamic hint telling player which floor & who to see next!
      let nextStepHint = '';
      if (!transferred && origRevoked) {
        nextStepHint = '🚨 <strong>交接中斷補救：</strong>原始量測紀錄尚未移交，且阿文原權限已終止！請下樓找 <strong>1F 阿明組長</strong> 請求管理員協助移交指定檔案。';
      } else if (!transferred) {
        nextStepHint = '💡 <strong>下一步建議：</strong>原始量測紀錄還在阿文個人工作區，請到 <strong>2F 實驗區找阿文</strong> 協助移交至專案指定位置（也可先下樓找 <strong>1F 阿明組長</strong> 確認兩張圖的限期授權範圍）。';
      } else if (!c.qingHasProjectAccess) {
        nextStepHint = '💡 <strong>下一步建議：</strong>檔案已移交，但小晴尚無法開啟！請先在此為<strong>小晴確認專案存取權限</strong>，再切到「存取預覽」檢查。';
      } else if (!c.qingConfirmedOpen) {
        nextStepHint = '💡 <strong>下一步建議：</strong>小晴權限已開通！請到 <strong>2F 實驗區找小晴</strong> 親自測試開啟紀錄並確認接收。';
      } else if (!c.clues.mingConfirmedScope) {
        nextStepHint = '💡 <strong>下一步建議：</strong>請下樓找 <strong>1F 阿明組長</strong> 確認阿文後續改論文所需的兩張圖與限期授權，並順便於 <strong>1F 大門接待櫃台</strong> 收回門禁卡！';
      } else if (!c.awenPaperGrant || !origRevoked) {
        nextStepHint = '💡 <strong>下一步建議：</strong>請在此設定阿文「僅兩張圖（離開後 30 天）」限期授權並<strong>終止阿文原專案權限</strong>，再切到「阿文視角」確認隔離效果！';
      } else if (!c.badgeReturned) {
        nextStepHint = '💡 <strong>下一步建議：</strong>電子權限已處理妥當，請下樓到 <strong>1F 大門接待櫃台</strong> 收回阿文的實體門禁卡並登記！';
      } else if (!c.ndaRemindedToAwen) {
        nextStepHint = '💡 <strong>下一步建議：</strong>別忘了再到 <strong>2F 實驗區找阿文</strong> 確認提醒離職後的保密義務！';
      } else {
        nextStepHint = '✅ <strong>全數離職交接項目已完成！</strong>請關閉電腦，到旁邊的 <strong>2F 值班桌</strong> 完成交班與通關！';
      }

      let tabHtml = '';
      if (activeTab === 'checklist') {
        tabHtml = `
          <div class="${!transferred && origRevoked ? 'inline-danger-box' : pending.length === 0 ? 'inline-ok-box' : 'inline-warning-box'}">
            ${nextStepHint}
          </div>
          ${inlineNotice ? `<div class="inline-ok-box">${inlineNotice}</div>` : ''}

          <div class="pc-card" style="margin-bottom:10px;">
            <h3>📋 阿文離職交接清單（晴空計畫）</h3>
            <table class="checklist-table">
              <tbody>
                <tr>
                  <th style="width:32%;">接手同事</th>
                  <td><strong>小晴</strong>（2F 實驗區）</td>
                </tr>
                <tr>
                  <th>原始量測紀錄位置</th>
                  <td>
                    <code>${c.rawLogName}</code><br>
                    ${
                      transferred
                        ? `<span class="status-badge ok">✅ 已移交至專案指定位置</span> <code>${c.rawLogTargetPath}</code>${c.adminTransferCompleted ? '（由管理員協助移交）' : ''}`
                        : `<span class="status-badge danger">❌ 仍在個人工作區</span> <code>${c.rawLogOrigPath}</code>`
                    }
                  </td>
                </tr>
                <tr>
                  <th>接手人權限與接收確認</th>
                  <td>
                    權限：${c.qingHasProjectAccess ? '<span class="status-badge ok">✅ 已開通專案權限</span>' : '<span class="status-badge warn">⬜ 尚未開通</span>'}
                    　接收：${c.qingConfirmedOpen ? '<span class="status-badge ok">✅ 接收人（小晴）已親自確認開啟</span>' : '<span class="status-badge warn">⬜ 待小晴實測確認</span>'}
                  </td>
                </tr>
                <tr>
                  <th>阿文原專案權限</th>
                  <td>
                    ${
                      origRevoked
                        ? '<span class="status-badge ok">✅ 已終止原專案權限</span>'
                        : c.awenOrigAccess === 'kept_explicit'
                        ? '<span class="status-badge danger">🚨 暫時保留中（授權過廣！可至存取預覽確認）</span>'
                        : '<span class="status-badge warn">⚠ 仍開放中（離職當日應終止）</span>'
                    }
                  </td>
                </tr>
                <tr>
                  <th>後續論文兩張圖授權</th>
                  <td>
                    ${
                      c.awenPaperGrant
                        ? `<span class="status-badge ok">✅ 已設定限期授權</span> ${c.awenPaperPurpose}｜期限：<strong>${c.awenPaperDuration}</strong>`
                        : c.clues.mingConfirmedScope
                        ? '<span class="status-badge warn">⬜ 阿明組長已核定範圍（僅兩張圖／離開後 30 天），待系統設定</span>'
                        : '<span class="status-badge warn">⬜ 待下樓找 1F 阿明組長確認範圍與期限</span>'
                    }
                  </td>
                </tr>
                <tr>
                  <th>1F 實體門禁卡回收</th>
                  <td>${c.badgeReturned ? '<span class="status-badge ok">✅ 已於 1F 大門接待櫃台收回並登記</span>' : '<span class="status-badge warn">⬜ 尚未於 1F 櫃台收回登記</span>'}</td>
                </tr>
                <tr>
                  <th>離職保密義務提醒</th>
                  <td>${c.ndaRemindedToAwen ? '<span class="status-badge ok">✅ 已透過交接對話提醒阿文保密義務</span>' : '<span class="status-badge warn">⬜ 尚未與阿文確認保密義務提醒</span>'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="ch3-action-grid">
            <div class="ch3-action-box">
              <div style="font-size:12.5px;">
                <strong>1. 接手人（小晴）專案權限</strong><br>
                <span style="color:#4c586e;">確認小晴具備晴空計畫指定資料夾存取權限，才能開啟移交的原始紀錄。</span>
              </div>
              <button class="pixel-btn ${c.qingHasProjectAccess ? '' : 'primary'}" id="btn-ch3-grant-qing" type="button" ${c.qingHasProjectAccess ? 'disabled' : ''}>
                ${c.qingHasProjectAccess ? '✅ 小晴專案權限已開通' : '🔑 為小晴確認專案存取權限'}
              </button>
            </div>

            <div class="ch3-action-box">
              <div style="font-size:12.5px;">
                <strong>2. 阿文「兩張會議圖」限期授權</strong><br>
                <span style="color:#4c586e;">依 1F 阿明組長核定範圍，僅授權圖A、圖B 供論文修訂（離開後 30 天到期）。</span>
              </div>
              <button class="pixel-btn ${c.awenPaperGrant ? '' : 'primary'}" id="btn-ch3-grant-paper" type="button" ${!c.clues.mingConfirmedScope || c.awenPaperGrant ? 'disabled' : ''}>
                ${
                  c.awenPaperGrant
                    ? '✅ 已設定兩張圖限期授權（30 天）'
                    : c.clues.mingConfirmedScope
                    ? '⏳ 設定兩張圖限期授權（離開後 30 天）'
                    : '🔒 先找 1F 阿明組長確認範圍與期限'
                }
              </button>
            </div>

            <div class="ch3-action-box">
              <div style="font-size:12.5px;">
                <strong>3. 終止阿文原專案資料夾權限</strong><br>
                <span style="color:#4c586e;">離職時應取消原專案與個人區權限，避免留存與論文無關的存取權。</span>
              </div>
              <button class="pixel-btn ${origRevoked ? '' : 'danger'}" id="btn-ch3-revoke-awen" type="button" ${origRevoked ? 'disabled' : ''}>
                ${origRevoked ? '✅ 已終止阿文原專案權限' : '🔒 終止阿文的原專案權限'}
              </button>
            </div>

            <div class="ch3-action-box">
              <div style="font-size:12.5px;">
                <strong>4. 測試保留原權限／切換視角</strong><br>
                <span style="color:#4c586e;">若先答應阿文保留原權限，可到「存取預覽」看看阿文還能存取哪些檔案。</span>
              </div>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                ${
                  !origRevoked && c.awenOrigAccess !== 'kept_explicit'
                    ? '<button class="pixel-btn warn" id="btn-ch3-keep-awen" type="button" style="flex:1; font-size:12px;">⚠ 先保留原權限</button>'
                    : ''
                }
                <button class="pixel-btn" id="btn-ch3-goto-preview" type="button" style="flex:1; font-size:12px;">👁 開啟人物存取預覽 →</button>
              </div>
            </div>
          </div>
        `;
      } else {
        // Tab 2: Perspective Access Preview (Awen vs Qing)
        const cards = window.BS.State.getCh3AccessPreview(state, previewRole);
        tabHtml = `
          <div class="role-switch-bar">
            <button class="role-switch-btn ${previewRole === 'awen' ? 'active' : ''}" id="btn-role-awen" type="button">👤 切換至：阿文視角（離任人員）</button>
            <button class="role-switch-btn ${previewRole === 'qing' ? 'active' : ''}" id="btn-role-qing" type="button">👤 切換至：小晴視角（接手同事）</button>
          </div>

          <div class="access-card-list">
            ${cards
              .map(
                (card) => `
              <div class="access-card ${card.cls}">
                <div class="access-card-top">
                  <strong>${card.title}</strong>
                  <span class="status-badge ${card.cls}">${card.badge}</span>
                </div>
                <div style="font-size:12.5px; color:#344156;">${card.detail}</div>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="pc-actions">
            ${
              previewRole === 'qing' && transferred && !c.qingHasProjectAccess
                ? '<button class="pixel-btn primary" id="btn-preview-grant-qing" type="button">🔑 立即為小晴開通專案權限並重檢</button>'
                : ''
            }
            ${
              previewRole === 'awen' && !origRevoked
                ? '<button class="pixel-btn danger" id="btn-preview-revoke-awen" type="button">🔒 立即終止阿文原專案權限並重檢</button>'
                : ''
            }
            ${
              previewRole === 'awen' && c.clues.mingConfirmedScope && !c.awenPaperGrant
                ? '<button class="pixel-btn primary" id="btn-preview-grant-paper" type="button">⏳ 設定兩張圖 30 天限期授權</button>'
                : ''
            }
            <button class="pixel-btn" id="btn-ch3-back-list" type="button">← 返回離職交接清單</button>
          </div>
        `;
      }

      body.innerHTML = `
        <div class="poster-tabs">
          <button class="poster-tab-btn ${activeTab === 'checklist' ? 'active' : ''}" id="tab-ch3-list" type="button">📋 離職交接清單與權限操作</button>
          <button class="poster-tab-btn ${activeTab === 'preview' ? 'active' : ''}" id="tab-ch3-preview" type="button">👁 存取預覽（切換阿文／小晴視角）</button>
        </div>
        ${tabHtml}
      `;

      $('tab-ch3-list').onclick = () => {
        activeTab = 'checklist';
        window.BS.Audio.select();
        render();
      };
      $('tab-ch3-preview').onclick = () => {
        activeTab = 'preview';
        if (previewRole === 'awen') c.checkedAwenView = true;
        if (previewRole === 'qing') c.checkedQingView = true;
        window.BS.Audio.select();
        render();
      };

      if (activeTab === 'checklist') {
        if ($('btn-ch3-grant-qing')) {
          $('btn-ch3-grant-qing').onclick = () => {
            callbacks.onGrantQing();
            inlineNotice = '✅ 已為小晴開通晴空計畫存取權限！可到「存取預覽」檢查，並請 2F 實驗區小晴親自確認開啟。';
            window.BS.Audio.success();
            render();
          };
        }
        if ($('btn-ch3-grant-paper')) {
          $('btn-ch3-grant-paper').onclick = () => {
            callbacks.onGrantAwenPaper();
            inlineNotice = '✅ 已依阿明組長核定範圍，設定阿文「僅兩張會議圖・離開後 30 天」獨立限期授權！';
            window.BS.Audio.success();
            render();
          };
        }
        if ($('btn-ch3-revoke-awen')) {
          $('btn-ch3-revoke-awen').onclick = () => {
            const early = callbacks.onRevokeAwenOrig();
            if (early) {
              inlineNotice = '';
              window.BS.Audio.alert();
            } else {
              inlineNotice = '✅ 已終止阿文原專案資料夾權限！建議切換到「存取預覽 → 阿文視角」確認隔離效果。';
              window.BS.Audio.success();
            }
            render();
          };
        }
        if ($('btn-ch3-keep-awen')) {
          $('btn-ch3-keep-awen').onclick = () => {
            callbacks.onKeepAwenOrig();
            activeTab = 'preview';
            previewRole = 'awen';
            c.checkedAwenView = true;
            window.BS.Audio.alert();
            render();
          };
        }
        if ($('btn-ch3-goto-preview')) {
          $('btn-ch3-goto-preview').onclick = () => {
            activeTab = 'preview';
            if (previewRole === 'awen') c.checkedAwenView = true;
            window.BS.Audio.select();
            render();
          };
        }
      } else {
        $('btn-role-awen').onclick = () => {
          previewRole = 'awen';
          c.checkedAwenView = true;
          window.BS.Audio.select();
          render();
        };
        $('btn-role-qing').onclick = () => {
          previewRole = 'qing';
          c.checkedQingView = true;
          window.BS.Audio.select();
          render();
        };
        if ($('btn-preview-grant-qing')) {
          $('btn-preview-grant-qing').onclick = () => {
            callbacks.onGrantQing();
            window.BS.Audio.success();
            render();
          };
        }
        if ($('btn-preview-revoke-awen')) {
          $('btn-preview-revoke-awen').onclick = () => {
            callbacks.onRevokeAwenOrig();
            window.BS.Audio.success();
            render();
          };
        }
        if ($('btn-preview-grant-paper')) {
          $('btn-preview-grant-paper').onclick = () => {
            callbacks.onGrantAwenPaper();
            window.BS.Audio.success();
            render();
          };
        }
        $('btn-ch3-back-list').onclick = () => {
          activeTab = 'checklist';
          window.BS.Audio.select();
          render();
        };
      }
    }

    render();
  }

  // ===== Chapter 3 (Internal 4): Lab Record, Raw File Archive & Inventory Workbench =====
  function openRecordModal(state, initialTab, callbacks) {
    activeModal = 'record';
    $('record-modal').classList.remove('hidden');
    state.ch4.openedWorkbench = true;
    let activeTab = initialTab || 'record'; // 'record' | 'file' | 'inventory'
    let inlineMsg = '';

    const PATHS = window.BS.State.CH4_PATHS;

    function getLinkLabel(linkKey) {
      if (linkKey === 'team') return PATHS.team;
      if (linkKey === 'personal') return PATHS.personal;
      if (linkKey === 'instrument') return PATHS.instrument;
      return '（尚未填寫連結）';
    }

    function render() {
      const c = state.ch4;
      const rec = c.record;
      const inv = c.inventory;
      const body = $('record-body');
      const titleEl = $('record-title');
      if (titleEl) {
        titleEl.textContent =
          activeTab === 'record'
            ? '🧪 步驟一：當日實驗紀錄卡與更正歷程'
            : activeTab === 'file'
            ? '📂 步驟二：原始量測檔指定存放位置'
            : '📋 步驟三：整批資料盤點清冊';
      }

      const rawLocLabel =
        c.rawFileLocation === 'team'
          ? '團隊指定資料夾'
          : c.rawFileLocation === 'personal'
          ? '阿文個人工作區'
          : '儀器電腦本機';

      let tabHtml = '';

      if (activeTab === 'record') {
        const hasAwen = c.clues.awenInfo;
        const hasInst = c.clues.instrumentFile || c.rawFileLocation !== 'instrument';
        const linkMismatch = c.rawFileLocation === 'team' && rec.rawFileLink !== 'team';
        const missingQuickFill = hasAwen && (!rec.date || !rec.summary || !rec.recorder);

        // Before vs After Correction Pane
        let afterPaneHtml = '';
        let afterPaneCls = '';
        if (rec.correctionMode === 'none') {
          afterPaneCls = 'lost-danger';
          afterPaneHtml = `
            <div style="font-weight:800; color:#9e1f1f; margin-bottom:4px;">❌ 尚未更正</div>
            <div>目前編號：<code>${rec.sampleIdCurrent}</code></div>
            <div style="font-size:11.5px; color:#7f1d1d; margin-top:4px;">與儀器原始檔 <code>CS_20261122_S08_RAW.csv</code> 的樣品編號不符！</div>
          `;
        } else if (rec.correctionMode === 'overwritten') {
          afterPaneCls = 'lost-danger';
          afterPaneHtml = `
            <div style="font-weight:800; color:#9e1f1f; margin-bottom:4px;">⚠ 直接覆寫（舊紀錄已消失）</div>
            <div>目前編號：<code>${rec.sampleIdCurrent}</code></div>
            <div style="font-size:11.5px; color:#7f1d1d; margin-top:4px;">系統查無原值（S03）、更正原因、時間與更正人！隔天小晴將無法確認為何變更。</div>
          `;
        } else if (rec.correctionMode === 'overwritten_retro') {
          afterPaneCls = 'retro-warn';
          afterPaneHtml = `
            <div style="font-weight:800; color:#9a5b13; margin-bottom:4px;">🟡 事後補記（非系統原本保留的歷程）</div>
            <div>目前編號：<code>${rec.sampleIdCurrent}</code></div>
            <div style="font-size:11.5px; color:#6b440f; margin-top:4px;">
              <strong>【事後補記】</strong>原筆誤編號：<code>${rec.sampleIdOriginal}</code> → <code>${rec.sampleIdCurrent}</code><br>
              原因：${rec.retroNoteReason}<br>
              補記人：${rec.retroNoteBy} ｜ 時間：${rec.retroNoteTime}<br>
              <em>※ 系統已明確區分此為「事後補記」，不等同系統原生留痕。</em>
            </div>
          `;
        } else {
          afterPaneCls = 'native-ok';
          afterPaneHtml = `
            <div style="font-weight:800; color:#1b6e44; margin-bottom:4px;">✅ 系統原本保留的更正歷程</div>
            <div>原紀錄保留：<span class="strike-old">${rec.sampleIdOriginal}</span> → 新增更正：<code>${rec.sampleIdCurrent}</code></div>
            <div style="font-size:11.5px; color:#1c5136; margin-top:4px;">
              原因：${rec.correctionReason}<br>
              更正人：${rec.correctionBy} ｜ 時間：${rec.correctionTime}
            </div>
          `;
        }

        let corrActionsHtml = '';
        if (!hasAwen) {
          corrActionsHtml = `<div class="inline-warning-box" style="margin-top:8px;">🔒 請先到 <strong>2F 實驗區找阿文</strong>確認正確樣品編號與更正原因，即可操作更正！</div>`;
        } else if (rec.correctionMode === 'none') {
          corrActionsHtml = `
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
              <button class="pixel-btn primary" id="btn-ch4-corr-append" type="button">✅ 新增一筆更正紀錄（保留原值 S03，記錄原因、時間與更正人）</button>
              <button class="pixel-btn danger" id="btn-ch4-corr-overwrite" type="button">⚠ 直接覆寫舊內容（把 S03 直接改成 S08，不保留原內容）</button>
            </div>
          `;
        } else if (rec.correctionMode === 'overwritten') {
          corrActionsHtml = `
            <div class="inline-warning-box" style="margin-top:8px;">
              ⚠ 你已直接覆寫舊內容，系統原生歷程已無法復原。你可先去「模擬隔天盤點」看看小晴會遇到什麼問題，或點下方補上「事後補記」說明來源與原因：
            </div>
            <div style="margin-top:6px;">
              <button class="pixel-btn warn" id="btn-ch4-corr-retro" type="button">📝 補上「事後補記」（補充原編號 S03、更正來源與原因）</button>
            </div>
          `;
        } else if (rec.correctionMode === 'overwritten_retro') {
          corrActionsHtml = `
            <div class="inline-warning-box" style="margin-top:8px;">
              🟡 已加上「事後補記」以說明更正來源與原因（系統會如實標示為事後補記，區別於系統原生保留的歷程）。
            </div>
          `;
        } else {
          corrActionsHtml = `
            <div class="inline-ok-box" style="margin-top:8px;">
              ✅ 已透過系統原生更正機制保留原內容與新內容，可完整追溯更正人、時間與原因！
            </div>
          `;
        }

        tabHtml = `
          ${inlineMsg ? `<div class="inline-ok-box">${inlineMsg}</div>` : ''}
          ${
            linkMismatch
              ? `<div class="inline-warning-box">⚠ <strong>偵測到路徑不同步：</strong>原始量測檔已移至「團隊指定資料夾」，但下方紀錄卡的「原始檔連結」尚未更新！若不更新，明天小晴點連結會找不到檔案。</div>`
              : ''
          }
          <div class="pc-card" style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
              <h3 style="margin:0;">📄 當日實驗紀錄卡（編號：${rec.recordId}）</h3>
              ${
                missingQuickFill
                  ? '<button class="pixel-btn primary" id="btn-ch4-fill-all" type="button" style="padding:4px 10px; font-size:12px;">⚡ 一鍵帶入阿文確認的欄位</button>'
                  : ''
              }
            </div>
            <div style="font-size:12px; color:#526179; margin-bottom:8px;">
              ※ 提示：點選已取得的線索即可帶入欄位。原始量測檔（<code>${c.rawFileName}</code>）全程維持唯讀原樣，不得改寫原始檔。
            </div>

            <div class="rec-field-row">
              <div class="rec-field-label">量測日期</div>
              <div class="rec-field-val">${rec.date ? `<strong>${rec.date}</strong>` : '<span style="color:#9a5b13;">（尚未填寫）</span>'}</div>
              <div>
                ${
                  rec.date
                    ? '<span class="status-badge ok">已填入</span>'
                    : hasAwen
                    ? '<button class="pixel-btn" id="btn-ch4-fill-date" type="button" style="padding:4px 8px; font-size:12px;">帶入：2026-11-22</button>'
                    : '<span style="font-size:11.5px; color:#7c879c;">問 2F 阿文</span>'
                }
              </div>
            </div>

            <div class="rec-field-row">
              <div class="rec-field-label">實驗摘要</div>
              <div class="rec-field-val">${rec.summary ? rec.summary : '<span style="color:#9a5b13;">（尚未填寫）</span>'}</div>
              <div>
                ${
                  rec.summary
                    ? '<span class="status-badge ok">已填入</span>'
                    : hasAwen
                    ? '<button class="pixel-btn" id="btn-ch4-fill-summary" type="button" style="padding:4px 8px; font-size:12px;">帶入摘要</button>'
                    : '<span style="font-size:11.5px; color:#7c879c;">問 2F 阿文</span>'
                }
              </div>
            </div>

            <div class="rec-field-row">
              <div class="rec-field-label">記錄人</div>
              <div class="rec-field-val">${rec.recorder ? `<strong>${rec.recorder}</strong>` : '<span style="color:#9a5b13;">（尚未填寫）</span>'}</div>
              <div>
                ${
                  rec.recorder
                    ? '<span class="status-badge ok">已填入</span>'
                    : hasAwen
                    ? '<button class="pixel-btn" id="btn-ch4-fill-recorder" type="button" style="padding:4px 8px; font-size:12px;">帶入：阿文</button>'
                    : '<span style="font-size:11.5px; color:#7c879c;">問 2F 阿文</span>'
                }
              </div>
            </div>

            <div class="rec-field-row" style="flex-direction:column; align-items:stretch;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                <div>
                  <span class="rec-field-label" style="display:inline; margin-right:8px;">原始檔連結</span>
                  <code style="font-size:11.5px;">${getLinkLabel(rec.rawFileLink)}</code>
                </div>
                <span class="status-badge ${rec.rawFileLink === 'team' && c.rawFileLocation === 'team' ? 'ok' : linkMismatch ? 'warn' : 'danger'}">
                  ${rec.rawFileLink === 'team' && c.rawFileLocation === 'team' ? '已同步團隊資料夾' : linkMismatch ? '未同步新位置' : '尚待更新'}
                </span>
              </div>
              <div style="font-size:11.5px; color:#526179;">
                目前原始檔實際存放位置：<strong>${rawLocLabel}</strong>
              </div>
              ${
                hasInst
                  ? `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                      <button class="pixel-btn ${rec.rawFileLink === 'instrument' ? 'warn' : ''}" id="btn-ch4-link-inst" type="button" style="padding:4px 8px; font-size:11.5px;">指向儀器電腦本機</button>
                      <button class="pixel-btn ${rec.rawFileLink === 'personal' ? 'warn' : ''}" id="btn-ch4-link-pers" type="button" style="padding:4px 8px; font-size:11.5px;">指向個人工作區</button>
                      <button class="pixel-btn ${rec.rawFileLink === 'team' ? 'primary' : ''}" id="btn-ch4-link-team" type="button" style="padding:4px 8px; font-size:11.5px;">✅ 更新連結至團隊指定資料夾</button>
                    </div>`
                  : '<div style="font-size:11.5px; color:#9a5b13;">🔒 請先到 2F 實驗區「儀器電腦」找到原始量測檔（CS_20261122_S08_RAW.csv）。</div>'
              }
            </div>
          </div>

          <div class="pc-card">
            <h3>✏️ 樣品編號更正對照（比較「直接覆寫」與「新增更正紀錄」）</h3>
            <div class="corr-compare-box">
              <div class="corr-pane">
                <div style="font-weight:800; color:#334155; margin-bottom:4px;">📄 更正前原紀錄</div>
                <div>樣品編號：<code>${rec.sampleIdOriginal}</code></div>
                <div style="font-size:11.5px; color:#64748b; margin-top:4px;">原始量測檔（唯讀原樣）：<code>${c.rawFileName}</code></div>
              </div>
              <div class="corr-pane ${afterPaneCls}">
                ${afterPaneHtml}
              </div>
            </div>
            ${corrActionsHtml}
          </div>
        `;
      } else if (activeTab === 'file') {
        const hasInst = c.clues.instrumentFile || c.rawFileLocation !== 'instrument';
        tabHtml = `
          ${inlineMsg ? `<div class="inline-ok-box">${inlineMsg}</div>` : ''}
          <div class="pc-card">
            <h3>📂 原始量測檔存放位置管理（模擬檔案系統）</h3>
            <p style="margin:0 0 8px; font-size:12.5px; color:#4b576d;">
              檔名：<code>${c.rawFileName}</code>（唯讀原樣保留，不改寫內容）<br>
              目前實際存放位置：<strong>${rawLocLabel}</strong>（<code>${PATHS[c.rawFileLocation]}</code>）
            </p>
            ${
              !hasInst
                ? `<div class="inline-warning-box">🔒 尚未確認儀器上的原始量測檔！請先前往 <strong>2F 實驗區「儀器電腦」</strong>找到 <code>${c.rawFileName}</code>，再回來安排歸檔位置。</div>`
                : `
                  <div class="access-card-list">
                    <div class="access-card ${c.rawFileLocation === 'instrument' ? 'danger' : ''}">
                      <div class="access-card-top">
                        <strong>1. 留在儀器電腦本機</strong>
                        <span class="status-badge ${c.rawFileLocation === 'instrument' ? 'danger' : 'warn'}">${c.rawFileLocation === 'instrument' ? '目前位置' : '不建議'}</span>
                      </div>
                      <div style="font-size:12px; color:#475569; margin-bottom:6px;">
                        路徑：<code>${PATHS.instrument}</code><br>
                        其他同事無法從團隊系統直接開啟，且儀器暫存區容易被覆蓋或清理。
                      </div>
                      <button class="pixel-btn ${c.rawFileLocation === 'instrument' ? 'danger' : ''}" id="btn-ch4-loc-inst" type="button" ${c.rawFileLocation === 'instrument' ? 'disabled' : ''}>留在儀器本機</button>
                    </div>

                    <div class="access-card ${c.rawFileLocation === 'personal' ? 'danger' : ''}">
                      <div class="access-card-top">
                        <strong>2. 移到阿文個人工作區</strong>
                        <span class="status-badge ${c.rawFileLocation === 'personal' ? 'danger' : 'warn'}">${c.rawFileLocation === 'personal' ? '目前位置' : '他人無權限'}</span>
                      </div>
                      <div style="font-size:12px; color:#475569; margin-bottom:6px;">
                        路徑：<code>${PATHS.personal}</code><br>
                        僅阿文帳號有權存取，明天小晴盤點時會因權限不足無法開啟。
                      </div>
                      <button class="pixel-btn ${c.rawFileLocation === 'personal' ? 'warn' : ''}" id="btn-ch4-loc-pers" type="button" ${c.rawFileLocation === 'personal' ? 'disabled' : ''}>放到個人工作區</button>
                    </div>

                    <div class="access-card ${c.rawFileLocation === 'team' ? 'ok' : ''}">
                      <div class="access-card-top">
                        <strong>3. 歸檔至團隊指定資料夾（受控共用空間）</strong>
                        <span class="status-badge ${c.rawFileLocation === 'team' ? 'ok' : 'warn'}">${c.rawFileLocation === 'team' ? '✅ 已歸檔至此' : '建議位置'}</span>
                      </div>
                      <div style="font-size:12px; color:#475569; margin-bottom:6px;">
                        路徑：<code>${PATHS.team}</code><br>
                        符合專案權限控管且具固定歸檔結構，接手同事明天即可依清冊與連結找到檔案。
                      </div>
                      <button class="pixel-btn primary" id="btn-ch4-loc-team" type="button" ${c.rawFileLocation === 'team' ? 'disabled' : ''}>${c.rawFileLocation === 'team' ? '✅ 已存放在團隊指定資料夾' : '📁 歸檔至團隊指定資料夾'}</button>
                    </div>
                  </div>
                  ${
                    c.rawFileLocation === 'team' && rec.rawFileLink !== 'team'
                      ? `<div class="inline-warning-box" style="margin-top:10px;">
                          ⚠ 檔案已歸檔到團隊指定資料夾，但<strong>「步驟一：實驗紀錄卡」中的原始檔連結不會自動更新</strong>！<br>
                          <button class="pixel-btn primary" id="btn-ch4-jump-rec" type="button" style="margin-top:6px; padding:4px 10px; font-size:12px;">← 立刻回步驟一更新原始檔連結</button>
                        </div>`
                      : ''
                  }
                `
            }
          </div>
        `;
      } else {
        // Tab 3: Batch Inventory Entry (5 fields)
        const nameText =
          inv.nameScope === 'batch_clean'
            ? '晴空計畫 2026-11 批次量測資料（實驗紀錄與原始檔）'
            : inv.nameScope === 'batch_leaked_params'
            ? '晴空計畫薄膜配方 TiN-450°C-120s 退火條件與 S08 量測數據'
            : '（尚未選擇）';
        const locText =
          inv.location === 'team_folder'
            ? '/TeamDrive/ClearSky_202611/（受控團隊專案資料夾）'
            : inv.location === 'instrument_pc'
            ? 'Instrument_PC:\\Temp_Raw\\（儀器電腦本機）'
            : '（尚未選擇）';

        tabHtml = `
          ${inlineMsg ? `<div class="inline-ok-box">${inlineMsg}</div>` : ''}
          ${
            inv.nameScope === 'batch_leaked_params'
              ? '<div class="inline-warning-box">⚠ <strong>注意：</strong>盤點清冊是管理目錄，不應把機密配方與製程溫度參數直接寫進清冊名稱！技術細節應留在受控的實驗紀錄裡。</div>'
              : ''
          }
          <div class="pc-card">
            <h3>📋 更新「本次量測資料」盤點清冊（整批資料一筆項目）</h3>
            <p style="margin:0 0 8px; font-size:12.5px; color:#4b576d;">
              清冊用來幫助主管與接手同事快速找到這批資料與負責人，<strong>以整批資料為單位</strong>，不寫入機密技術細節。
              ${!c.clues.qingChecklistReq ? '（小提示：也可以下樓問 <strong>1F 大廳的小晴</strong>，聽聽她明天盤點會先看哪幾個欄位！）' : '（✅ 已向 1F 小晴確認明日盤點重點）'}
            </p>

            <div class="rec-field-row" style="flex-direction:column; align-items:stretch;">
              <div><span class="rec-field-label" style="display:inline; margin-right:8px;">1. 資料名稱或範圍</span><strong>${nameText}</strong></div>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="pixel-btn ${inv.nameScope === 'batch_clean' ? 'primary' : ''}" id="btn-inv-name-clean" type="button" style="padding:4px 8px; font-size:12px;">✅ 晴空計畫 2026-11 批次量測資料（不含機密參數）</button>
                <button class="pixel-btn ${inv.nameScope === 'batch_leaked_params' ? 'danger' : ''}" id="btn-inv-name-leak" type="button" style="padding:4px 8px; font-size:12px;">⚠ 寫入薄膜配方 TiN-450°C-120s 退火參數與 S08 數據</button>
              </div>
            </div>

            <div class="rec-field-row">
              <div class="rec-field-label">2. 資料類型</div>
              <div class="rec-field-val">${inv.dataType || '<span style="color:#9a5b13;">（尚未選擇）</span>'}</div>
              <div>
                <button class="pixel-btn ${inv.dataType ? 'primary' : ''}" id="btn-inv-type" type="button" style="padding:4px 8px; font-size:12px;">${inv.dataType ? '✅ 已填入' : '填入：電子實驗紀錄＋原始量測檔'}</button>
              </div>
            </div>

            <div class="rec-field-row">
              <div class="rec-field-label">3. 保護原因</div>
              <div class="rec-field-val">${inv.protectReason || '<span style="color:#9a5b13;">（尚未選擇）</span>'}</div>
              <div>
                <button class="pixel-btn ${inv.protectReason ? 'primary' : ''}" id="btn-inv-reason" type="button" style="padding:4px 8px; font-size:12px;">${inv.protectReason ? '✅ 已填入' : '填入：未公開量測成果／專利評估'}</button>
              </div>
            </div>

            <div class="rec-field-row" style="flex-direction:column; align-items:stretch;">
              <div><span class="rec-field-label" style="display:inline; margin-right:8px;">4. 指定存放位置</span><code>${locText}</code></div>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="pixel-btn ${inv.location === 'team_folder' ? 'primary' : ''}" id="btn-inv-loc-team" type="button" style="padding:4px 8px; font-size:12px;">✅ 團隊指定資料夾 /TeamDrive/ClearSky_202611/</button>
                <button class="pixel-btn ${inv.location === 'instrument_pc' ? 'warn' : ''}" id="btn-inv-loc-inst" type="button" style="padding:4px 8px; font-size:12px;">⚠ 儀器電腦本機暫存區</button>
              </div>
            </div>

            <div class="rec-field-row">
              <div class="rec-field-label">5. 負責人</div>
              <div class="rec-field-val">${inv.owner || '<span style="color:#9a5b13;">（尚未選擇）</span>'}</div>
              <div>
                <button class="pixel-btn ${inv.owner ? 'primary' : ''}" id="btn-inv-owner" type="button" style="padding:4px 8px; font-size:12px;">${inv.owner ? '✅ 已填入' : '填入：阿文（量測負責人）'}</button>
              </div>
            </div>
          </div>
        `;
      }

      body.innerHTML = `
        <div class="poster-tabs">
          <button class="poster-tab-btn ${activeTab === 'record' ? 'active' : ''}" id="tab-ch4-record" type="button">📝 步驟一：實驗紀錄卡</button>
          <button class="poster-tab-btn ${activeTab === 'file' ? 'active' : ''}" id="tab-ch4-file" type="button">📂 步驟二：原始檔位置</button>
          <button class="poster-tab-btn ${activeTab === 'inventory' ? 'active' : ''}" id="tab-ch4-inv" type="button">📋 步驟三：盤點清冊</button>
        </div>
        ${tabHtml}
        <div class="pc-actions" style="justify-content:space-between; margin-top:12px;">
          <button class="pixel-btn warn" id="btn-ch4-open-lookup" type="button">🔍 模擬隔天盤點（切換小晴查找視角）</button>
          <button class="pixel-btn" id="btn-ch4-close-wb" type="button">關閉工作台</button>
        </div>
      `;

      $('tab-ch4-record').onclick = () => {
        activeTab = 'record';
        inlineMsg = '';
        window.BS.Audio.select();
        render();
      };
      $('tab-ch4-file').onclick = () => {
        activeTab = 'file';
        inlineMsg = '';
        window.BS.Audio.select();
        render();
      };
      $('tab-ch4-inv').onclick = () => {
        activeTab = 'inventory';
        inlineMsg = '';
        window.BS.Audio.select();
        render();
      };
      $('btn-ch4-open-lookup').onclick = () => {
        window.BS.Audio.confirm();
        closeAllModals();
        if (callbacks.onOpenLookup) callbacks.onOpenLookup();
      };
      $('btn-ch4-close-wb').onclick = () => {
        window.BS.Audio.cancel();
        closeAllModals();
        if (callbacks.onUpdate) callbacks.onUpdate();
      };

      // Tab 1 bindings
      if (activeTab === 'record') {
        if ($('btn-ch4-fill-all')) {
          $('btn-ch4-fill-all').onclick = () => {
            rec.date = '2026-11-22';
            rec.summary = '晴空計畫薄膜樣品 S08 室溫阻抗與穩定度基準量測';
            rec.recorder = '阿文';
            inlineMsg = '✅ 已帶入阿文確認的量測日期、實驗摘要與記錄人！';
            window.BS.Audio.success();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-fill-date')) {
          $('btn-ch4-fill-date').onclick = () => {
            rec.date = '2026-11-22';
            inlineMsg = '✅ 已帶入量測日期：2026-11-22';
            window.BS.Audio.confirm();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-fill-summary')) {
          $('btn-ch4-fill-summary').onclick = () => {
            rec.summary = '晴空計畫薄膜樣品 S08 室溫阻抗與穩定度基準量測';
            inlineMsg = '✅ 已帶入實驗摘要。';
            window.BS.Audio.confirm();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-fill-recorder')) {
          $('btn-ch4-fill-recorder').onclick = () => {
            rec.recorder = '阿文';
            inlineMsg = '✅ 已帶入記錄人：阿文';
            window.BS.Audio.confirm();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-link-inst')) {
          $('btn-ch4-link-inst').onclick = () => {
            rec.rawFileLink = 'instrument';
            inlineMsg = '已將紀錄卡原始檔連結指向儀器電腦本機。';
            window.BS.Audio.select();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-link-pers')) {
          $('btn-ch4-link-pers').onclick = () => {
            rec.rawFileLink = 'personal';
            inlineMsg = '已將紀錄卡原始檔連結指向阿文個人工作區。';
            window.BS.Audio.select();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-link-team')) {
          $('btn-ch4-link-team').onclick = () => {
            rec.rawFileLink = 'team';
            inlineMsg =
              c.rawFileLocation === 'team'
                ? '✅ 已將原始檔連結同步更新為團隊指定資料夾！'
                : '已將連結設為團隊指定資料夾（提醒：請確認「步驟二」也已把檔案實際移過去！）。';
            window.BS.Audio.success();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-corr-append')) {
          $('btn-ch4-corr-append').onclick = () => {
            rec.correctionMode = 'tracked_append';
            rec.sampleIdCurrent = 'CS-2026-S08';
            rec.correctionReason = '核對儀器原始檔名與樣品盤標籤，確認筆誤 S03 應為 S08';
            rec.correctionTime = window.BS.State.formatClock(state.timeMinutes);
            rec.correctionBy = '小安（與阿文確認）';
            inlineMsg = '✅ 已新增系統原生更正紀錄！原編號 CS-2026-S03 完整保留，並記錄原因、時間與更正人。';
            window.BS.Audio.success();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-corr-overwrite')) {
          $('btn-ch4-corr-overwrite').onclick = () => {
            rec.correctionMode = 'overwritten';
            rec.sampleIdCurrent = 'CS-2026-S08';
            inlineMsg = '';
            window.BS.Audio.alert();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-corr-retro')) {
          $('btn-ch4-corr-retro').onclick = () => {
            rec.correctionMode = 'overwritten_retro';
            rec.retroNoteReason = '核對儀器原始檔名確認原筆誤 CS-2026-S03 應為 CS-2026-S08（先前已直接覆寫，於此補記來源與原因）';
            rec.retroNoteTime = window.BS.State.formatClock(state.timeMinutes);
            rec.retroNoteBy = '小安（事後補記）';
            inlineMsg = '📝 已完成「事後補記」！系統將如實區分此為事後補記，而非系統原本保留的歷程。';
            window.BS.Audio.confirm();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
      }

      // Tab 2 bindings
      if (activeTab === 'file') {
        if ($('btn-ch4-loc-inst')) {
          $('btn-ch4-loc-inst').onclick = () => {
            c.rawFileLocation = 'instrument';
            inlineMsg = '原始檔目前設定保留於儀器電腦本機。';
            window.BS.Audio.select();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-loc-pers')) {
          $('btn-ch4-loc-pers').onclick = () => {
            c.rawFileLocation = 'personal';
            inlineMsg = '原始檔已移至阿文個人工作區（提醒：小晴可能無法存取個人工作區）。';
            window.BS.Audio.alert();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-loc-team')) {
          $('btn-ch4-loc-team').onclick = () => {
            c.rawFileLocation = 'team';
            inlineMsg = '✅ 已將原始檔原樣歸檔至團隊指定資料夾！請記得回「步驟一：實驗紀錄卡」同步更新原始檔連結。';
            window.BS.Audio.success();
            if (callbacks.onUpdate) callbacks.onUpdate();
            render();
          };
        }
        if ($('btn-ch4-jump-rec')) {
          $('btn-ch4-jump-rec').onclick = () => {
            activeTab = 'record';
            inlineMsg = '';
            window.BS.Audio.select();
            render();
          };
        }
      }

      // Tab 3 bindings
      if (activeTab === 'inventory') {
        $('btn-inv-name-clean').onclick = () => {
          inv.nameScope = 'batch_clean';
          inlineMsg = '✅ 已選用整批資料名稱（未暴露機密技術細節）。';
          window.BS.Audio.success();
          if (callbacks.onUpdate) callbacks.onUpdate();
          render();
        };
        $('btn-inv-name-leak').onclick = () => {
          inv.nameScope = 'batch_leaked_params';
          inlineMsg = '';
          window.BS.Audio.alert();
          if (callbacks.onUpdate) callbacks.onUpdate();
          render();
        };
        $('btn-inv-type').onclick = () => {
          inv.dataType = '電子實驗紀錄＋儀器原始量測檔（CSV）';
          inlineMsg = '✅ 已填入資料類型。';
          window.BS.Audio.confirm();
          if (callbacks.onUpdate) callbacks.onUpdate();
          render();
        };
        $('btn-inv-reason').onclick = () => {
          inv.protectReason = '未公開研究量測成果，涉及後續論文發表與專利評估';
          inlineMsg = '✅ 已填入保護原因。';
          window.BS.Audio.confirm();
          if (callbacks.onUpdate) callbacks.onUpdate();
          render();
        };
        $('btn-inv-loc-team').onclick = () => {
          inv.location = 'team_folder';
          inlineMsg = '✅ 已指定存放位置為團隊受控資料夾。';
          window.BS.Audio.success();
          if (callbacks.onUpdate) callbacks.onUpdate();
          render();
        };
        $('btn-inv-loc-inst').onclick = () => {
          inv.location = 'instrument_pc';
          inlineMsg = '⚠ 已填寫儀器電腦本機（明天小晴從團隊共用系統可能找不到）。';
          window.BS.Audio.alert();
          if (callbacks.onUpdate) callbacks.onUpdate();
          render();
        };
        $('btn-inv-owner').onclick = () => {
          inv.owner = '阿文（晴空計畫量測負責人）';
          inlineMsg = '✅ 已填入負責人：阿文。';
          window.BS.Audio.confirm();
          if (callbacks.onUpdate) callbacks.onUpdate();
          render();
        };
      }
    }

    render();
  }

  // ===== Chapter 3 (Internal 4): Next-Day Qing Lookup Simulation Modal =====
  function openLookupModal(state, callbacks) {
    activeModal = 'lookup';
    $('lookup-modal').classList.remove('hidden');
    state.ch4.ranLookupOnce = true;

    const lookup = window.BS.State.evaluateCh4Lookup(state);
    const body = $('lookup-body');

    let summaryBanner = '';
    if (lookup.allOk) {
      summaryBanner = `
        <div class="inline-ok-box">
          <strong>✅ 隔天 09:30 小晴盤點結果：四個步驟全數順暢通過！</strong><br>
          小晴從盤點清冊一路找到實驗紀錄、原始量測檔，也清楚驗證了樣品編號的系統原生更正歷程！
        </div>
      `;
    } else if (lookup.dangerCount === 0 && state.ch4.record.correctionMode === 'overwritten_retro' && lookup.warnCount === 1) {
      summaryBanner = `
        <div class="inline-warning-box">
          <strong>🟡 隔天 09:30 小晴盤點結果：檔案與清冊皆已找到，但更正紀錄為「事後補記」</strong><br>
          清冊、紀錄與原始檔均正常開啟；樣品編號變更已透過事後補記說明脈絡（系統如實區分其非原生留痕）。
        </div>
      `;
    } else {
      summaryBanner = `
        <div class="inline-warning-box" style="background:#fff1f0; border-color:#d95d4c; color:#8a1c1c;">
          <strong>⚠ 隔天 09:30 小晴盤點遇到斷點！（異常 ${lookup.dangerCount} 項｜提醒 ${lookup.warnCount} 項）</strong><br>
          你可以先「返回樓層修正」補齊缺口再來重測，或以目前結果直接完成本章交班查看檢討。
        </div>
      `;
    }

    body.innerHTML = `
      <div style="font-size:12.5px; color:#475569; margin-bottom:8px;">
        <strong>模擬情境：</strong>隔天早上 09:30，同事<strong>小晴</strong>在沒有你口頭解說的情況下，只靠你昨天整理好的盤點清冊與系統紀錄逐項盤點這批資料：
      </div>
      ${summaryBanner}
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        ${lookup.steps
          .map(
            (st) => `
          <div class="lookup-step-card ${st.cls}">
            <div class="access-card-top">
              <strong>${st.title}</strong>
              <span class="status-badge ${st.cls}">${st.badge}</span>
            </div>
            <div style="font-size:12.5px; color:#2b3648;">${st.detail}</div>
            ${st.fix ? `<div class="lookup-fix-tip">🔧 修正方向：${st.fix}</div>` : ''}
          </div>
        `
          )
          .join('')}
      </div>
      <div class="pc-actions" style="justify-content:space-between; margin-top:12px;">
        <button class="pixel-btn" id="btn-lookup-fix" type="button">🔧 返回樓層／工作台修正</button>
        <button class="pixel-btn ${lookup.allOk ? 'primary' : 'warn'}" id="btn-lookup-handover" type="button">✍ 以目前結果完成本章交班</button>
      </div>
    `;

    $('btn-lookup-fix').onclick = () => {
      window.BS.Audio.select();
      closeAllModals();
      if (callbacks.onFix) callbacks.onFix();
    };
    $('btn-lookup-handover').onclick = () => {
      window.BS.Audio.confirm();
      closeAllModals();
      if (callbacks.onHandover) callbacks.onHandover();
    };
  }

  // ===== Field Notes / Clues Modal =====
  function openCluesModal(state) {
    activeModal = 'clues';
    $('clues-modal').classList.remove('hidden');

    if (state.chapter === 4) {
      const c = state.ch4;
      const lookup = window.BS.State.evaluateCh4Lookup(state);
      $('clues-title').textContent = '📋 第三章筆記 — 今天的紀錄，明天找得到（SELECT）';
      $('clues-body').innerHTML = `
        <div class="section-card">
          <h3>🏢 雙樓層資料整理路線圖</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li><strong>2F 實驗區</strong>：阿文（確認日期、樣品編號 S03→S08、摘要與記錄人）、儀器電腦（找到原始量測檔 <code>${c.rawFileName}</code>）、實驗紀錄桌（開啟當日紀錄卡與更正比較）。</li>
            <li><strong>2F 辦公區</strong>：值班電腦（整理原始檔存放位置與整批資料盤點清冊）、值班桌（模擬隔天盤點與完成交班）。</li>
            <li><strong>1F 大門大廳</strong>：小晴（確認明天盤點從清冊怎麼查，亦可直接預覽隔天查找）、阿明組長（卡住時的欄位／歸檔／更正提示）、1F 大門櫃台（清冊填寫範例卡）。</li>
          </ul>
        </div>

        <div class="section-card">
          <h3>🔍 調查線索與整理進度</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${c.clues.awenInfo ? '✅' : '⬜'} <strong>2F 阿文資訊</strong>：${c.clues.awenInfo ? '已取得日期（2026-11-22）、S03→S08 更正原因、摘要與記錄人。' : '尚未找 2F 實驗區阿文確認當日欄位。'}</li>
            <li>${c.clues.instrumentFile ? '✅' : '⬜'} <strong>2F 儀器電腦原始檔</strong>：${c.clues.instrumentFile ? `已找到 <code>${c.rawFileName}</code>（目前存放於：${c.rawFileLocation === 'team' ? '團隊指定資料夾' : c.rawFileLocation === 'personal' ? '個人工作區' : '儀器本機'}）。` : '尚未調查 2F 實驗區儀器電腦。'}</li>
            <li>${c.clues.qingChecklistReq ? '✅' : '⬜'} <strong>1F 小晴盤點需求</strong>：${c.clues.qingChecklistReq ? '已確認明天小晴會從盤點清冊開始找資料、紀錄與更正脈絡。' : '可下樓找 1F 大廳小晴了解盤點查找順序。'}</li>
          </ul>
        </div>

        <div class="section-card">
          <h3>🧪 模擬隔天查找即時狀態</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            ${lookup.steps.map((st) => `<li><strong>${st.badge}</strong> — ${st.title}</li>`).join('')}
          </ul>
        </div>
      `;
      return;
    }

    if (state.chapter === 3) {
      const c = state.ch3;
      const pending = window.BS.State.getCh3PendingItems(state);
      $('clues-title').textContent = '📋 第四章筆記 — 阿文的最後一天（SELECT）';
      $('clues-body').innerHTML = `
        <div class="section-card">
          <h3>🏢 雙樓層交接路線圖</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li><strong>2F 辦公區</strong>：值班電腦（交接清單＋阿文／小晴存取預覽）、值班桌（交班）。</li>
            <li><strong>2F 實驗區</strong>：阿文（移交原始紀錄、提醒保密義務）、小晴（實測開啟紀錄並確認接收）、實驗紀錄電腦（對照原位置與接手位置）。</li>
            <li><strong>1F 大門大廳</strong>：阿明組長（核定兩張圖 30 天授權範圍；或誤提早停權時啟動管理員協助移交）、1F 大門接待櫃台（收回並登記阿文的實體門禁卡）。</li>
          </ul>
        </div>

        <div class="section-card">
          <h3>✅ 交接清單目前狀態（剩餘 ${pending.length} 項待辦）</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${c.rawLogLocation === 'project' ? '✅' : '⬜'} <strong>原始紀錄移交</strong>：<code>${c.rawLogName}</code>（${c.rawLogLocation === 'project' ? '已移交至專案指定位置' : '仍在阿文個人工作區'}）</li>
            <li>${c.qingHasProjectAccess ? '✅' : '⬜'} <strong>小晴專案存取權限</strong>：${c.qingHasProjectAccess ? '已開通' : '尚未於 2F 值班電腦開通'}</li>
            <li>${c.qingConfirmedOpen ? '✅' : '⬜'} <strong>小晴親自確認開啟</strong>：${c.qingConfirmedOpen ? '小晴已確認接收' : '請到 2F 實驗區找小晴實測確認'}</li>
            <li>${c.clues.mingConfirmedScope ? '✅' : '⬜'} <strong>1F 阿明組長核定範圍</strong>：${c.clues.mingConfirmedScope ? '僅兩張會議圖・論文修訂・離開後 30 天' : '請下樓找 1F 阿明組長確認'}</li>
            <li>${c.awenOrigAccess === 'revoked' ? '✅' : '⬜'} <strong>終止阿文原專案權限</strong>：${c.awenOrigAccess === 'revoked' ? '已終止' : '🚨 仍開放中！'}</li>
            <li>${c.awenPaperGrant ? '✅' : '⬜'} <strong>設定兩張圖限期授權</strong>：${c.awenPaperGrant ? '已設定（離開後 30 天）' : '尚未設定'}</li>
            <li>${c.badgeReturned ? '✅' : '⬜'} <strong>1F 實體門禁卡收回</strong>：${c.badgeReturned ? '已於 1F 櫃台登記收回' : '請下樓至 1F 大門接待櫃台登記'}</li>
            <li>${c.ndaRemindedToAwen ? '✅' : '⬜'} <strong>離職保密義務提醒</strong>：${c.ndaRemindedToAwen ? '已向阿文提醒確認' : '請找 2F 實驗區阿文確認提醒'}</li>
          </ul>
        </div>
      `;
      return;
    }

    if (state.chapter === 2) {
      const c = state.ch2;
      const wv = window.BS.State.getWorkingVersion(state);
      const wm = window.BS.State.getVersionStatusMeta(wv.status);
      $('clues-title').textContent = '📋 第二章筆記與海報進度';
      $('clues-body').innerHTML = `
        <div class="section-card">
          <h3>📌 第二章「投稿前一晚」待辦</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li><strong>辦公區電腦（海報草稿）</strong>：檢視三張示意圖、比較版本差異，決定送審提交或暫緩投稿。</li>
            <li><strong>目前作業版本</strong>：<code>${wv.filename}</code>（${wm.text}）</li>
            <li><strong>投稿進度</strong>：${
              c.outcome === 'in_progress'
                ? c.pendingReviewVersionId
                  ? '已送審，請找辦公區阿明組長確認核准'
                  : '審閱整理中（可整理送審或選擇暫緩投稿）'
                : c.outcome === 'submitted_approved'
                ? '✅ 已提交核准版本，請回值班桌填寫交班紀錄'
                : c.outcome === 'deferred'
                ? '⏸ 已決定暫緩投稿，請回值班桌填寫交班紀錄'
                : c.contactedOrganizer && c.reportedToLead
                ? '🚒 誤傳已聯絡主辦方並回報阿明組長（公開狀態待確認），可回值班桌交班'
                : '🚨 誤傳未確認版本！請回電腦聯絡主辦方並找阿明組長回報'
            }</li>
          </ul>
        </div>

        <div class="section-card">
          <h3>🔍 已掌握的線索</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${c.openedPoster ? '✅' : '⬜'} <strong>檢視海報草稿</strong>：${c.openedPoster ? '已檢視三張示意圖（圖一可公開、圖二待確認、圖三涉及專利安排）。' : '尚未開啟辦公區電腦查看海報草稿。'}</li>
            <li>${c.clues.wenExplainedFig2 ? '✅' : '⬜'} <strong>實驗區的阿文</strong>：${c.clues.wenExplainedFig2 ? '確認圖二原用於上次合作會議，已取得可送審替代圖（電腦已解鎖替換）。' : '尚未找實驗區的阿文詢問圖二來源與替代圖。'}</li>
            <li>${c.clues.mingExplainedRules ? '✅' : '⬜'} <strong>辦公區的阿明組長（公開與專利）</strong>：${c.clues.mingExplainedRules ? '確認合作會議圖未確認公開授權不可直接放海報；圖三專利公開時點待確認，可先移除或暫緩投稿。' : '尚未詢問辦公區阿明組長「現在哪張圖能用？」。'}</li>
            <li>${c.clues.mingExplainedVersion ? '✅' : '⬜'} <strong>版本確認流程</strong>：${c.clues.mingExplainedVersion ? '核准綁定當時送審版本，核准後若再編輯須重新確認，上傳前須核對檔名。' : '可向辦公區阿明組長詢問「整理好之後怎麼確認版本？」。'}</li>
          </ul>
        </div>
      `;
      return;
    }

    $('clues-title').textContent = '📋 第一章值班筆記與進度';
    const c = state.clues;
    const l = state.labItems;
    const e = state.email;
    const v = state.visitor;

    $('clues-body').innerHTML = `
      <div class="section-card">
        <h3>📌 今日值班待辦（可任意順序處理）</h3>
        <ul style="margin:6px 0 0; padding-left:18px;">
          <li><strong>合作方來信（辦公區電腦）</strong>：${
            e.status === 'unread' ? '尚未開信' :
            e.status === 'read' ? '已讀，待決定分享方式' :
            e.status === 'holding' ? '已回覆確認中，補齊資訊後回電腦寄出' :
            e.misshared && !e.linkRevoked ? '🚨 誤設公開連結！請快回電腦停權並找阿明組長通報' :
            e.misshared && !e.reportedToLead ? '⚠ 連結已停用，請找負責人阿明組長完成通報' :
            '✅ 已處理完成'
          }</li>
          <li><strong>訪客拍照（1F 大門櫃台）</strong>：${
            v.status === 'waiting' ? '陳先生在一樓大門櫃台等候接待（由左側樓梯／電梯下樓）' :
            v.status === 'in_lab' ? '已陪同上 2F 實驗區，整理完白板／螢幕／標籤後再找陳先生重拍' :
            '✅ 已完成接待與拍攝'
          }</li>
          <li><strong>最後交班（2F 辦公區值班桌）</strong>：兩件事處理完後，回 2F 值班桌填寫交班紀錄！</li>
        </ul>
      </div>

      <div class="section-card">
        <h3>🔍 已掌握的核對資訊</h3>
        <ul style="margin:6px 0 0; padding-left:18px;">
          <li>${c.meetingVersion ? '✅' : '⬜'} <strong>會議用核准版本</strong>：${c.meetingVersion ? '阿文已整理只含兩張圖的會議版（ClearSky_會議用摘要圖_v2）。' : '尚未確認（可到實驗區問同事阿文）。'}</li>
          <li>${c.ndaScope ? '✅' : '⬜'} <strong>廠商 NDA 簽署查核（NDA-CS-2026）</strong>：${c.ndaScope ? '已確認星海科技已簽署有效 NDA（效期內），僅涵蓋兩張摘要圖供蘇小姐開會用，不含原始數據、製程筆記與協力廠商。' : '尚未確認是否已簽署有效 NDA（可於電腦查詢 NDA 合約清單或詢問辦公區阿明組長）。'}</li>
          <li>${c.visitorLog ? '✅' : '⬜'} <strong>訪客接待登記</strong>：${c.visitorLog ? '已核對登記簿：核准入口形象牆拍照；若進實驗區須全程陪同且不得拍入敏感資訊。' : '尚未確認（可調查訪客入口接待處）。'}</li>
          <li>${c.visitorPurpose ? '✅' : '⬜'} <strong>訪客拍攝用途</strong>：${c.visitorPurpose ? '陳先生表示照片將放進對外公開的參訪紀錄報告。' : '尚未詢問訪客陳先生。'}</li>
        </ul>
      </div>

      <div class="section-card">
        <h3>🧪 實驗區敏感資訊檢查狀態</h3>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;">
          <span class="cam-tag ${l.whiteboard ? 'ok' : 'leak'}">${l.whiteboard ? '✓ 白板已擦拭' : '⚠ 白板有配方參數'}</span>
          <span class="cam-tag ${l.monitor ? 'ok' : 'leak'}">${l.monitor ? '✓ 實驗螢幕已鎖定' : '⚠ 實驗螢幕顯示原始數據'}</span>
          <span class="cam-tag ${l.samples ? 'ok' : 'leak'}">${l.samples ? '✓ 樣品標籤已收妥' : '⚠ 樣品架露出代碼標籤'}</span>
        </div>
      </div>
    `;
  }

  // ===== Endings Gallery Modal (Chapter 1) =====
  function openEndingsModal() {
    activeModal = 'endings';
    $('endings-modal').classList.remove('hidden');
    const unlocked = window.BS.State.loadUnlockedEndings();
    const catalog = window.BS.State.ENDINGS_CATALOG;

    $('endings-body').innerHTML = `
      <p style="margin:0 0 10px; font-size:13px; color:#4c586e;">
        第一章「寄出之前」已解鎖 <strong>${unlocked.length} / ${catalog.length}</strong> 種交班結果。不同選擇會觸發不同劇情，歡迎重玩體驗「先查證」與「誤寄後補救」路線！
      </p>
      <div class="ending-grid">
        ${catalog
          .map((item) => {
            const isOpen = unlocked.includes(item.id);
            return `
              <div class="ending-item ${isOpen ? 'unlocked' : 'locked'}">
                <div style="font-weight:800; font-size:14px; margin-bottom:3px;">
                  ${isOpen ? `${item.icon} ${item.title}` : `🔒 ？？？（尚未解鎖）`}
                </div>
                <div style="font-size:12.5px;">
                  ${isOpen ? item.desc : `提示：${item.hint}`}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  // ===== Handover Summary Modal (Ch1, Ch2 & Ch3) =====
  function openHandoverModal(result, callbacks) {
    activeModal = 'handover';
    $('handover-modal').classList.remove('hidden');

    if (result.chapter === 4) {
      const { banner, sections } = result;
      $('handover-title').textContent = '📑 第三章交班紀錄 — 今天的紀錄，明天找得到';
      $('handover-body').innerHTML = `
        <div class="ending-banner">
          <div class="ending-label">第三章「今天的紀錄，明天找得到」盤點交班紀錄</div>
          <h2>${banner.icon} ${banner.title}</h2>
          <p>${banner.desc}</p>
        </div>

        <div class="section-card">
          <h3>
            <span>1. 隔天盤點找到的資料與存放位置</span>
            <span class="status-badge ${sections.data.badge.cls}">${sections.data.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.data.detail}</p>
          <div class="reminder-quote">💡 ${sections.data.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>2. 可追溯的樣品編號更正歷程</span>
            <span class="status-badge ${sections.correction.badge.cls}">${sections.correction.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.correction.detail}</p>
          <div class="reminder-quote">💡 ${sections.correction.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>3. 未完成項目與後續建議</span>
            <span class="status-badge ${sections.followup.badge.cls}">${sections.followup.badge.text}</span>
          </h3>
          <ul style="margin:4px 0; padding-left:18px;">
            ${sections.followup.items.map((t) => `<li>${t}</li>`).join('')}
          </ul>
          <div class="reminder-quote">💡 ${sections.followup.reminder}</div>
        </div>

        <div class="section-card">
          <h3>📘 本章情境與實驗室營業秘密自評表對照</h3>
          <table class="checklist-table">
            <thead>
              <tr>
                <th>遊戲片段</th>
                <th>對應自評表構面</th>
                <th>練習的關鍵行為</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>補齊當日實驗紀錄與更正比較</td>
                <td>實驗紀錄與資訊保存管理</td>
                <td>即時補齊日期、樣品編號、摘要與記錄人；更正錯誤時保留原內容並記錄原因、時間與更正人，避免無痕覆寫，原始檔維持原樣。</td>
              </tr>
              <tr>
                <td>原始檔歸檔與連結同步</td>
                <td>實驗紀錄與資訊保存管理／文件分級標示與存取管理</td>
                <td>將儀器原始量測檔移至受控團隊指定資料夾，並同步更新實驗紀錄中的原始檔連結，避免資料孤島或斷鏈。</td>
              </tr>
              <tr>
                <td>更新整批資料盤點清冊</td>
                <td>文件分級標示與存取管理</td>
                <td>以整批資料為單位建立清冊（名稱範圍、類型、保護原因、指定位置、負責人），不將機密技術細節寫入目錄清冊。</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pc-actions" style="justify-content:center; margin-top:14px;">
          <button class="pixel-btn primary" id="btn-replay-game" type="button">🔄 再玩一次第三章（體驗不同更正／歸檔結果）</button>
          <button class="pixel-btn" id="btn-handover-menu" type="button">🏠 返回章節選單</button>
        </div>
      `;

      $('btn-replay-game').onclick = () => {
        window.BS.Audio.confirm();
        closeAllModals();
        callbacks.onReplay();
      };
      $('btn-handover-menu').onclick = () => {
        window.BS.Audio.select();
        closeAllModals();
        callbacks.onReturnMenu();
      };
      return;
    }

    if (result.chapter === 3) {
      const { banner, sections } = result;
      $('handover-title').textContent = '📑 第四章交班紀錄 — 阿文的最後一天';
      $('handover-body').innerHTML = `
        <div class="ending-banner">
          <div class="ending-label">第四章「阿文的最後一天」離職交班紀錄</div>
          <h2>${banner.icon} ${banner.title}</h2>
          <p>${banner.desc}</p>
        </div>

        <div class="section-card">
          <h3>
            <span>1. 研究資料移交與接手人（小晴）確認</span>
            <span class="status-badge ${sections.transfer.badge.cls}">${sections.transfer.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.transfer.detail}</p>
          <div class="reminder-quote">💡 ${sections.transfer.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>2. 原專案權限終止與兩張圖限期授權</span>
            <span class="status-badge ${sections.access.badge.cls}">${sections.access.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.access.detail}</p>
          <div class="reminder-quote">💡 ${sections.access.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>3. 實體門禁、保密提醒與待辦事項</span>
            <span class="status-badge ${sections.compliance.badge.cls}">${sections.compliance.badge.text}</span>
          </h3>
          <ul style="margin:4px 0; padding-left:18px;">
            ${sections.compliance.items.map((t) => `<li>${t}</li>`).join('')}
          </ul>
          <div class="reminder-quote">💡 ${sections.compliance.reminder}</div>
        </div>

        <div class="section-card">
          <h3>📘 本章情境與實驗室營業秘密自評表對照</h3>
          <table class="checklist-table">
            <thead>
              <tr>
                <th>遊戲片段</th>
                <th>對應自評表構面</th>
                <th>練習的關鍵行為</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2F 紀錄移交與小晴實測</td>
                <td>離職與權限終止作業／文件分級標示與存取管理</td>
                <td>離職前將個人區資料移交至專案指定位置，並由接手人實際確認可開啟，避免僅由離任者持有。</td>
              </tr>
              <tr>
                <td>切換視角、停權與限期授權</td>
                <td>離職與權限終止作業</td>
                <td>離職當日取消原專案權限；仍有合作論文需求者，依核准範圍另行設定最小內容與明確期限之授權。</td>
              </tr>
              <tr>
                <td>1F 門禁收回與保密提醒</td>
                <td>離職與權限終止作業／實體環境與出入控管</td>
                <td>門禁憑證回收與電子權限分別管制登記，離職前再次確認保密約定並提醒攜出限制。</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pc-actions" style="justify-content:center; margin-top:14px;">
          <button class="pixel-btn primary" id="btn-replay-game" type="button">🔄 再玩一次第四章（挑戰其他路線）</button>
          <button class="pixel-btn" id="btn-handover-menu" type="button">🏠 返回章節選單</button>
        </div>
      `;

      $('btn-replay-game').onclick = () => {
        window.BS.Audio.confirm();
        closeAllModals();
        callbacks.onReplay();
      };
      $('btn-handover-menu').onclick = () => {
        window.BS.Audio.select();
        closeAllModals();
        callbacks.onReturnMenu();
      };
      return;
    }

    if (result.chapter === 2) {
      const { banner, sections } = result;
      $('handover-title').textContent = '📑 第二章交班紀錄 — 投稿前一晚';
      $('handover-body').innerHTML = `
        <div class="ending-banner">
          <div class="ending-label">第二章「投稿前一晚」值班紀錄</div>
          <h2>${banner.icon} ${banner.title}</h2>
          <p>${banner.desc}</p>
        </div>

        <div class="section-card">
          <h3>
            <span>1. 海報提交與決策結果</span>
            <span class="status-badge ${sections.route.badge.cls}">${sections.route.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.route.detail}</p>
          <div class="reminder-quote">💡 ${sections.route.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>2. 本次海報版本與確認狀態紀錄</span>
            <span class="status-badge ${sections.versions.badge.cls}">${sections.versions.badge.text}</span>
          </h3>
          <ul style="margin:4px 0; padding-left:18px;">
            ${sections.versions.lines.map((l) => `<li>${l}</li>`).join('')}
          </ul>
        </div>

        <div class="section-card">
          <h3>
            <span>3. 後續追蹤與待辦事項</span>
            <span class="status-badge ${sections.followup.badge.cls}">${sections.followup.badge.text}</span>
          </h3>
          <ul style="margin:4px 0; padding-left:18px;">
            ${sections.followup.items.map((t) => `<li>${t}</li>`).join('')}
          </ul>
          <div class="reminder-quote">💡 ${sections.followup.reminder}</div>
        </div>

        <div class="section-card">
          <h3>📘 本章情境與實驗室營業秘密管理對照</h3>
          <table class="checklist-table">
            <thead>
              <tr>
                <th>遊戲片段</th>
                <th>對應管理構面</th>
                <th>練習的關鍵行為</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>海報三圖檢查與換圖</td>
                <td>文件發表與外部合作管理</td>
                <td>對外公開前確認合作資料公開授權與專利申請安排，必要時改用核准替代圖或移除敏感圖表。</td>
              </tr>
              <tr>
                <td>版本比較與送審核准</td>
                <td>文件發表與外部合作管理／存取管理</td>
                <td>核准狀態綁定送審版本；核准後再修改須重新確認，提交前核對實際檔名與版本。</td>
              </tr>
              <tr>
                <td>誤傳聯絡主辦方並回報</td>
                <td>異常通報與改善追蹤</td>
                <td>發現誤傳未確認版本時立即提出撤換請求、向負責人回報，並持續追蹤公開狀態。</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pc-actions" style="justify-content:center; margin-top:14px;">
          <button class="pixel-btn primary" id="btn-replay-game" type="button">🔄 再玩一次第二章（挑戰其他路線）</button>
          <button class="pixel-btn" id="btn-handover-menu" type="button">🏠 返回章節選單</button>
        </div>
      `;

      $('btn-replay-game').onclick = () => {
        window.BS.Audio.confirm();
        closeAllModals();
        callbacks.onReplay();
      };
      $('btn-handover-menu').onclick = () => {
        window.BS.Audio.select();
        closeAllModals();
        callbacks.onReturnMenu();
      };
      return;
    }

    // Chapter 1 Handover
    $('handover-title').textContent = '📑 第一章值班交班紀錄 — 寄出之前';
    const { ending, unlockedCount, totalEndings, sections } = result;

    $('handover-body').innerHTML = `
      <div class="ending-banner">
        <div class="ending-label">第一章值班結束 · 結局已收錄 (${unlockedCount}/${totalEndings})</div>
        <h2>${ending.icon} ${ending.title}</h2>
        <p>${ending.desc}</p>
      </div>

      <div class="section-card">
        <h3>
          <span>1. 資料實際分享給誰？</span>
          <span class="status-badge ${sections.email.badge.cls}">${sections.email.badge.text}</span>
        </h3>
        <p style="margin:4px 0;">${sections.email.detail}</p>
        <div class="reminder-quote">💡 ${sections.email.reminder}</div>
      </div>

      <div class="section-card">
        <h3>
          <span>2. 訪客在哪裡拍攝？</span>
          <span class="status-badge ${sections.visitor.badge.cls}">${sections.visitor.badge.text}</span>
        </h3>
        <p style="margin:4px 0;">${sections.visitor.detail}</p>
        <div class="reminder-quote">💡 ${sections.visitor.reminder}</div>
      </div>

      <div class="section-card">
        <h3>
          <span>3. 是否有需要追蹤的事件？</span>
          <span class="status-badge ${sections.tracking.badge.cls}">${sections.tracking.badge.text}</span>
        </h3>
        <ul style="margin:4px 0; padding-left:18px;">
          ${sections.tracking.items.map((t) => `<li>${t}</li>`).join('')}
        </ul>
        <div class="reminder-quote">💡 ${sections.tracking.reminder}</div>
      </div>

      <div class="section-card">
        <h3>📘 本次情境與實驗室營業秘密自評表對照</h3>
        <table class="checklist-table">
          <thead>
            <tr>
              <th>遊戲片段</th>
              <th>對應自評表構面</th>
              <th>練習的關鍵行為</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>查核 NDA 並回覆來信</td>
              <td>文件分級標示與存取管理／文件發表與外部合作管理</td>
              <td>先確認廠商是否已簽署有效 NDA、效期與適用對象；再確認收件者、版本、連結權限與期限，僅提供必要資料並留存紀錄。</td>
            </tr>
            <tr>
              <td>接待與拍照</td>
              <td>實體環境與出入控管</td>
              <td>確認登記與用途、依核准範圍陪同；拍照前檢查白板、螢幕與樣品標籤。</td>
            </tr>
            <tr>
              <td>限制連結並通報</td>
              <td>異常通報與改善追蹤</td>
              <td>發現誤設公開權限時，立即停權止血並向阿明組長說明時間、資料、系統及現況。</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pc-actions" style="justify-content:center; margin-top:14px;">
        <button class="pixel-btn primary" id="btn-replay-game" type="button">🔄 再玩一次第一章</button>
        <button class="pixel-btn" id="btn-handover-gallery" type="button">🏆 結局圖鑑 (${unlockedCount}/${totalEndings})</button>
        <button class="pixel-btn" id="btn-handover-menu" type="button">🏠 返回章節選單</button>
      </div>
    `;

    $('btn-replay-game').onclick = () => {
      window.BS.Audio.confirm();
      closeAllModals();
      callbacks.onReplay();
    };
    $('btn-handover-gallery').onclick = () => {
      window.BS.Audio.select();
      closeAllModals();
      openEndingsModal();
    };
    $('btn-handover-menu').onclick = () => {
      window.BS.Audio.select();
      closeAllModals();
      callbacks.onReturnMenu();
    };
  }

  function bindStaticHandlers() {
    $('dialogue-box').addEventListener('click', () => {
      if (currentLine && (!currentLine.choices || currentLine.choices.length === 0 || typingTimer)) {
        advanceDialogue();
      }
    });
    $('btn-pc-close').addEventListener('click', () => {
      window.BS.Audio.cancel();
      closeAllModals();
    });
    $('btn-poster-close').addEventListener('click', () => {
      window.BS.Audio.cancel();
      closeAllModals();
    });
    $('btn-offboard-close').addEventListener('click', () => {
      window.BS.Audio.cancel();
      closeAllModals();
    });
    $('btn-record-close').addEventListener('click', () => {
      window.BS.Audio.cancel();
      closeAllModals();
    });
    $('btn-lookup-close').addEventListener('click', () => {
      window.BS.Audio.cancel();
      closeAllModals();
    });
    $('btn-cam-close').addEventListener('click', () => {
      window.BS.Audio.cancel();
      closeAllModals();
    });
    $('btn-clues-close').addEventListener('click', () => {
      window.BS.Audio.cancel();
      closeAllModals();
    });
    $('btn-endings-close').addEventListener('click', () => {
      window.BS.Audio.cancel();
      closeAllModals();
    });
    $('btn-pause-close').addEventListener('click', () => {
      window.BS.Audio.cancel();
      closeAllModals();
    });
    $('btn-handover-close').addEventListener('click', () => {
      window.BS.Audio.cancel();
      closeAllModals();
      if (lastClearContext) {
        openClearScreen(lastClearContext.result, lastClearContext.callbacks);
      }
    });
  }

  window.BS.UI = {
    bindStaticHandlers,
    isOverlayOpen,
    getActiveModal: () => activeModal,
    closeDialogue,
    closeAllModals,
    showToast,
    startDialogue,
    advanceDialogue,
    handleDialogueKey,
    setTitleCursor,
    moveTitleCursor,
    confirmTitleCursor,
    openPauseModal,
    movePauseCursor,
    confirmPauseCursor,
    openClearScreen,
    renderClearFx,
    openComputerModal,
    openPosterModal,
    openOffboardModal,
    openRecordModal,
    openLookupModal,
    openCameraModal,
    openCluesModal,
    openEndingsModal,
    openHandoverModal
  };
})();
