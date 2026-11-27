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
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    let text = msg;
    if (isEn && window.BS.I18n && window.BS.I18n.translateToast) {
      text = window.BS.I18n.translateToast(msg);
    }
    el.textContent = text;
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
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    let speaker = currentLine.speaker || '';
    if (isEn) {
      if (currentLine.speaker_en) {
        speaker = currentLine.speaker_en;
      } else if (window.BS.I18n && window.BS.I18n.translateSpeaker) {
        speaker = window.BS.I18n.translateSpeaker(speaker);
      }
    }
    $('dialogue-speaker').textContent = speaker;
    $('dialogue-text').textContent = '';
    $('dialogue-choices').innerHTML = '';
    $('dialogue-choices').classList.add('hidden');
    $('dialogue-next-hint').classList.add('hidden');
    if (window.BS && window.BS.I18n) {
      $('dialogue-next-hint').textContent = window.BS.I18n.t('dialogueNextHint');
    }

    const portraitWrap = $('dialogue-portrait-wrap');
    if (currentLine.portrait) {
      portraitWrap.classList.remove('hidden');
      window.BS.Sprites.drawPortrait($('portrait-canvas'), currentLine.portrait);
    } else {
      portraitWrap.classList.add('hidden');
    }

    let fullText = currentLine.text || '';
    if (isEn) {
      if (currentLine.text_en) {
        fullText = currentLine.text_en;
      } else if (window.BS.I18n && window.BS.I18n.translateDialogue) {
        fullText = window.BS.I18n.translateDialogue(fullText);
      }
    }
    typedIndex = 0;

    typingTimer = setInterval(() => {
      typedIndex += isEn ? 4 : 2;
      if (typedIndex >= fullText.length) {
        finishTyping();
      } else {
        $('dialogue-text').textContent = fullText.slice(0, typedIndex);
        if (typedIndex % (isEn ? 8 : 6) === 0) {
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
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    let fullText = currentLine.text || '';
    if (isEn) {
      if (currentLine.text_en) {
        fullText = currentLine.text_en;
      } else if (window.BS.I18n && window.BS.I18n.translateDialogue) {
        fullText = window.BS.I18n.translateDialogue(fullText);
      }
    }
    $('dialogue-text').textContent = fullText;

    if (currentLine.choices && currentLine.choices.length > 0) {
      renderChoices(currentLine.choices);
    } else {
      $('dialogue-next-hint').classList.remove('hidden');
    }
  }

  function renderChoices(choices) {
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const container = $('dialogue-choices');
    container.innerHTML = '';
    selectedChoice = 0;
    choices.forEach((ch, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn' + (idx === 0 ? ' selected' : '');
      let label = ch.label;
      if (isEn) {
        if (ch.label_en) {
          label = ch.label_en;
        } else if (window.BS.I18n && window.BS.I18n.translateChoice) {
          label = window.BS.I18n.translateChoice(label);
        }
      }
      btn.innerHTML = `<span class="choice-arrow">${idx === 0 ? '▶' : ''}</span><span>${label}</span>`;
      if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        btn.addEventListener('mouseenter', () => updateChoiceHighlight(idx));
      }
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
      'marking-modal',
      'offboard-modal',
      'record-modal',
      'lookup-modal',
      'camera-modal',
      'clues-modal',
      'endings-modal',
      'characters-modal',
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
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const chLabel =
      state.chapter === 3
        ? (isEn ? 'Chapter 5: A-Wen\'s Last Day' : '第五章「阿文的最後一天」')
        : state.chapter === 4
        ? (isEn ? 'Chapter 4: Should These Records Be Inventoried?' : '第四章「這批資料要列入清單嗎？」')
        : state.chapter === 5
        ? (isEn ? 'Chapter 3: How to Label This Document?' : '第三章「這份文件要怎麼標？」')
        : state.chapter === 2
        ? (isEn ? 'Chapter 2: The Night Before Submission' : '第二章「投稿前一晚」')
        : (isEn ? 'Chapter 1: Before Sending' : '第一章「寄出之前」');
    const muted = window.BS.Audio.isMuted();

    const menuItems = [
      {
        label: isEn ? 'Resume Game' : '繼續遊戲',
        action: () => {
          window.BS.Audio.confirm();
          closeAllModals();
        }
      },
      {
        label: isEn ? '📋 Duty Notes & Progress (SELECT)' : '📋 值班筆記與任務進度（SELECT）',
        action: () => {
          window.BS.Audio.select();
          closeAllModals();
          openCluesModal(state);
        }
      },
      {
        label: muted
          ? (isEn ? '🔇 Sound: Muted (Press to Unmute)' : '🔇 音效：關閉（按確認開啟）')
          : (isEn ? '🔊 Sound: On (Press to Mute)' : '🔊 音效：開啟（按確認靜音）'),
        action: () => {
          const nowMuted = window.BS.Audio.toggleMute();
          if (!nowMuted) window.BS.Audio.select();
          openPauseModal(state, zoneName, callbacks);
          setPauseCursor(2);
        }
      },
      {
        label: isEn ? '🌐 Switch to 繁體中文' : '🌐 切換語言 / Switch to English',
        action: () => {
          window.BS.Audio.select();
          if (window.BS && window.BS.I18n) {
            window.BS.I18n.setLang(isEn ? 'zh' : 'en');
          }
          openPauseModal(state, zoneName, callbacks);
          setPauseCursor(3);
        }
      },
      {
        label: isEn ? '🔄 Restart Current Chapter' : '🔄 重新開始本章',
        action: () => {
          window.BS.Audio.confirm();
          closeAllModals();
          callbacks.onRestart();
        }
      },
      {
        label: isEn ? '🏠 Return to Title Menu' : '🏠 返回首頁章節選單',
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
      <div style="margin-top:8px; text-align:center; font-size:11px; color:#5b6476;">
        ${isEn ? '↑↓ Select · A / Enter Confirm · START / B Resume' : '↑↓ 選擇 · A / Enter 確認 · START / B 繼續遊戲'}
      </div>
    `;

    $('pause-body').querySelectorAll('.cursor-menu-item').forEach((btn) => {
      const idx = Number(btn.dataset.pidx);
      if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        btn.addEventListener('mouseenter', () => {
          setPauseCursor(idx);
          window.BS.Audio.select();
        });
      }
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

    const cw = canvas.width;
    const ch = canvas.height;

    clearFxParticles.forEach((p, idx) => {
      p.x += p.vx + Math.sin(tick * 0.05 + idx) * 0.25;
      p.y += p.vy;
      if (p.y > ch + 4) {
        p.y = -6;
        p.x = Math.random() * cw;
      }
      if (p.x < -6) p.x = cw + 4;
      if (p.x > cw + 6) p.x = -4;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    });
  }

  function openClearScreen(result, callbacks) {
    activeModal = 'clear';
    lastClearContext = { result, callbacks };
    $('clear-screen').classList.remove('hidden');

    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const isCh2 = result.chapter === 2;
    const isCh5 = result.chapter === 5;
    const isCh4 = result.chapter === 4;
    const isCh3 = result.chapter === 3;
    let isWarn = false;
    let rank = 'S';
    let kicker = isCh3
      ? '★ CHAPTER 5 CLEAR! ★'
      : isCh4
      ? '★ CHAPTER 4 CLEAR! ★'
      : isCh5
      ? '★ CHAPTER 3 CLEAR! ★'
      : isCh2
      ? '★ CHAPTER 2 CLEAR! ★'
      : '★ CHAPTER 1 CLEAR! ★';
    let headline = isEn
      ? (isCh3
          ? 'Congratulations on completing Chapter 5: "A-Wen\'s Last Day"!'
          : isCh4
          ? 'Congratulations on completing Chapter 4: "Include in Inventory?"!'
          : isCh5
          ? 'Congratulations on completing Chapter 3: "How to Label this Document?"!'
          : isCh2
          ? 'Congratulations on completing Chapter 2: "Night Before Submission"!'
          : 'Congratulations on completing Chapter 1: "Before Sending"!')
      : (isCh3
          ? '恭喜完成第五章「阿文的最後一天」！'
          : isCh4
          ? '恭喜完成第四章「這批資料要列入清單嗎？」！'
          : isCh5
          ? '恭喜完成第三章「這份文件要怎麼標？」！'
          : isCh2
          ? '恭喜完成第二章「投稿前一晚」！'
          : '恭喜完成第一章「寄出之前」！');
    let icon = '🏆';
    let title = '';
    let desc = '';
    let extraNote = '';

    if (isCh5) {
      icon = result.banner.icon;
      title = result.banner.title;
      desc = result.banner.desc;
      if (result.hasRisk) {
        isWarn = true;
        rank = '!';
        kicker = isEn ? '⚠ CHAPTER 3 ENDED · Incomplete Labeling' : '⚠ CHAPTER 3 ENDED · 標示尚未完備';
        headline = isEn ? 'Chapter 3 Ended (Unlabeled Documents Remain)' : '第三章結束（尚有未標示文件）';
        extraNote = isEn
          ? 'Review the handover notes to identify omitted markings, then replay to complete full labeling and handover!'
          : '查看交班紀錄確認哪些文件標示有缺漏，再挑戰一次完整標示與小晴交接！';
      } else {
        rank = 'S';
        extraNote = isEn
          ? 'All 3 documents accurately labeled; Xiao-Qing knows custody rules: "Markings guide custody; verify recipient and rights before sharing"!'
          : '三份文件標示精準到位，小晴清楚保管作為，牢記「標示讓接手人知道怎麼處理，分享前仍要確認對象及權限」！';
      }
    } else if (isCh4) {
      icon = result.banner.icon;
      title = result.banner.title;
      desc = result.banner.desc;
      if (result.hasRisk) {
        isWarn = true;
        rank = '!';
        kicker = isEn ? '⚠ CHAPTER 4 ENDED · Inventory Gaps Remain' : '⚠ CHAPTER 4 ENDED · 盤點清冊尚有缺口';
        headline = isEn ? 'Chapter 4 Ended (Inventory Gaps Remain)' : '第四章結束（盤點清冊尚有缺口）';
        extraNote = isEn
          ? 'Handover notes highlight areas needing inventory updates. Replay to achieve a complete inventory!'
          : '交班紀錄已標示出清單或更新的待補強環節，歡迎查看紀錄後再挑戰一次完整歸檔！';
      } else {
        rank = 'S';
        extraNote = isEn
          ? 'R&D inventory fully verified with Xiao-Qing; ready for tomorrow\'s audit!'
          : '已與同事小晴完整核對研發成果清單，明天的盤點作業萬無一失！';
      }
    } else if (isCh3) {
      icon = result.banner.icon;
      title = result.banner.title;
      desc = result.banner.desc;
      if (result.hasRisk) {
        isWarn = true;
        rank = '!';
        kicker = isEn ? '⚠ CHAPTER 5 ENDED · Pending Offboarding Tasks' : '⚠ CHAPTER 5 ENDED · 尚有未完成待辦';
        headline = isEn ? 'Chapter 5 Ended (Permissions or Tasks Pending)' : '第五章結束（留下權限或交接待辦）';
        extraNote = isEn
          ? 'Handover notes detail pending items and overbroad permissions. Review the log and replay for full completion!'
          : '交班清單已詳細列出所有未完成與權限過廣項目，歡迎查看紀錄後再挑戰一次完整交接！';
      } else if (result.sections.transfer && result.sections.transfer.badge && result.sections.transfer.badge.cls === 'warn') {
        rank = 'A';
        extraNote = isEn
          ? 'Successfully remediated file transfer via admin privileges without restoring broad access. Solid offboarding!'
          : '成功透過管理員補救移交指定檔案，未恢復整包原權限，穩健完成離職交接！';
      } else {
        rank = 'S';
        extraNote = isEn
          ? 'Dual-floor research handover, Xiao-Qing verified, access revoked, time-limited grant configured, badge returned. Exemplary!'
          : '跨樓層完成研究交接、小晴實測確認、權限終止、限期授權與 1F 門禁收回，滿分典範！';
      }
    } else if (isCh2) {
      icon = result.banner.icon;
      title = result.banner.title;
      desc = result.banner.desc;
      if (result.sections.route.badge.cls === 'danger') {
        isWarn = true;
        rank = '!';
        kicker = isEn ? '⚠ CHAPTER 2 ENDED · Remediation Pending' : '⚠ CHAPTER 2 ENDED · 尚有未補救項目';
        headline = isEn ? 'Chapter 2 Ended (Residual Risks Pending)' : '第二章結束（留下風險待處理）';
        extraNote = isEn
          ? 'That is the value of scenario practice! Review the handover log and try again for full remediation or approved submission!'
          : '沒關係，這正是情境練習的價值！看看交班紀錄，再挑戰一次完整補救或核准提交吧！';
      } else if (result.sections.route.badge.cls === 'warn') {
        rank = 'A';
        extraNote = isEn
          ? 'Handled risk and uncertainty with prudence; clear follow-up tracking log recorded!'
          : '穩健面對風險與不確定性，已留下清楚的追蹤紀錄！';
      } else {
        rank = 'S';
        extraNote = isEn
          ? 'Flawless verification of rights, version lock-in, and filenames. Successfully submitted conference poster!'
          : '完美核對授權、版本綁定與檔名，穩妥完成研討會海報投稿！';
      }
    } else {
      icon = result.ending.icon;
      title = (isEn && result.ending.title_en) ? result.ending.title_en : result.ending.title;
      desc = (isEn && result.ending.desc_en) ? result.ending.desc_en : result.ending.desc;
      extraNote = isEn
        ? `Chapter 1 Endings Gallery unlocked: ${result.unlockedCount} / ${result.totalEndings}`
        : `第一章結局圖鑑已收錄：${result.unlockedCount} / ${result.totalEndings}`;
      if (result.ending.id === 'alarm_handover') {
        isWarn = true;
        rank = '!';
        kicker = isEn ? '⚠ CHAPTER 1 ENDED · Handover Alarm' : '⚠ CHAPTER 1 ENDED · 交班警報';
        headline = isEn ? 'Chapter 1 Ended (Data Leak Risk Remains)' : '第一章結束（仍有外洩風險）';
        extraNote = isEn
          ? `Games provide safe places to learn from mistakes! Review handover notes and replay for other endings! (Unlocked ${result.unlockedCount}/${result.totalEndings})`
          : `沒關係，遊戲就是用來安全試錯的！查看交班紀錄了解風險，再重玩挑戰其他結局吧！（已收錄 ${result.unlockedCount}/${result.totalEndings}）`;
      } else if (result.ending.id === 'flawless') {
        rank = 'S';
      } else {
        rank = 'A';
      }
    }

    initClearFx(isWarn);

    const nextChNum = isCh3 ? 1 : isCh4 ? 3 : isCh5 ? 4 : isCh2 ? 5 : 2;
    const nextChLabel = isEn
      ? (isCh3
          ? '▶ Replay Chapter 1 "Before Sending"'
          : isCh4
          ? '▶ Continue to Chapter 5 "A-Wen\'s Last Day"'
          : isCh5
          ? '▶ Continue to Chapter 4 "Include in Inventory?"'
          : isCh2
          ? '▶ Continue to Chapter 3 "How to Label this Document?"'
          : '▶ Continue to Chapter 2 "Night Before Submission"')
      : (isCh3
          ? '▶ 重溫第一章「寄出之前」'
          : isCh4
          ? '▶ 繼續挑戰第五章「阿文的最後一天」'
          : isCh5
          ? '▶ 繼續挑戰第四章「這批資料要列入清單嗎？」'
          : isCh2
          ? '▶ 繼續挑戰第三章「這份文件要怎麼標？」'
          : '▶ 繼續挑戰第二章「投稿前一晚」');
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
        <button class="pixel-btn primary" id="btn-clear-handover" type="button">${isEn ? '📑 View Full Handover Notes & Self-Assessment' : '📑 查看完整交班紀錄與自評表對照'}</button>
        <div class="clear-actions-row">
          <button class="pixel-btn warn" id="btn-clear-next-ch" type="button">${nextChLabel}</button>
          <button class="pixel-btn" id="btn-clear-replay" type="button">${isEn ? '🔄 Replay Chapter' : '🔄 再玩一次本章'}</button>
          <button class="pixel-btn" id="btn-clear-menu" type="button">${isEn ? '🏠 Return to Menu' : '🏠 返回首頁選單'}</button>
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

    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const pcTitle = $('pc-title');
    if (pcTitle) {
      pcTitle.textContent = isEn ? '💻 2F Duty PC — Email, NDA Verification & Cloud Share' : '💻 2F 值班電腦 — 郵件、NDA 查核與雲端分享';
    }
    const pcClose = $('btn-pc-close');
    if (pcClose) {
      pcClose.setAttribute('aria-label', isEn ? 'Close PC' : '關閉電腦');
    }

    let selectedPayload = state.clues.meetingVersion ? 'charts_only' : 'full_folder';
    let selectedPerm = state.clues.ndaScope ? 'restricted_7d' : 'public_link';
    let showNdaRegistry = false;
    let ndaQuizFeedback = '';

    function render() {
      const e = state.email;
      const body = $('pc-body');
      const prevScrollTop = body ? body.scrollTop : 0;

      // Case 1: Active mis-share needing revocation!
      if (e.misshared && !e.linkRevoked) {
        const isFull = e.sentPayload === 'full_folder';
        body.innerHTML = `
          <div class="pc-card" style="border-color:#d95d4c; background:#fff7f6;">
            <h3 style="color:#9e1f1f;">${isEn ? '🚨 New Email Alert: From Ms. Su, Starlight Tech (Urgent)' : '🚨 新郵件通知：來自 星海科技 蘇小姐（急件）'}</h3>
            <div class="email-meta">${isEn ? `From: su@starlight-tech.example | Time: ${window.BS.State.formatClock(state.timeMinutes)}` : `寄件者：su@starlight-tech.example ｜ 時間：${window.BS.State.formatClock(state.timeMinutes)}`}</div>
            <div class="email-content urgent">
              ${
                isEn
                  ? (isFull
                      ? '“Hello Xiao-An, received the link! Opening it up, I noticed that beyond the two figures, there are raw measurement data and process notes.<br>One of our external subcontractors will join the call shortly, <strong>can we forward this link directly to them as well?</strong>”'
                      : '“Hello Xiao-An, received the link! It is so convenient that anyone can open it without logging in!<br>Our external subcontractor is joining the call shortly, <strong>should I forward the link directly to them?</strong>”')
                  : (isFull
                      ? '「小安您好，收到連結了！點進去發現裡面除了兩張圖之外，還有原始量測數據和製程筆記。<br>我們有一家外部協力廠商等等也會進線，<strong>請問這個連結可以直接轉給協力廠商一起看嗎？</strong>」'
                      : '「小安您好，收到連結了！這個連結免登入誰都能開好方便喔！<br>我們有一家外部協力廠商等等也會進線，<strong>我就直接把連結轉給協力廠商一起看囉？</strong>」')
              }
            </div>
            <p style="margin:6px 0; font-size:13px;">
              <strong>${isEn ? 'Current Cloud Share Status:' : '目前雲端分享狀態：'}</strong>
              <span class="file-tag secret">${e.sentPermission === 'public_link' ? (isEn ? '⚠ Anyone with link can access (Public link active)' : '⚠ 持連結者皆可存取（公開連結啟用中）') : (isEn ? '⚠ Files exceeding authorized scope shared' : '⚠ 超出授權範圍之檔案分享中')}</span><br>
              ${isEn ? 'Files Included: ' : '涵蓋檔案：'}${isFull ? (isEn ? 'StarSky_TestData full folder (contains RAW data & unreviewed process notes)' : 'StarSky_TestData 全資料夾（含 RAW 原始數據與未審製程筆記）') : (isEn ? 'StarSky_Meeting_Summary_Figs_v2 (access unrestricted)' : 'StarSky_會議用摘要圖_v2（但連結未限制存取對象）')}
            </p>
            <div class="pc-actions">
              <button class="pixel-btn danger" id="pc-revoke-btn" type="button">${isEn ? '🔒 Revoke / Restrict Link Access Now' : '🔒 立即停用／限制連結存取'}</button>
              <button class="pixel-btn" id="pc-later-btn" type="button">${isEn ? 'Close Window for Now' : '先關閉視窗'}</button>
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
            ? (isEn ? 'Designated recipient (Ms. Su) Read-only · 7-day expiration' : '僅限指定收件人（蘇小姐）唯讀・7 天效期')
            : e.sentPermission === 'restricted_noexp'
            ? (isEn ? 'Designated recipient (Ms. Su) Read-only · No expiration' : '僅限指定收件人（蘇小姐）唯讀・無期限')
            : (isEn ? 'Original public link revoked' : '原公開連結已停用');

        body.innerHTML = `
          <div class="pc-card">
            <h3>${isEn ? '📨 Email & Share Records' : '📨 郵件與分享紀錄'}</h3>
            <div class="email-meta">${isEn ? 'Recipient: Ms. Su, Project Contact, Starlight Tech' : '收件人：星海科技 專案窗口 蘇小姐'}</div>
            ${
              e.misshared
                ? `<div class="email-content urgent">
                    <strong>${isEn ? 'Remediation Executed:' : '已執行止血：'}</strong>${isEn ? ' The misconfigured public link for <code>StarSky_TestData</code> has been revoked.' : '原本誤設為公開存取的 <code>StarSky_TestData</code> 連結已停用。'}<br>
                    <strong>${isEn ? 'Report Status:' : '通報狀態：'}</strong>${e.reportedToLead ? (isEn ? '✅ Incident reported to Team Lead A-Ming (including 4 essential elements)' : '✅ 已向阿明組長完成異常通報（含四要素）') : (isEn ? '⚠ Not yet reported to Team Lead A-Ming! Please report to him immediately.' : '⚠ 尚未向負責人阿明組長通報！請盡快找阿明組長回報。')}
                    ${e.sentSafeAfterFix ? (isEn ? '<br><strong>Follow-up Resend:</strong> ✅ Approved 2 meeting figures resent (restricted recipient, 7-day expiration).' : '<br><strong>後續補寄：</strong>✅ 已改寄核准的會議用兩張圖（限定收件人、7天效期）。') : ''}
                  </div>`
                : `<div class="email-content">
                    <strong>${isEn ? 'Files Sent:' : '已寄出檔案：'}</strong>${isEn ? 'StarSky_Meeting_Summary_Figs_v2 (Fig A & Fig B only)' : 'StarSky_會議用摘要圖_v2（僅圖A、圖B）'}<br>
                    <strong>${isEn ? 'Permission Setting:' : '權限設定：'}</strong>${permLabel}<br>
                    <strong>${isEn ? 'NDA Verification:' : '保密約定核對：'}</strong>${e.sentWithNdaCheck ? (isEn ? '✅ Verified NDA-CS-2026 scope with Team Lead A-Ming' : '✅ 已由阿明組長確認 NDA-CS-2026 涵蓋範圍') : (isEn ? '⚠ Sent without verifying NDA scope' : '⚠ 寄出前未確認 NDA 涵蓋範圍')}
                  </div>`
            }
            <div class="pc-actions">
              ${
                e.misshared && e.linkRevoked && !e.sentSafeAfterFix && state.clues.meetingVersion && state.clues.ndaScope
                  ? `<button class="pixel-btn primary" id="pc-resend-safe" type="button">${isEn ? '📤 Resend Approved 2 Figures (Restricted)' : '📤 補寄核准的兩張會議圖（限定權限）'}</button>`
                  : ''
              }
              <button class="pixel-btn" id="pc-done-close" type="button">${isEn ? 'Close PC' : '關閉電腦'}</button>
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
            <h3>${isEn ? '📑 External Partner Non-Disclosure Agreement (NDA) Registry' : '📑 實驗室外部合作 NDA（保密協議）簽署清單'}</h3>
            <p style="margin:0 0 8px; font-size:12.5px; color:#4b576d;">
              ${isEn ? 'Before sharing research data with external partners, verify whether an NDA is <strong>signed, currently valid, and its covered parties and data scope</strong>.' : '與外部廠商交流研究資料前，請先確認對方<strong>是否已簽署 NDA、是否仍在效期內，以及涵蓋的對象與資料範圍</strong>。'}
            </p>
            <table class="checklist-table">
              <thead>
                <tr>
                  <th>${isEn ? 'External Partner' : '外部廠商'}</th>
                  <th>${isEn ? 'NDA Status & Validity' : 'NDA 簽署狀態與效期'}</th>
                  <th>${isEn ? 'Covered Parties & Data Scope' : '涵蓋對象與資料範圍'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${isEn ? 'Morning Light Photonics' : '晨曦光電'}</strong></td>
                  <td><span class="status-badge danger">${isEn ? 'Not Signed' : '未簽署'}</span><br>${isEn ? 'Preliminary talks' : '尚在初步洽談'}</td>
                  <td>${isEn ? 'No NDA signed. Prohibited from disclosing any confidential or undisclosed test data.' : '尚未簽署保密協議，禁止提供任何機密或未公開測試資料。'}</td>
                </tr>
                <tr style="background:#f3fbf7;">
                  <td><strong>${isEn ? 'Starlight Tech' : '星海科技'}</strong><br><span style="font-size:11px;color:#475569;">${isEn ? 'StarSky Project' : '星空計畫'}</span></td>
                  <td><span class="status-badge ok">${isEn ? 'Signed & Active' : '已簽署有效'}</span><br><code>NDA-CS-2026</code><br>2026/01/01～2027/12/31</td>
                  <td>${isEn ? 'Restricted to Starlight Tech contact (Ms. Su) for progress meeting using "Approved Summary Charts"; <strong>excludes raw data, process notes, and subcontractor forwarding</strong>.' : '限星海科技專案窗口（蘇小姐）於階段進度會議使用「核准摘要圖表」；<strong>不含原始量測數據、製程筆記，且未授權轉傳協力廠商</strong>。'}</td>
                </tr>
                <tr>
                  <td><strong>${isEn ? 'FarVoyage Precision' : '遠航精密'}</strong></td>
                  <td><span class="status-badge warn">${isEn ? 'Expired' : '已到期'}</span><br><code>NDA-YH-2024</code><br>${isEn ? 'Expired 2025/12/31' : '2025/12/31 屆滿'}</td>
                  <td>${isEn ? 'Agreement expired. Must renew before sharing further research data.' : '原合約已過期，須完成續簽後才可再提供研究資料。'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pc-card">
            <h3>${isEn ? '✅ NDA Verification Check' : '✅ NDA 簽署核對確認'}</h3>
            ${
              state.clues.ndaScope
                ? `<div class="inline-ok-box">${isEn ? '✅ You have completed the Starlight Tech NDA check (NDA-CS-2026 active, Ms. Su only, 2 meeting summary figures).' : '✅ 你已完成星海科技 NDA 簽署查核（NDA-CS-2026 有效，僅限蘇小姐檢視兩張會議摘要圖）。'}</div>`
                : `
                  <p style="margin:0 0 8px; font-size:13px;">
                    ${isEn ? 'Based on the registry above, Ms. Su from Starlight Tech requested test data today. Which judgment is correct?' : '依上方清單，星海科技蘇小姐今天來信索取測試資料，以下哪一項判斷正確？'}
                  </p>
                  ${ndaQuizFeedback ? `<div class="inline-warning-box">${ndaQuizFeedback}</div>` : ''}
                  <div style="display:flex; flex-direction:column; gap:6px;">
                    <button class="choice-btn" id="nda-opt-ok" type="button">
                      <span class="choice-arrow">▶</span>
                      <span>${isEn ? 'Starlight Tech has an active NDA-CS-2026 (in validity), but it only allows Ms. Su to view meeting summary figures—no raw data or subcontractor forwarding.' : '星海科技已簽署有效 NDA-CS-2026（在效期內），但僅限蘇小姐看會議用摘要圖，不可提供原始數據或轉傳協力廠商。'}</span>
                    </button>
                    <button class="choice-btn" id="nda-opt-over" type="button">
                      <span class="choice-arrow">▶</span>
                      <span>${isEn ? 'As long as an NDA was signed, the entire test folder can be sent and forwarded to subcontractors.' : '只要廠商有簽過 NDA，就能把整個測試資料夾直接寄出並讓對方轉給協力廠商。'}</span>
                    </button>
                    <button class="choice-btn" id="nda-opt-expired" type="button">
                      <span class="choice-arrow">▶</span>
                      <span>${isEn ? 'Starlight Tech\'s NDA has expired, so no files can be provided today.' : '星海科技的 NDA 已經到期，所以今天完全不能提供任何檔案。'}</span>
                    </button>
                  </div>
                `
            }
          </div>

          <div class="pc-actions">
            <button class="pixel-btn" id="btn-nda-back" type="button">${isEn ? '← Back to Email & Share Settings' : '← 返回郵件與分享設定'}</button>
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
            ndaQuizFeedback = isEn
              ? '⚠ Incorrect! Signing an NDA does not mean all data can be shared. NDA-CS-2026 only covers "Meeting Summary Charts" for "Ms. Su", excluding raw data, process notes, and subcontractors!'
              : '⚠ 不對喔！有簽 NDA 不代表全部資料都能給。NDA-CS-2026 僅涵蓋「會議用摘要圖表」給「蘇小姐」，不含原始量測數據、製程筆記與協力廠商！';
            render();
          };
          $('nda-opt-expired').onclick = () => {
            window.BS.Audio.alert();
            ndaQuizFeedback = isEn
              ? '⚠ Wrong partner! "FarVoyage Precision (NDA-YH-2024)" is expired. Starlight Tech\'s NDA-CS-2026 is valid until 2027/12/31, so it is still active.'
              : '⚠ 看錯廠商囉！已到期的是「遠航精密（NDA-YH-2024）」，星海科技的 NDA-CS-2026 效期至 2027/12/31，仍在有效期間內。';
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
        previewHtml = isEn
          ? `<strong>👁 Recipient Perspective Preview:</strong> Anyone with the link (including forwarded subcontractors) can open and download <strong>4 files</strong>, including <code>Raw Measurement Data</code> and <code>Unreviewed Process Notes</code>!${missingNda ? ' <strong>And you have not verified if partner signed an active NDA!</strong>' : ''}`
          : `<strong>👁 收件人視角預覽：</strong>任何取得連結的人（包含被轉傳的協力廠商）都能開啟並下載 <strong>4 個檔案</strong>，內含 <code>原始量測數據</code> 與 <code>未審製程筆記</code>！${missingNda ? ' <strong>且你尚未確認廠商是否簽署有效 NDA！</strong>' : ''}`;
      } else if (isPublic && !isFull) {
        previewHtml = isEn
          ? `<strong>👁 Recipient Perspective Preview:</strong> Although limited to 2 meeting figures, the link is set to "Anyone with link can access". If forwarded to unauthorized parties, they can open it directly!`
          : `<strong>👁 收件人視角預覽：</strong>雖然只有兩張會議圖，但連結設為「持連結者皆可存取」，若遭轉傳給非授權對象仍可直接開啟！`;
      } else if (!isPublic && isFull) {
        previewHtml = isEn
          ? `<strong>👁 Recipient Perspective Preview:</strong> Only Ms. Su can open it, but the folder still contains <code>Raw Measurement Data</code> and <code>Unreviewed Process Notes</code> that exceed meeting needs!`
          : `<strong>👁 收件人視角預覽：</strong>僅蘇小姐可開啟，但資料夾仍包含超出會議需求的 <code>原始量測數據</code> 與 <code>未審製程筆記</code>！`;
      } else if (missingNda) {
        previewHtml = isEn
          ? `<strong>👁 Recipient Perspective Preview:</strong> Scope is limited to 2 meeting figures for Ms. Su, but <strong>you have not verified if Starlight Tech has an active NDA</strong>! Please check "📑 Check Lab NDA Registry" above or ask Lead.`
          : `<strong>👁 收件人視角預覽：</strong>檔案已限縮為 2 張會議圖且指定蘇小姐，但<strong>尚未確認星海科技是否已簽署有效 NDA</strong>！請先按上方「📑 查詢 NDA 合約清單」或詢問阿明組長。`;
      } else {
        previewHtml = isEn
          ? `<strong>👁 Recipient Perspective Preview:</strong> Active NDA-CS-2026 confirmed; only Ms. Su can read-only view <strong>2 approved meeting figures</strong>${selectedPerm === 'restricted_7d' ? ', automatically expiring in 7 days' : ' (no expiration set)'}.`
          : `<strong>👁 收件人視角預覽：</strong>已確認有效 NDA-CS-2026；僅星海科技蘇小姐可唯讀檢視 <strong>2 張已核准會議圖</strong>${selectedPerm === 'restricted_7d' ? '，且 7 天後自動失效' : '（未設定到期日）'}。`;
      }

      const ndaStatusBar = state.clues.ndaScope
        ? `<div class="inline-ok-box" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span>${isEn ? '<strong>✅ NDA Check Passed:</strong> Starlight Tech signed active <code>NDA-CS-2026</code> (Ms. Su only | Meeting figures only; no raw data or subcontractors)' : '<strong>✅ NDA 簽署查核通過：</strong>星海科技已簽署有效 <code>NDA-CS-2026</code>（限蘇小姐｜僅會議摘要圖，不含原始數據與協力廠商）'}</span>
            <button class="pixel-btn" id="btn-open-nda-list" type="button" style="padding:4px 10px; font-size:12px;">${isEn ? '📑 View NDA Registry' : '📑 檢視 NDA 清單'}</button>
          </div>`
        : `<div class="inline-warning-box" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span>${isEn ? '<strong>❓ Step 0 — NDA Verification:</strong> Have not verified if Starlight Tech has an active Non-Disclosure Agreement (NDA) and its scope!' : '<strong>❓ 步驟 0 — NDA 簽署查核：</strong>尚未確認「星海科技」是否已簽署有效 NDA（保密協議）與適用範圍！'}</span>
            <button class="pixel-btn warn" id="btn-open-nda-list" type="button" style="padding:5px 10px; font-size:12px;">${isEn ? '📑 Check Lab NDA Registry' : '📑 查詢實驗室 NDA 合約清單'}</button>
          </div>`;

      body.innerHTML = `
        ${ndaStatusBar}
        <div class="pc-scroll-hint-bar" id="pc-scroll-hint-top" role="button" tabindex="0">
          <span class="scroll-arrow">⬇</span>
          <span>${isEn ? 'Scroll down below to configure share settings & send' : '請往下捲動以設定分享範圍、權限與寄出'}</span>
          <span class="scroll-arrow">⬇</span>
        </div>
        <div class="pc-grid">
          <div class="pc-card">
            <h3>${isEn ? '✉ Partner Email (4:00 PM Meeting Urgent)' : '✉ 合作方來信（四點會議急件）'}</h3>
            <div class="email-meta">${isEn ? 'From: Ms. Su, Starlight Tech | Subject: StarSky Project 16:00 Meeting Materials' : '寄件者：星海科技 蘇小姐 ｜ 主旨：星空計畫 16:00 會議資料'}</div>
            <div class="email-content">
              ${isEn ? '“Hello Xiao-An, our progress meeting is at 4:00 PM! Please share a link for the entire <strong>StarSky_TestData folder</strong>. We only need to view the <strong>two result figures</strong> for the meeting, thanks!”' : '「小安您好，四點就要開進度會議了！麻煩把 <strong>StarSky_TestData 整個測試資料夾</strong>設成連結寄給我，我們開會只需要看裡面<strong>兩張結果圖</strong>，謝謝！」'}
            </div>
            ${e.usedHoldingReply ? `<div style="font-size:12px;color:#1d6b58;margin-bottom:6px;">${isEn ? '✅ You replied "Verifying NDA and approved version"; Ms. Su acknowledged.' : '✅ 你已先回覆「正在確認 NDA 與核准版本」，蘇小姐表示沒問題。'}</div>` : ''}
            <div style="font-size:12px;font-weight:700;color:#39465e;margin-bottom:4px;">${isEn ? '📂 StarSky_TestData Folder Contents:' : '📂 StarSky_TestData 資料夾內容：'}</div>
            <div class="file-list">
              <div class="file-item"><span>${isEn ? '01_Meeting_Summary_FigA.png / 02_Summary_FigB.png' : '01_會議摘要圖A.png / 02_摘要圖B.png'}</span><span class="file-tag safe">${state.clues.meetingVersion ? (isEn ? 'Approved Version' : '已核准版本') : (isEn ? 'Pending Verification' : '待確認版本')}</span></div>
              <div class="file-item"><span>${isEn ? '03_Raw_Measurements_RAW.csv' : '03_原始量測數據_RAW.csv'}</span><span class="file-tag secret">${isEn ? 'Internal Confidential' : '內部機密'}</span></div>
              <div class="file-item"><span>${isEn ? '04_Process_Notes_Draft.md' : '04_製程筆記_草稿.md'}</span><span class="file-tag unverified">${isEn ? 'Unapproved for External' : '未審核對外'}</span></div>
            </div>
            <div style="font-size:12px;color:#525f75;margin-top:6px;">
              <strong>${isEn ? 'Verification Status:' : '核對狀態：'}</strong><br>
              • ${isEn ? 'NDA Status: ' : 'NDA 簽署：'}${state.clues.ndaScope ? `<span style="color:#1b6e44;font-weight:700;">${isEn ? '✅ Active NDA-CS-2026 verified' : '✅ 已確認有效 NDA-CS-2026'}</span>` : `<span style="color:#9a5b13;">${isEn ? 'Unverified (Check registry above or ask Lead)' : '尚未確認（點上方查詢清單或問阿明組長）'}</span>`}<br>
              • ${isEn ? 'Approved Version: ' : '核准版本：'}${state.clues.meetingVersion ? `<span style="color:#1b6e44;font-weight:700;">${isEn ? '✅ Confirmed with A-Wen (Found 2 meeting figures)' : '✅ 已問過阿文（找到會議用兩張圖）'}</span>` : `<span style="color:#9a5b13;">${isEn ? 'Unconfirmed (Ask colleague A-Wen in lab)' : '尚未確認（可到實驗區問同事阿文）'}</span>`}
            </div>
          </div>

          <div class="pc-scroll-divider" id="pc-scroll-divider" role="button" tabindex="0">
            <span class="scroll-arrow">▼</span>
            <span>${isEn ? 'Step 2: Configure Share Scope & Access Settings Below' : '步驟二：請在下方設定檔案分享範圍與權限'}</span>
            <span class="scroll-arrow">▼</span>
          </div>

          <div class="pc-card" id="pc-settings-card">
            <h3>${isEn ? '🔗 File Scope & Access Settings' : '🔗 設定分享檔案與權限'}</h3>
            <div class="share-option-group">
              <label class="group-title">${isEn ? '1. Select Content to Share' : '1. 選擇要分享的內容'}</label>
              <div class="radio-row">
                <label class="radio-pill ${selectedPayload === 'full_folder' ? 'active' : ''}">
                  <input type="radio" name="pc-payload" value="full_folder" ${selectedPayload === 'full_folder' ? 'checked' : ''}>
                  <span><strong>${isEn ? 'Entire StarSky_TestData folder' : '整個 StarSky_TestData 資料夾'}</strong>${isEn ? ' (4 files)' : '（含 4 個檔案）'}</span>
                </label>
                <label class="radio-pill ${!state.clues.meetingVersion ? 'locked' : selectedPayload === 'charts_only' ? 'active' : ''}">
                  <input type="radio" name="pc-payload" value="charts_only" ${!state.clues.meetingVersion ? 'disabled' : ''} ${selectedPayload === 'charts_only' ? 'checked' : ''}>
                  <span><strong>${isEn ? '2 Meeting Figures only (Fig A & Fig B)' : '僅會議用兩張圖（圖A、圖B）'}</strong>${state.clues.meetingVersion ? (isEn ? ' — A-Wen verified approved version' : ' — 阿文已整理核准版') : (isEn ? ' (🔒 Ask colleague A-Wen in lab first)' : '（🔒 先問實驗區同事阿文才能找到）')}</span>
                </label>
              </div>
            </div>

            <div class="share-option-group">
              <label class="group-title">${isEn ? '2. Link Access Permission & Expiration' : '2. 連結存取權限與期限'}</label>
              <div class="radio-row">
                <label class="radio-pill ${selectedPerm === 'public_link' ? 'active' : ''}">
                  <input type="radio" name="pc-perm" value="public_link" ${selectedPerm === 'public_link' ? 'checked' : ''}>
                  <span><strong>${isEn ? 'Anyone with link can access' : '持連結者皆可存取'}</strong>${isEn ? ' (Fastest, no login)' : '（最快速，免登入）'}</span>
                </label>
                <label class="radio-pill ${selectedPerm === 'restricted_noexp' ? 'active' : ''}">
                  <input type="radio" name="pc-perm" value="restricted_noexp" ${selectedPerm === 'restricted_noexp' ? 'checked' : ''}>
                  <span><strong>${isEn ? 'Designated recipient (Ms. Su) Read-only' : '指定收件人（蘇小姐）唯讀'}</strong>${isEn ? ' · No expiration' : '・不設期限'}</span>
                </label>
                <label class="radio-pill ${selectedPerm === 'restricted_7d' ? 'active' : ''}">
                  <input type="radio" name="pc-perm" value="restricted_7d" ${selectedPerm === 'restricted_7d' ? 'checked' : ''}>
                  <span><strong>${isEn ? 'Designated recipient (Ms. Su) Read-only' : '指定收件人（蘇小姐）唯讀'}</strong>${isEn ? ' · 7-day auto-expire' : '・7 天自動到期'}</span>
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
              ? `<button class="pixel-btn warn" id="pc-hold-btn" type="button">${isEn ? '⏳ Reply "Verifying now", send later' : '⏳ 先回覆「正在確認中」，等等再寄'}</button>`
              : ''
          }
          <button class="pixel-btn" id="pc-cancel-btn" type="button">${isEn ? 'Don\'t Send Yet (Investigate first)' : '暫不寄出（先去查證）'}</button>
          <button class="pixel-btn ${previewRisky ? 'danger' : 'primary'}" id="pc-send-btn" type="button">${isEn ? '📤 Confirm & Send Link' : '📤 確認並寄出連結'}</button>
        </div>
      `;

      const scrollToSettings = () => {
        const target = $('pc-settings-card');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (body) {
          body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
        }
      };
      if ($('pc-scroll-hint-top')) $('pc-scroll-hint-top').onclick = scrollToSettings;
      if ($('pc-scroll-divider')) $('pc-scroll-divider').onclick = scrollToSettings;

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

      if (prevScrollTop > 0 && body) {
        body.scrollTop = prevScrollTop;
      }
    }

    render();
  }

  // ===== Chapter 2: Poster Review, Version Comparison & Submit UI =====
  function drawPosterFigureThumb(canvas, figKey, slotState) {
    if (!canvas) return;
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
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
        ctx.fillText(isEn ? 'Removed from Public' : '已從公開版移除', isEn ? 22 : 38, 36);
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

    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const posterTitle = $('poster-title');
    if (posterTitle) {
      posterTitle.textContent = isEn ? '📋 2F Duty PC — Poster Review, Version Diff & Submission' : '📋 2F 值班電腦 — 研討會海報送審、版本對照與線上上傳';
    }

    const c = state.ch2;
    let activeTab = c.misuploaded ? 'submit' : 'edit'; // 'edit' | 'submit'
    let compareView = 'current'; // 'original' | 'current'
    let selectedFig = 'fig2';
    let selectedUploadId = c.lastApprovedVersionId || c.workingVersionId;
    let reviewFeedback = null; // { ok, issues, message }

    function render() {
      const body = $('poster-body');
      const prevScrollTop = body ? body.scrollTop : 0;
      const workingVer = window.BS.State.getWorkingVersion(state);
      const originalVer = c.versions[0];
      const displayVer = compareView === 'original' ? originalVer : workingVer;
      const workingMeta = window.BS.State.getVersionStatusMeta(workingVer.status);
      const workingIssues = window.BS.State.getVersionIssues(workingVer, c.clues);
      const hasApproved = c.versions.some((v) => v.status === 'approved');

      if (!c.versions.some((v) => v.id === selectedUploadId)) {
        selectedUploadId = workingVer.id;
      }

      // Emergency Mis-upload Banner (visible at top if mis-uploaded!)
      let misuploadBanner = '';
      if (c.misuploaded) {
        misuploadBanner = `
          <div class="inline-danger-box">
            <strong>${isEn ? '🚨 Emergency Mis-upload in Progress:' : '🚨 誤傳事件處理中：'}</strong> ${isEn ? `Uploaded unconfirmed file <code>${c.submittedFilename}</code> at ${c.misuploadTimeStr || '18:15'}.` : `已於 ${c.misuploadTimeStr || '18:15'} 上傳未確認檔案 <code>${c.submittedFilename}</code>。`}<br>
            ${
              c.contactedOrganizer
                ? `<span style="color:#7c340b; font-weight:700;">${isEn ? `📨 Contact Organizer: Retraction request submitted, public status pending confirmation (${c.contactedOrganizerTimeStr}).` : `📨 聯絡主辦方狀態：已提出撤換請求，公開狀態待確認（${c.contactedOrganizerTimeStr}）。`}</span>`
                : `<span style="font-weight:700;">${isEn ? '⚠ Have not contacted symposium organizer to request retraction or takedown!' : '⚠ 尚未聯絡研討會主辦方申請撤換或下架！'}</span>`
            }<br>
            ${
              c.reportedToLead
                ? `<span style="color:#155e3a; font-weight:700;">${isEn ? '✅ Reported mis-upload incident to Team Lead A-Ming in office.' : '✅ 已向辦公區阿明組長回報此誤傳事件。'}</span>`
                : `<span style="font-weight:700;">${isEn ? '⚠ Have not reported to Team Lead A-Ming!' : '⚠ 尚未向辦公區阿明組長回報！'}</span>`
            }
            <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">
              ${
                !c.contactedOrganizer
                  ? `<button class="pixel-btn danger" id="btn-ch2-contact-org" type="button">${isEn ? '📞 Contact Organizer to Request Retraction' : '📞 聯絡主辦方提出撤換請求'}</button>`
                  : ''
              }
              <button class="pixel-btn" id="btn-ch2-close-remedy" type="button">${isEn ? 'Close PC (See Lead or Handover on Map)' : '關閉電腦（去地圖找阿明組長或交班）'}</button>
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
        const f2Title = f2Alt
          ? (isEn ? 'Fig 2: Proprietary Calibration Trend (Alternative)' : '圖二：自研校準趨勢示意圖（替代圖）')
          : (isEn ? 'Fig 2: Partner Measurement Chart' : '圖二：合作方量測圖');
        let f2DiffBadge = `<span class="diff-badge keep">${isEn ? 'Keep Original' : '保留原圖'}</span>`;
        if (f2Alt) {
          f2DiffBadge = `<span class="diff-badge replaced">${isEn ? 'Replaced' : '已替換'}</span>`;
        }
        let f2StatusBadge = '';
        if (f2Alt) {
          f2StatusBadge =
            displayVer.status === 'approved'
              ? `<span class="diff-badge safe">${isEn ? 'Approved Public' : '已核准公開'}</span>`
              : `<span class="diff-badge warn">${isEn ? 'Alternative Fig · Pending approval' : '可送審替代圖・待阿明組長核准'}</span>`;
        } else {
          f2StatusBadge = c.clues.wenExplainedFig2
            ? `<span class="diff-badge danger">${isEn ? 'Partner Meeting Only · Not Approved' : '合作會議用・未核准公開'}</span>`
            : `<span class="diff-badge warn">${isEn ? 'Source Unverified' : '來源待確認'}</span>`;
        }

        // Figure 3 labels
        const f3Removed = displayVer.slots.fig3 === 'removed';
        const f3DiffBadge = f3Removed
          ? `<span class="diff-badge removed">${isEn ? 'Removed' : '已移除'}</span>`
          : `<span class="diff-badge keep">${isEn ? 'Keep Original' : '保留原圖'}</span>`;
        const f3StatusBadge = f3Removed
          ? `<span class="diff-badge safe">${isEn ? 'Excluded from this edition' : '本次公開版不含此圖'}</span>`
          : `<span class="diff-badge danger">${isEn ? 'Patent arrangement pending' : '專利安排待確認'}</span>`;

        // Inspector HTML for selectedFig
        let inspectorHtml = '';
        if (selectedFig === 'fig1') {
          inspectorHtml = `
            <h4>${isEn ? 'Figure 1 “Equipment Layout Schematic”' : '圖一「設備配置示意」'}</h4>
            <p style="margin:4px 0;"><strong>${isEn ? 'Source & Status:' : '來源與狀態：'}</strong>${isEn ? 'Lab existing public architecture diagram, <strong>confirmed safe for public release</strong>. Safe to retain in symposium poster.' : '實驗室既有公開架構圖，<strong>已確認可公開</strong>。可安全保留於研討會海報中。'}</p>
          `;
        } else if (selectedFig === 'fig2') {
          const curAlt = workingVer.slots.fig2 === 'alt';
          const titleName = curAlt
            ? (isEn ? 'Proprietary Calibration Trend (Alternative)' : '自研校準趨勢示意圖（替代圖）')
            : (isEn ? 'Partner Measurement Chart' : '合作方量測圖');
          inspectorHtml = `
            <h4>${isEn ? `Figure 2 “${titleName}”` : `圖二「${titleName}」`}</h4>
            <p style="margin:4px 0;">
              <strong>${isEn ? 'Source Details:' : '來源說明：'}</strong>${
                curAlt
                  ? (isEn ? 'A-Wen drew an alternative calibration trend chart, free of partner data. <strong>Must still be submitted with current poster version to Team Lead A-Ming for approval.</strong>' : '阿文另行繪製的自研校準趨勢示意圖，不含合作方量測資料。<strong>仍須隨目前海報版本送交阿明組長確認核准。</strong>')
                  : c.clues.wenExplainedFig2
                  ? (isEn ? 'Previously used in <strong>partner meeting</strong> with Starlight Tech; not yet verified whether partnership agreement allows public symposium use.' : '曾用於上次與星海科技的<strong>合作會議</strong>，目前尚未確認合作約定是否涵蓋公開研討會海報用途。')
                  : (isEn ? '<strong>Source unverified</strong> (whether permitted on public poster is unconfirmed). Hint: Ask <strong>A-Wen in lab</strong> about this figure.' : '<strong>來源待確認</strong>（是否可用於公開海報待確認）。提示：可到<strong>實驗區找阿文</strong>詢問這張圖的來源。')
              }
            </p>
            <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">
              ${
                c.clues.hasReplacementFig2
                  ? curAlt
                    ? `<button class="pixel-btn" id="btn-fig2-restore" type="button">${isEn ? '↩ Restore Original “Partner Measurement Chart”' : '↩ 改回原始「合作方量測圖」'}</button>`
                    : `<button class="pixel-btn primary" id="btn-fig2-replace" type="button">${isEn ? '🔄 Replace with Alternative Figure from A-Wen' : '🔄 替換為阿文提供的替代圖'}</button>`
                  : `<button class="pixel-btn" type="button" disabled>${isEn ? '🔒 Need to obtain alternative figure from A-Wen in lab first' : '🔒 需先找實驗區的阿文取得替代圖'}</button>`
              }
            </div>
          `;
        } else {
          const curRemoved = workingVer.slots.fig3 === 'removed';
          inspectorHtml = `
            <h4>${isEn ? 'Figure 3 “Test Conditions & Result Summary”' : '圖三「測試條件與結果摘要」'}</h4>
            <p style="margin:4px 0;">
              <strong>${isEn ? 'Source & Status:' : '來源與狀態：'}</strong>${
                curRemoved
                  ? (isEn ? 'Removed from current public poster version to prevent compromising future patent filings.' : '已從目前編輯的公開海報版本中移除，避免影響後續專利申請安排。')
                  : c.clues.mingExplainedRules
                  ? (isEn ? 'Involves <strong>pending patent application arrangements</strong>; public timing not yet settled. Team Lead A-Ming suggests removing from this release.' : '涉及<strong>尚待確認的專利申請安排</strong>，公開時點在本章尚未定案。阿明組長建議先從本次公開版移除。')
                  : (isEn ? 'Involves <strong>pending patent arrangements</strong> (timing unconfirmed). Hint: Consult <strong>Team Lead A-Ming in office</strong>.' : '涉及<strong>尚待確認的專利申請安排</strong>（公開時點待確認）。提示：可先找<strong>辦公區的阿明組長</strong>確認處理方式。')
              }
            </p>
            <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">
              ${
                curRemoved
                  ? `<button class="pixel-btn" id="btn-fig3-restore" type="button">${isEn ? '↩ Put Back Figure 3 “Test Conditions & Results”' : '↩ 放回圖三「測試條件與結果摘要」'}</button>`
                  : `<button class="pixel-btn warn" id="btn-fig3-remove" type="button">${isEn ? '🗑 Remove Figure 3 from this Public Release' : '🗑 從本次公開版本移除圖三'}</button>`
              }
            </div>
          `;
        }

        // Status & review guidance banner
        let statusBannerHtml = '';
        if (reviewFeedback) {
          statusBannerHtml = reviewFeedback.ok
            ? `<div class="inline-ok-box">${reviewFeedback.message}</div>`
            : `<div class="inline-warning-box"><strong>${isEn ? '⚠ Does not meet submission criteria yet. Please resolve these figures:' : '⚠ 尚未符合送審條件，請先處理以下圖片：'}</strong><br>• ${reviewFeedback.issues.map(i => isEn ? (i.includes('圖二') ? 'Fig 2 "Partner Data" unconfirmed for public release' : 'Fig 3 involves pending patent arrangements') : i).join('<br>• ')}</div>`;
        } else if (workingVer.status === 'approved') {
          statusBannerHtml = `<div class="inline-ok-box">${isEn ? `✅ Currently viewed version <code>${workingVer.filename}</code> has been <strong>approved by Team Lead A-Ming</strong> (${workingVer.approvedAt}). You may proceed to "Submission" tab to upload; further edits will create a new unapproved draft without overwriting this approved record.` : `✅ 目前檢視的版本 <code>${workingVer.filename}</code> 已由<strong>阿明組長核准</strong>（${workingVer.approvedAt}）。可直接切到「提交投稿」上傳；若再次修改圖片，系統會建立「待重新確認」的新版本，不會覆寫這份已核准紀錄。`}</div>`;
        } else if (workingVer.status === 'pending_review') {
          statusBannerHtml = `<div class="inline-warning-box">${isEn ? `📨 <code>${workingVer.filename}</code> submitted for review. Close PC and talk to <strong>Team Lead A-Ming in office</strong> to confirm approval!` : `📨 <code>${workingVer.filename}</code> 已送審，請關閉電腦並向<strong>辦公區的阿明組長</strong>確認核准！`}</div>`;
        } else if (workingVer.status === 'needs_reapproval') {
          statusBannerHtml = `<div class="inline-warning-box">${isEn ? `⚠ <strong>Edited After Approval:</strong> Current version <code>${workingVer.filename}</code> is marked as <strong>“Needs Re-confirmation”</strong>. Original approved record is preserved in versions list.${workingIssues.length > 0 ? '<br>Issues: ' + workingIssues.map(i => i.includes('圖二') ? 'Fig 2 unconfirmed' : 'Fig 3 patent pending').join('; ') : 'Ready to resend to Lead for confirmation.'}` : `⚠ <strong>核准後已再次編輯：</strong>目前版本 <code>${workingVer.filename}</code> 狀態為<strong>「待重新確認」</strong>，原核准版本紀錄仍保留於版本清單中。${workingIssues.length > 0 ? '<br>待處理圖片：' + workingIssues.join('；') : '可重新送交阿明組長確認。'}`}</div>`;
        } else if (workingIssues.length > 0) {
          statusBannerHtml = `<div class="inline-warning-box"><strong>${isEn ? 'Current version still has unverified figures:' : '目前版本尚有未確認可公開的圖片：'}</strong><br>• ${workingIssues.map(i => isEn ? (i.includes('圖二') ? 'Fig 2 "Partner Data" unconfirmed for public release' : 'Fig 3 involves pending patent arrangements') : i).join('<br>• ')}</div>`;
        } else {
          statusBannerHtml = `<div class="inline-ok-box">${isEn ? '👍 Current version replaced Fig 2 and removed Fig 3! Click "Submit to Team Lead A-Ming for Confirmation", then obtain approval from him in office.' : '👍 目前版本已替換圖二並移除圖三！請點「送交阿明組長確認」，再向辦公區的阿明組長取得核准。'}</div>`;
        }

        tabContentHtml = `
          <div class="view-compare-bar">
            <div class="view-toggle-group">
              <button class="view-toggle-btn ${isViewingOrig ? 'active' : ''}" id="btn-view-orig" type="button">${isEn ? '📄 Original Draft (v1)' : '📄 原始草稿 (v1)'}</button>
              <button class="view-toggle-btn ${!isViewingOrig ? 'active' : ''}" id="btn-view-curr" type="button">${isEn ? `✏ Current Version (${workingVer.id})` : `✏ 目前編輯版本 (${workingVer.id})`}</button>
            </div>
            <span class="status-badge ${window.BS.State.getVersionStatusMeta(displayVer.status).badgeCls}">
              ${displayVer.filename}｜${isEn ? (displayVer.status === 'approved' ? 'Approved' : displayVer.status === 'draft' ? 'Draft' : displayVer.status === 'pending_review' ? 'Under Review' : 'Needs Re-approval') : window.BS.State.getVersionStatusMeta(displayVer.status).text}
            </span>
          </div>

          <div class="poster-sheet">
            <div class="poster-sheet-header">
              <span class="poster-sheet-title">${isEn ? '2026 Materials Symposium Poster — StarSky Thin Film Process Progress' : '2026 材料研討會海報 — 星空薄膜製程進度'}</span>
              <span class="poster-sheet-meta">${isViewingOrig ? (isEn ? 'View Mode: Original Draft (Read-only compare)' : '檢視模式：原始草稿（唯讀對照）') : (isEn ? 'View Mode: Current Editing Version' : '檢視模式：目前編輯版本')}</span>
            </div>
            <div class="poster-fig-grid">
              <button class="fig-card ${selectedFig === 'fig1' ? 'selected' : ''}" data-fig="fig1" type="button">
                <canvas class="fig-thumb" id="thumb-fig1" width="150" height="64"></canvas>
                <div class="fig-title">${isEn ? 'Fig 1: Equipment Layout' : '圖一：設備配置示意'}</div>
                <div class="fig-badges">
                  <span class="diff-badge keep">${isEn ? 'Keep' : '保留'}</span>
                  <span class="diff-badge safe">${isEn ? 'Verified Public' : '已確認可公開'}</span>
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

              <button class="fig-card ${selectedFig === 'fig3' ? 'selected' : ''}" data-fig="fig3" type="button">
                <canvas class="fig-thumb" id="thumb-fig3" width="150" height="64"></canvas>
                <div class="fig-title">${isEn ? 'Fig 3: Test Conditions & Results' : '圖三：測試條件與結果摘要'}</div>
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
            ${
              hasApproved || c.misuploaded
                ? `<button class="pixel-btn primary" id="btn-poster-goto-submit" type="button">${isEn ? '📤 Proceed to Online Poster Submission →' : '📤 前往線上提交海報檔案 →'}</button>`
                : ''
            }
            ${
              c.outcome === 'in_progress'
                ? `<button class="pixel-btn ${workingIssues.length === 0 && workingVer.status !== 'pending_review' ? 'primary' : ''}" id="btn-poster-send-review" type="button">${isEn ? `📨 Submit Current Version (${workingVer.id}) to Lead A-Ming for Approval` : `📨 送交目前版本 (${workingVer.id}) 給阿明組長確認`}</button>`
                : ''
            }
          </div>
        `;
      } else {
        // Tab 2: Versions & Upload / Defer
        const chosenVer = window.BS.State.getVersionById(state, selectedUploadId) || workingVer;
        const chosenMeta = window.BS.State.getVersionStatusMeta(chosenVer.status);
        const chosenApproved = chosenVer.status === 'approved';
        const chosenStatusText = isEn
          ? (chosenVer.status === 'approved' ? 'Approved' : chosenVer.status === 'draft' ? 'Draft' : chosenVer.status === 'pending_review' ? 'Under Review' : 'Needs Re-approval')
          : chosenMeta.text;

        tabContentHtml = `
          <div class="pc-card" style="margin-bottom:10px;">
            <h3>${isEn ? '🗂 Select Actual Poster File to Upload to Symposium Organizer' : '🗂 選擇實際要上傳給研討會主辦方的海報檔案'}</h3>
            <p style="margin:0 0 8px; font-size:12.5px; color:#4b576d;">
              ${isEn ? 'Carefully verify <strong>filename, version contents, and approval status</strong>. Even if an approved version exists in folder, picking an old file will cause mis-upload.' : '請仔細核對<strong>檔名、版本內容與確認狀態</strong>。即使資料夾裡已有核准版，選錯舊檔仍會造成誤傳。'}
            </p>
            <div>
              ${c.versions
                .map((v) => {
                  const m = window.BS.State.getVersionStatusMeta(v.status);
                  const isSel = v.id === selectedUploadId;
                  const vStatusText = isEn
                    ? (v.status === 'approved' ? 'Approved' : v.status === 'draft' ? 'Draft' : v.status === 'pending_review' ? 'Under Review' : 'Needs Re-approval')
                    : m.text;
                  const vSummaryText = isEn
                    ? (v.id === 'v1' ? 'Original draft: Fig 2 partner data, Fig 3 patent data included.' : v.slots.fig3 === 'removed' && v.slots.fig2 === 'alt' ? 'Alternative Fig 2, Fig 3 removed. Safe version.' : 'Edited version.')
                    : v.summary;
                  return `
                    <label class="version-row ${isSel ? 'active' : ''} ${v.status === 'approved' ? 'approved-row' : ''}">
                      <input type="radio" name="ch2-upload-ver" value="${v.id}" ${isSel ? 'checked' : ''} ${c.outcome !== 'in_progress' ? 'disabled' : ''}>
                      <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                          <strong>${v.filename}</strong>
                          <span class="status-badge ${m.badgeCls}">${vStatusText}</span>
                        </div>
                        <div class="version-meta-line">${vSummaryText}</div>
                        ${v.approvedBy ? `<div class="version-meta-line" style="color:#165935; font-weight:700;">✔ ${isEn ? `Approval Record: Team Lead A-Ming approved at ${v.approvedAt} (bound to this version)` : `核准紀錄：${v.approvedBy} 於 ${v.approvedAt} 確認核准（綁定此版本）`}</div>` : ''}
                      </div>
                    </label>
                  `;
                })
                .join('')}
            </div>

            <div class="recipient-preview ${chosenApproved ? 'safe' : 'risky'}">
              ${
                chosenApproved
                  ? (isEn ? `<strong>✅ Pre-upload Verification:</strong> Selected <code>${chosenVer.filename}</code> approved by Team Lead A-Ming. Fig 2 replaced, Fig 3 removed. Safe to submit!` : `<strong>✅ 上傳前核對：</strong>已選取阿明組長核准的 <code>${chosenVer.filename}</code>，圖二已替換、圖三已移除，可安全提交！`)
                  : (isEn ? `<strong>⚠ Pre-upload Warning:</strong> Currently selected <code>${chosenVer.filename}</code> is “<strong>${chosenStatusText}</strong>”, not approved by Lead. Uploading now will mis-upload an unconfirmed version!` : `<strong>⚠ 上傳前核對：</strong>目前選取的 <code>${chosenVer.filename}</code> 狀態為「<strong>${chosenMeta.text}</strong>」，尚未取得阿明組長核准。若現在上傳，將會誤傳未確認版本！`)
              }
            </div>
          </div>

          <div class="pc-actions">
            <button class="pixel-btn" id="btn-poster-back-edit" type="button">${isEn ? '← Back to Edit & Compare Poster' : '← 返回編輯與比較海報'}</button>
            ${
              c.outcome === 'in_progress'
                ? `
                  <button class="pixel-btn ${chosenApproved ? 'primary' : 'danger'}" id="btn-poster-upload" type="button">${isEn ? `📤 Submit Selected File (${chosenVer.id})` : `📤 提交選取檔案 (${chosenVer.id})`}</button>
                `
                : `<span class="status-badge ${c.outcome === 'submitted_approved' ? 'ok' : c.outcome === 'deferred' ? 'warn' : 'danger'}">
                    ${c.outcome === 'submitted_approved' ? (isEn ? '✅ Approved version submitted! Return to duty desk for handover' : '✅ 已完成核准版提交，可回值班桌交班') : c.outcome === 'deferred' ? (isEn ? '⏸ Submission deferred! Return to duty desk for handover' : '⏸ 已紀錄暫緩投稿，可回值班桌交班') : (isEn ? '🚨 Remedying mis-upload! Return to duty desk when done' : '🚨 誤傳處理中，完成後可回值班桌交班')}
                  </span>`
            }
          </div>
        `;
      }

      body.innerHTML = `
        ${misuploadBanner}
        <div class="pc-scroll-hint-bar" id="poster-scroll-hint" role="button" tabindex="0">
          <span class="scroll-arrow">⬇</span>
          <span>${isEn ? 'Scroll down below to inspect figures, request review or submit' : '請往下捲動以檢視各圖片細節、送審或提交'}</span>
          <span class="scroll-arrow">⬇</span>
        </div>
        <div class="poster-tabs">
          <button class="poster-tab-btn ${activeTab === 'edit' ? 'active' : ''}" id="tab-poster-edit" type="button">${isEn ? '🎨 Figure Review & Version Diff' : '🎨 海報編輯與版本比較'}</button>
          <button class="poster-tab-btn ${activeTab === 'submit' ? 'active' : ''} ${!hasApproved && !c.misuploaded ? 'disabled' : ''}" id="tab-poster-submit" type="button" ${!hasApproved && !c.misuploaded ? 'style="opacity:0.65;"' : ''}>${isEn ? `📤 Version History & Submission (${c.versions.length} ver)` : `📤 版本紀錄與提交投稿 (${c.versions.length} 版)`}${!hasApproved && !c.misuploaded ? ' 🔒' : ''}</button>
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
        if (!hasApproved && !c.misuploaded) {
          window.BS.Audio.alert();
          window.BS.UI.showToast(
            isEn
              ? '⚠️ Poster not approved yet! Please edit figures (replace Fig 2, remove Fig 3) and submit to Lead A-Ming for confirmation first.'
              : '⚠️ 海報尚未經阿明組長核准！請先完成圖片整理（替換圖二、移除圖三）並送交組長確認。',
            true,
            4000
          );
          return;
        }
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

        if ($('btn-poster-goto-submit')) {
          $('btn-poster-goto-submit').onclick = () => {
            activeTab = 'submit';
            window.BS.Audio.select();
            render();
          };
        }

        if ($('btn-poster-send-review')) {
          $('btn-poster-send-review').onclick = () => {
            const res = callbacks.onSendForReview();
            if (!res.ok) {
              window.BS.Audio.alert();
              reviewFeedback = { ok: false, issues: res.issues };
              render();
            } else if (res.alreadyApproved) {
              window.BS.Audio.select();
              reviewFeedback = { ok: true, message: isEn ? `✅ ${res.version.filename} is already approved by Team Lead A-Ming. Proceed to "Submission" tab!` : `✅ ${res.version.filename} 已經由阿明組長核准，可直接前往「提交投稿」！` };
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

      if ($('poster-scroll-hint')) {
        $('poster-scroll-hint').onclick = () => {
          const act = body.querySelector('.pc-actions');
          if (act) act.scrollIntoView({ behavior: 'smooth', block: 'end' });
          else body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
        };
      }

      if (prevScrollTop > 0 && body) {
        body.scrollTop = prevScrollTop;
      }
    }

    render();
  }

  // ===== Chapter 1: Visitor Camera Viewfinder UI =====
  function openCameraModal(state, mode, callbacks) {
    activeModal = 'camera';
    $('camera-modal').classList.remove('hidden');
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    $('cam-title').textContent =
      mode === 'entrance'
        ? (isEn ? '📷 Camera Viewfinder — Approved Entrance Angle' : '📷 相機取景預覽 — 訪客入口核准角度')
        : (isEn ? '📷 Camera Viewfinder — Lab Area Live Lens' : '📷 相機取景預覽 — 實驗區現場鏡頭');

    const exposed = mode === 'lab' ? window.BS.State.getExposedLabItems(state) : [];
    const exposedEn = exposed.map(item => {
      if (item === '白板配方參數') return 'Whiteboard Formula Parameters';
      if (item === '螢幕原始數據') return 'Screen Raw Measurements';
      if (item === '樣品代碼標籤') return 'Sample Batch Code Labels';
      return item;
    });
    const body = $('cam-body');

    body.innerHTML = `
      <div class="cam-frame-wrap">
        <canvas id="cam-preview-canvas" width="288" height="160"></canvas>
        <div class="cam-hud-tags" id="cam-tags"></div>
      </div>
      <p style="margin:4px 0 8px; font-size:13px;">
        ${
          mode === 'entrance'
            ? (isEn
                ? 'Mr. Chen points his camera at the entrance logo wall. The frame captures only the lab signage and glass partition—zero research data in view.'
                : '陳先生舉起相機對準入口形象牆。畫面只拍到實驗室招牌與玻璃隔間外觀，沒有任何實驗數據入鏡。')
            : exposed.length > 0
            ? (isEn
                ? `<strong>⚠ Notice Background Hazards!</strong> The viewfinder clearly captures <strong>“${exposedEn.join(', ')}”</strong>! Mr. Chen plans to include this photo in an external tour report.`
                : `<strong>⚠ 注意鏡頭背景！</strong>預覽畫面清楚拍到了<strong>「${exposed.join('、')}」</strong>！陳先生打算把這張照片放進對外參訪報告。`)
            : (isEn
                ? 'Great! You have cleared and locked the whiteboard, monitor, and sample labels. The lab viewfinder is clean and professional.'
                : '太好了！你已經把白板、螢幕與樣品標籤都處理完畢，實驗區取景畫面乾淨又專業。')
        }
      </p>
      <div class="cam-actions">
        ${
          mode === 'lab' && exposed.length > 0
            ? `
              <button class="pixel-btn primary" id="cam-pause-fix" type="button">${isEn ? '✋ Pause Shooting, Tidy Up First' : '✋ 暫停拍攝，先去整理現場'}</button>
              <button class="pixel-btn warn" id="cam-switch-entrance" type="button">${isEn ? '↩ Switch Back to Entrance Angle' : '↩ 改回訪客入口指定角度拍'}</button>
              <button class="pixel-btn danger" id="cam-shoot-anyway" type="button">${isEn ? '📷 Shoot Anyway' : '📷 就這樣按下快門'}</button>
            `
            : `
              <button class="pixel-btn" id="cam-cancel" type="button">${isEn ? 'Wait a Moment' : '先等一下'}</button>
              <button class="pixel-btn primary" id="cam-shoot-ok" type="button">${isEn ? '📷 Snap Photo' : '📷 按下快門完成拍攝'}</button>
            `
        }
      </div>
    `;

    drawCameraPreview($('cam-preview-canvas'), state, mode);

    const tagsEl = $('cam-tags');
    if (mode === 'entrance') {
      tagsEl.innerHTML = isEn
        ? '<span class="cam-tag ok">✓ Approved Entrance Angle</span><span class="cam-tag ok">✓ Zero Research Data in Frame</span>'
        : '<span class="cam-tag ok">✓ 訪客入口指定角度</span><span class="cam-tag ok">✓ 無研究資訊入鏡</span>';
    } else {
      tagsEl.innerHTML = [
        state.labItems.whiteboard
          ? (isEn ? '<span class="cam-tag ok">✓ Whiteboard Erased</span>' : '<span class="cam-tag ok">✓ 白板已擦拭遮蔽</span>')
          : (isEn ? '<span class="cam-tag leak">⚠ Whiteboard Formula in Frame</span>' : '<span class="cam-tag leak">⚠ 白板配方參數入鏡</span>'),
        state.labItems.monitor
          ? (isEn ? '<span class="cam-tag ok">✓ Screen Locked</span>' : '<span class="cam-tag ok">✓ 螢幕已鎖定畫面</span>')
          : (isEn ? '<span class="cam-tag leak">⚠ Screen Raw Data in Frame</span>' : '<span class="cam-tag leak">⚠ 螢幕原始量測數據入鏡</span>'),
        state.labItems.samples
          ? (isEn ? '<span class="cam-tag ok">✓ Samples Stored Safely</span>' : '<span class="cam-tag ok">✓ 樣品標籤已收妥</span>')
          : (isEn ? '<span class="cam-tag leak">⚠ Sample Code Labels in Frame</span>' : '<span class="cam-tag leak">⚠ 樣品代碼標籤入鏡</span>')
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
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
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
      ctx.fillText(isEn ? 'ACADEMIA SINICA RCCI LAB' : '中研院RCCI實驗室', 177, 50);
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
        ctx.fillText(isEn ? 'Formula Ratio 14.2%' : '配方比例 14.2%', 26, 38);
        ctx.fillStyle = '#2b6cb0';
        ctx.fillText(isEn ? 'Anneal 380°C/4h' : '退火 380°C/4h', 26, 50);
        ctx.fillStyle = '#d97706';
        ctx.fillText(isEn ? 'StarSky B4' : '星空計畫 B4', 26, 62);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(16, 18, 92, 60);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px sans-serif';
        ctx.fillText(isEn ? '(Erased & Clean)' : '（已擦拭乾淨）', 36, 50);
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
        ctx.fillText(isEn ? '🔒 Screen Locked' : '🔒 畫面已鎖定', 198, 60);
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
        ctx.fillText(isEn ? 'Shielded & Stored' : '已收妥遮蔽', 125, 112);
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

    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const titleEl = $('offboard-title');
    if (titleEl) {
      titleEl.textContent = isEn
        ? '💻 2F Duty PC — Offboarding Handover Checklist & Access Preview'
        : '💻 2F 值班電腦 — 離職交接清單與存取視角預覽';
    }
    const closeEl = $('btn-offboard-close');
    if (closeEl) {
      closeEl.setAttribute('aria-label', isEn ? 'Close offboarding system' : '關閉交接系統');
    }

    let activeTab = 'checklist'; // 'checklist' | 'preview'
    let previewRole = 'awen';    // 'awen' | 'qing'
    let inlineNotice = '';

    function render() {
      const c = state.ch3;
      const body = $('offboard-body');
      const prevScrollTop = body ? body.scrollTop : 0;
      const pending = window.BS.State.getCh3PendingItems(state);
      const transferred = c.rawLogLocation === 'project';
      const origRevoked = c.awenOrigAccess === 'revoked';

      // Next-step dynamic hint telling player which floor & who to see next!
      let nextStepHint = '';
      if (!transferred && origRevoked) {
        nextStepHint = isEn
          ? '🚨 <strong>Handover Interrupted:</strong> Raw logs have not been transferred and A-Wen\'s original access is revoked! Go downstairs to <strong>1F Team Lead A-Ming</strong> to request admin transfer assistance.'
          : '🚨 <strong>交接中斷補救：</strong>原始量測紀錄尚未移交，且阿文原權限已終止！請下樓找 <strong>1F 阿明組長</strong> 請求管理員協助移交指定檔案。';
      } else if (!transferred) {
        nextStepHint = isEn
          ? '💡 <strong>Suggested Next Step:</strong> Raw logs are still in A-Wen\'s personal workspace. Visit <strong>2F Lab to find A-Wen</strong> to transfer them (or go downstairs to <strong>1F Team Lead A-Ming</strong> to confirm the scope for the 2 figures).'
          : '💡 <strong>下一步建議：</strong>原始量測紀錄還在阿文個人工作區，請到 <strong>2F 實驗區找阿文</strong> 協助移交至專案指定位置（也可先下樓找 <strong>1F 阿明組長</strong> 確認兩張圖的限期授權範圍）。';
      } else if (!c.qingHasProjectAccess) {
        nextStepHint = isEn
          ? '💡 <strong>Suggested Next Step:</strong> File transferred, but Xiao-Qing cannot open it yet! <strong>Confirm Xiao-Qing\'s project folder access</strong> here first, then switch to "Access Preview" to inspect.'
          : '💡 <strong>下一步建議：</strong>檔案已移交，但小晴尚無法開啟！請先在此為<strong>小晴確認專案存取權限</strong>，再切到「存取預覽」檢查。';
      } else if (!c.qingConfirmedOpen) {
        nextStepHint = isEn
          ? '💡 <strong>Suggested Next Step:</strong> Xiao-Qing\'s access is active! Visit <strong>2F Lab to find Xiao-Qing</strong> to personally test opening the log and confirm reception.'
          : '💡 <strong>下一步建議：</strong>小晴權限已開通！請到 <strong>2F 實驗區找小晴</strong> 親自測試開啟紀錄並確認接收。';
      } else if (!c.clues.mingConfirmedScope) {
        nextStepHint = isEn
          ? '💡 <strong>Suggested Next Step:</strong> Go downstairs to <strong>1F Team Lead A-Ming</strong> to confirm the time-limited grant for A-Wen\'s 2 figures, and collect the badge at <strong>1F Main Reception Desk</strong>!'
          : '💡 <strong>下一步建議：</strong>請下樓找 <strong>1F 阿明組長</strong> 確認阿文後續改論文所需的兩張圖與限期授權，並順便於 <strong>1F 大門接待櫃台</strong> 收回門禁卡！';
      } else if (!c.awenPaperGrant || !origRevoked) {
        nextStepHint = isEn
          ? '💡 <strong>Suggested Next Step:</strong> Grant A-Wen "2 Figures Only (30 Days Post-departure)" and <strong>terminate A-Wen\'s original project permissions</strong>, then switch to "A-Wen View" to verify isolation!'
          : '💡 <strong>下一步建議：</strong>請在此設定阿文「僅兩張圖（離開後 30 天）」限期授權並<strong>終止阿文原專案權限</strong>，再切到「阿文視角」確認隔離效果！';
      } else if (!c.badgeReturned) {
        nextStepHint = isEn
          ? '💡 <strong>Suggested Next Step:</strong> Electronic access is sorted; go downstairs to <strong>1F Main Reception Desk</strong> to collect and register A-Wen\'s physical badge!'
          : '💡 <strong>下一步建議：</strong>電子權限已處理妥當，請下樓到 <strong>1F 大門接待櫃台</strong> 收回阿文的實體門禁卡並登記！';
      } else if (!c.ndaRemindedToAwen) {
        nextStepHint = isEn
          ? '💡 <strong>Suggested Next Step:</strong> Don\'t forget to visit <strong>2F Lab to find A-Wen</strong> and remind him of ongoing post-employment confidentiality obligations!'
          : '💡 <strong>下一步建議：</strong>別忘了再到 <strong>2F 實驗區找阿文</strong> 確認提醒離職後的保密義務！';
      } else {
        nextStepHint = isEn
          ? '✅ <strong>All offboarding handover items complete!</strong> Close the PC and head to the adjacent <strong>2F Duty Desk</strong> to complete handover and clear the chapter!'
          : '✅ <strong>全數離職交接項目已完成！</strong>請關閉電腦，到旁邊的 <strong>2F 值班桌</strong> 完成交班與通關！';
      }

      let tabHtml = '';
      if (activeTab === 'checklist') {
        tabHtml = `
          <div class="${!transferred && origRevoked ? 'inline-danger-box' : pending.length === 0 ? 'inline-ok-box' : 'inline-warning-box'}">
            ${nextStepHint}
          </div>
          ${inlineNotice ? `<div class="inline-ok-box">${inlineNotice}</div>` : ''}
          <div class="pc-scroll-hint-bar" id="offboard-scroll-hint" role="button" tabindex="0">
            <span class="scroll-arrow">⬇</span>
            <span>${isEn ? 'Scroll down below to perform handover actions & permissions' : '請往下捲動至下方執行交接與權限設定操作'}</span>
            <span class="scroll-arrow">⬇</span>
          </div>

          <div class="pc-card" style="margin-bottom:10px;">
            <h3>📋 ${isEn ? 'A-Wen Offboarding Handover Checklist (StarSky Project)' : '阿文離職交接清單（星空計畫）'}</h3>
            <table class="checklist-table">
              <tbody>
                <tr>
                  <th style="width:32%;">${isEn ? 'Successor' : '接手同事'}</th>
                  <td><strong>${isEn ? 'Xiao-Qing' : '小晴'}</strong>（${isEn ? '2F Lab' : '2F 實驗區'}）</td>
                </tr>
                <tr>
                  <th>${isEn ? 'Raw Measurement Log Location' : '原始量測紀錄位置'}</th>
                  <td>
                    <code>${c.rawLogName}</code><br>
                    ${
                      transferred
                        ? `<span class="status-badge ok">${isEn ? '✅ Transferred to designated project location' : '✅ 已移交至專案指定位置'}</span> <code>${c.rawLogTargetPath}</code>${c.adminTransferCompleted ? (isEn ? ' (Admin Assisted)' : '（由管理員協助移交）') : ''}`
                        : `<span class="status-badge danger">${isEn ? '❌ Still in personal workspace' : '❌ 仍在個人工作區'}</span> <code>${c.rawLogOrigPath}</code>`
                    }
                  </td>
                </tr>
                <tr>
                  <th>${isEn ? 'Successor Access & Confirmation' : '接手人權限與接收確認'}</th>
                  <td>
                    ${isEn ? 'Access: ' : '權限：'}${c.qingHasProjectAccess ? (isEn ? '<span class="status-badge ok">✅ Project Access Activated</span>' : '<span class="status-badge ok">✅ 已開通專案權限</span>') : (isEn ? '<span class="status-badge warn">⬜ Pending Activation</span>' : '<span class="status-badge warn">⬜ 尚未開通</span>')}
                    　${isEn ? 'Reception: ' : '接收：'}${c.qingConfirmedOpen ? (isEn ? '<span class="status-badge ok">✅ Successor (Xiao-Qing) Personally Tested Opening</span>' : '<span class="status-badge ok">✅ 接收人（小晴）已親自確認開啟</span>') : (isEn ? '<span class="status-badge warn">⬜ Pending Xiao-Qing Verification</span>' : '<span class="status-badge warn">⬜ 待小晴實測確認</span>')}
                  </td>
                </tr>
                <tr>
                  <th>${isEn ? 'A-Wen Original Project Permissions' : '阿文原專案權限'}</th>
                  <td>
                    ${
                      origRevoked
                        ? (isEn ? '<span class="status-badge ok">✅ Original Access Terminated</span>' : '<span class="status-badge ok">✅ 已終止原專案權限</span>')
                        : c.awenOrigAccess === 'kept_explicit'
                        ? (isEn ? '<span class="status-badge danger">🚨 Temporarily Retained (Overbroad! Check Access Preview)</span>' : '<span class="status-badge danger">🚨 暫時保留中（授權過廣！可至存取預覽確認）</span>')
                        : (isEn ? '<span class="status-badge warn">⚠ Still Open (Must Terminate on Departure Date)</span>' : '<span class="status-badge warn">⚠ 仍開放中（離職當日應終止）</span>')
                    }
                  </td>
                </tr>
                <tr>
                  <th>${isEn ? 'Two Figures Manuscript Collab Grant' : '後續論文兩張圖授權'}</th>
                  <td>
                    ${
                      c.awenPaperGrant
                        ? (isEn
                            ? `<span class="status-badge ok">✅ Time-limited grant configured</span> ${c.awenPaperPurpose} | Duration: <strong>${c.awenPaperDuration}</strong>`
                            : `<span class="status-badge ok">✅ 已設定限期授權</span> ${c.awenPaperPurpose}｜期限：<strong>${c.awenPaperDuration}</strong>`)
                        : c.clues.mingConfirmedScope
                        ? (isEn ? '<span class="status-badge warn">⬜ Team Lead A-Ming approved scope (2 figures / 30 days post-departure), pending system setup</span>' : '<span class="status-badge warn">⬜ 阿明組長已核定範圍（僅兩張圖／離開後 30 天），待系統設定</span>')
                        : (isEn ? '<span class="status-badge warn">⬜ Pending scope and duration confirmation from 1F Team Lead A-Ming</span>' : '<span class="status-badge warn">⬜ 待下樓找 1F 阿明組長確認範圍與期限</span>')
                    }
                  </td>
                </tr>
                <tr>
                  <th>${isEn ? '1F Physical Badge Collection' : '1F 實體門禁卡回收'}</th>
                  <td>${c.badgeReturned ? (isEn ? '<span class="status-badge ok">✅ Collected & logged at 1F Main Reception Desk</span>' : '<span class="status-badge ok">✅ 已於 1F 大門接待櫃台收回並登記</span>') : (isEn ? '<span class="status-badge warn">⬜ Pending collection at 1F Desk</span>' : '<span class="status-badge warn">⬜ 尚未於 1F 櫃台收回登記</span>')}</td>
                </tr>
                <tr>
                  <th>${isEn ? 'Offboarding Confidentiality Reminder' : '離職保密義務提醒'}</th>
                  <td>${c.ndaRemindedToAwen ? (isEn ? '<span class="status-badge ok">✅ Reminded A-Wen via handover dialogue</span>' : '<span class="status-badge ok">✅ 已透過交接對話提醒阿文保密義務</span>') : (isEn ? '<span class="status-badge warn">⬜ Pending reminder to A-Wen</span>' : '<span class="status-badge warn">⬜ 尚未與阿文確認保密義務提醒</span>')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pc-scroll-divider" id="offboard-action-divider" role="button" tabindex="0">
            <span class="scroll-arrow">▼</span>
            <span>${isEn ? 'Handover & Permission Action Area Below' : '下方為交接與權限操作設定區'}</span>
            <span class="scroll-arrow">▼</span>
          </div>

          <div class="ch3-action-grid" id="ch3-actions-area">
            <div class="ch3-action-box">
              <div style="font-size:12.5px;">
                <strong>${isEn ? '1. Successor (Xiao-Qing) Project Access' : '1. 接手人（小晴）專案權限'}</strong><br>
                <span style="color:#4c586e;">${isEn ? 'Confirm Xiao-Qing has access to the StarSky Project folder so she can open transferred raw logs.' : '確認小晴具備星空計畫指定資料夾存取權限，才能開啟移交的原始紀錄。'}</span>
              </div>
              <button class="pixel-btn ${c.qingHasProjectAccess ? '' : 'primary'}" id="btn-ch3-grant-qing" type="button" ${c.qingHasProjectAccess ? 'disabled' : ''}>
                ${c.qingHasProjectAccess ? (isEn ? '✅ Xiao-Qing Access Activated' : '✅ 小晴專案權限已開通') : (isEn ? '🔑 Confirm Project Access for Xiao-Qing' : '🔑 為小晴確認專案存取權限')}
              </button>
            </div>

            <div class="ch3-action-box">
              <div style="font-size:12.5px;">
                <strong>${isEn ? '2. A-Wen "2 Conference Figures" Time-Limited Grant' : '2. 阿文「兩張會議圖」限期授權'}</strong><br>
                <span style="color:#4c586e;">${isEn ? 'Per 1F Team Lead A-Ming\'s approval, authorize Fig A & Fig B only for paper revisions (expires in 30 days).' : '依 1F 阿明組長核定範圍，僅授權圖A、圖B 供論文修訂（離開後 30 天到期）。'}</span>
              </div>
              <button class="pixel-btn ${c.awenPaperGrant ? '' : 'primary'}" id="btn-ch3-grant-paper" type="button" ${!c.clues.mingConfirmedScope || c.awenPaperGrant ? 'disabled' : ''}>
                ${
                  c.awenPaperGrant
                    ? (isEn ? '✅ Two Figures Grant Configured (30 Days)' : '✅ 已設定兩張圖限期授權（30 天）')
                    : c.clues.mingConfirmedScope
                    ? (isEn ? '⏳ Configure 2 Figures Grant (30 Days Post-departure)' : '⏳ 設定兩張圖限期授權（離開後 30 天）')
                    : (isEn ? '🔒 Confirm scope with 1F Team Lead A-Ming first' : '🔒 先找 1F 阿明組長確認範圍與期限')
                }
              </button>
            </div>

            <div class="ch3-action-box">
              <div style="font-size:12.5px;">
                <strong>${isEn ? '3. Terminate A-Wen\'s Original Project Access' : '3. 終止阿文原專案資料夾權限'}</strong><br>
                <span style="color:#4c586e;">${isEn ? 'Revoke original project and workspace access upon departure to prevent retaining unrelated access.' : '離職時應取消原專案與個人區權限，避免留存與論文無關的存取權。'}</span>
              </div>
              <button class="pixel-btn ${origRevoked ? '' : 'danger'}" id="btn-ch3-revoke-awen" type="button" ${origRevoked ? 'disabled' : ''}>
                ${origRevoked ? (isEn ? '✅ A-Wen Original Access Terminated' : '✅ 已終止阿文原專案權限') : (isEn ? '🔒 Terminate A-Wen Original Access' : '🔒 終止阿文的原專案權限')}
              </button>
            </div>

            <div class="ch3-action-box">
              <div style="font-size:12.5px;">
                <strong>${isEn ? '4. Test Retaining Access / Switch Perspective' : '4. 測試保留原權限／切換視角'}</strong><br>
                <span style="color:#4c586e;">${isEn ? 'If temporarily retaining access for A-Wen, visit "Access Preview" to see which files A-Wen can still open.' : '若先答應阿文保留原權限，可到「存取預覽」看看阿文還能存取哪些檔案。'}</span>
              </div>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                ${
                  !origRevoked && c.awenOrigAccess !== 'kept_explicit'
                    ? `<button class="pixel-btn warn" id="btn-ch3-keep-awen" type="button" style="flex:1; font-size:12px;">${isEn ? '⚠ Temporarily Keep Access' : '⚠ 先保留原權限'}</button>`
                    : ''
                }
                <button class="pixel-btn" id="btn-ch3-goto-preview" type="button" style="flex:1; font-size:12px;">${isEn ? '👁 Open Access Preview →' : '👁 開啟人物存取預覽 →'}</button>
              </div>
            </div>
          </div>
        `;
      } else {
        // Tab 2: Perspective Access Preview (Awen vs Qing)
        const cards = window.BS.State.getCh3AccessPreview(state, previewRole);
        tabHtml = `
          <div class="role-switch-bar">
            <button class="role-switch-btn ${previewRole === 'awen' ? 'active' : ''}" id="btn-role-awen" type="button">${isEn ? '👤 Switch to: A-Wen View (Departing Employee)' : '👤 切換至：阿文視角（離任人員）'}</button>
            <button class="role-switch-btn ${previewRole === 'qing' ? 'active' : ''}" id="btn-role-qing" type="button">${isEn ? '👤 Switch to: Xiao-Qing View (Successor)' : '👤 切換至：小晴視角（接手同事）'}</button>
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
                ? `<button class="pixel-btn primary" id="btn-preview-grant-qing" type="button">${isEn ? '🔑 Activate Xiao-Qing Access & Retest Now' : '🔑 立即為小晴開通專案權限並重檢'}</button>`
                : ''
            }
            ${
              previewRole === 'awen' && !origRevoked
                ? `<button class="pixel-btn danger" id="btn-preview-revoke-awen" type="button">${isEn ? '🔒 Terminate A-Wen Access & Retest Now' : '🔒 立即終止阿文原專案權限並重檢'}</button>`
                : ''
            }
            ${
              previewRole === 'awen' && c.clues.mingConfirmedScope && !c.awenPaperGrant
                ? `<button class="pixel-btn primary" id="btn-preview-grant-paper" type="button">${isEn ? '⏳ Configure 2 Figures 30-Day Grant' : '⏳ 設定兩張圖 30 天限期授權'}</button>`
                : ''
            }
            <button class="pixel-btn" id="btn-ch3-back-list" type="button">${isEn ? '← Back to Handover Checklist' : '← 返回離職交接清單'}</button>
          </div>
        `;
      }

      body.innerHTML = `
        <div class="poster-tabs">
          <button class="poster-tab-btn ${activeTab === 'checklist' ? 'active' : ''}" id="tab-ch3-list" type="button">${isEn ? '📋 Handover Checklist & Permissions' : '📋 離職交接清單與權限操作'}</button>
          <button class="poster-tab-btn ${activeTab === 'preview' ? 'active' : ''}" id="tab-ch3-preview" type="button">${isEn ? '👁 Access Preview (A-Wen / Xiao-Qing View)' : '👁 存取預覽（切換阿文／小晴視角）'}</button>
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
            inlineNotice = isEn
              ? '✅ StarSky Project access activated for Xiao-Qing! Inspect in "Access Preview", and visit 2F Lab to have Xiao-Qing confirm opening.'
              : '✅ 已為小晴開通星空計畫存取權限！可到「存取預覽」檢查，並請 2F 實驗區小晴親自確認開啟。';
            window.BS.Audio.success();
            render();
          };
        }
        if ($('btn-ch3-grant-paper')) {
          $('btn-ch3-grant-paper').onclick = () => {
            callbacks.onGrantAwenPaper();
            inlineNotice = isEn
              ? '✅ Configured independent time-limited grant per Team Lead A-Ming: "2 Conference Figures Only · 30 Days Post-departure"!'
              : '✅ 已依阿明組長核定範圍，設定阿文「僅兩張會議圖・離開後 30 天」獨立限期授權！';
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
              inlineNotice = isEn
                ? '✅ A-Wen\'s original project folder access terminated! Check "Access Preview → A-Wen View" to verify isolation.'
                : '✅ 已終止阿文原專案資料夾權限！建議切換到「存取預覽 → 阿文視角」確認隔離效果。';
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

      const scrollToCh3Actions = () => {
        const target = $('ch3-actions-area');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
      };
      if ($('offboard-scroll-hint')) $('offboard-scroll-hint').onclick = scrollToCh3Actions;
      if ($('offboard-action-divider')) $('offboard-action-divider').onclick = scrollToCh3Actions;

      if (prevScrollTop > 0 && body) {
        body.scrollTop = prevScrollTop;
      }
    }

    render();
  }

  // ===== Chapter 3 (Internal 4): Data Cards Identification Modal (1F with Awen) =====
  function openDataCardsModal(state, callbacks) {
    activeModal = 'lookup';
    $('lookup-modal').classList.remove('hidden');
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const c = state.ch4;
    const body = $('lookup-body');
    const titleEl = $('lookup-title');
    if (titleEl) {
      titleEl.textContent = isEn
        ? '🗂️ 2F Lab Area — Identify 3 Data Cards with A-Wen'
        : '🗂️ 2F 量測實驗區 — 和阿文一起辨識三組資料卡';
    }

    let idx = c.currentCardIdx || 0;
    if (idx < 0) idx = 0;
    if (idx > 2) idx = 2;

    const cardsData = [
      {
        key: 'card1',
        title: isEn ? 'Data 1: Public Method Reproduction Log' : '資料一：公開方法重現紀錄',
        badge: isEn ? 'Card 1 / 3' : '卡片 1 / 3',
        desc: isEn
          ? 'A-Wen replicated measurements strictly following an online public tutorial. No internal proprietary modifications were made, and no undisclosed results require protection.'
          : '阿文照網路上的公開教學重做量測。本次沒有自家改良，也沒有需要保護的未公開結果。',
        optA: { label: isEn ? '📄 Retain as routine lab record.' : '📄 留作一般實驗紀錄。', correct: true },
        optB: { label: isEn ? '🔒 Include in protected inventory simply because it was conducted in lab.' : '🔒 因為在實驗室做過，就列入需保護的清單。', correct: false },
        correctMsg: isEn
          ? 'This was merely reproducing a public tutorial, so retaining it as a routine lab record is appropriate. If proprietary modifications or undisclosed results arise in the future, evaluate separately.'
          : '這次只是重現公開教學，可以保留一般實驗紀錄。下次如果做出自家改良或取得值得保護的未公開結果，就要另外判斷。',
        wrongMsg: isEn
          ? 'This batch of records only replicates a public tutorial without proprietary modifications or undisclosed findings. It does not belong in the protected R&D Records Inventory; keeping it as a routine lab record suffices. Please re-select!'
          : '這批紀錄只是照著公開教學重現，既無自家專屬改良也無未公開技術成果，無須列入需保護的研發成果清單，留作一般實驗紀錄即可。請重新選擇！'
      },
      {
        key: 'card2',
        title: isEn ? 'Data 2: Measurement Condition Optimization Log' : '資料二：量測條件優化紀錄',
        badge: isEn ? 'Card 2 / 3' : '卡片 2 / 3',
        desc: isEn
          ? 'The team independently explored a tuning method that stabilizes measurement results. The method is unpublished, and specific parameters are kept in a controlled folder.'
          : '團隊自行摸索出一套調整方法，能讓量測結果更穩定。方法還沒公開，具體參數保存在受控資料夾。',
        optA: { label: isEn ? '📑 Register as a data cluster named "Measurement Condition Optimization Log".' : '📑 以「量測條件優化紀錄」為一個資料群組登記。', correct: true },
        optB: { label: isEn ? '📝 Transcribe every single file and specific tuning parameter into the inventory.' : '📝 把每個檔案和實際調整參數都抄進清單。', correct: false },
        correctMsg: isEn
          ? 'Use data clusters to record scope, location, and owner so colleagues can find it. Technical tuning parameters remain securely in the controlled folder.'
          : '用資料群組記下範圍、位置和負責人，讓同事找得到。調整參數留在受控資料夾。',
        wrongMsg: isEn
          ? 'The inventory is an index and management catalog to guide colleagues on where to look and whom to consult; confidential parameters and raw files should remain in controlled folders, not transcribed into the inventory. Please re-select!'
          : '清單是索引與管理目錄，用來告訴同仁去哪裡找與由誰負責；機密調整參數與實驗檔案細節應留在受控資料夾，不應全部抄進清單。請重新選擇！'
      },
      {
        key: 'card3',
        title: isEn ? 'Data 3: Patented Measurement Device' : '資料三：已申請專利的量測裝置',
        badge: isEn ? 'Card 3 / 3' : '卡片 3 / 3',
        desc: isEn
          ? 'The structure and operational principle of the device have been filed for a patent application. At chapter start, the application is not yet published. There is also an independently derived device tuning log not included in the filing.'
          : '裝置的結構與原理已送件申請專利。本章開場時，申請案尚未公開。另有一份自行摸索的裝置調校紀錄，沒有納入申請。',
        optA: { label: isEn ? '📋 Log application status first; verify what is covered in the filing vs what requires separate protection.' : '📋 先記下申請狀態，確認哪些內容涵蓋在申請中，哪些仍要另外管理。', correct: true },
        optB: { label: isEn ? '🗑️ Remove entire batch from protected inventory since a patent was filed.' : '🗑️ 既然已經申請，就把整批裝置資料從需保護的清單移除。', correct: false },
        correctMsg: isEn
          ? 'Filing an application and publication are distinct milestones. Even when published in the future, protection depends on what the published document actually discloses.'
          : '已申請與已公開是不同狀態。即使日後申請案公開，也要看公開文件涵蓋哪些內容。',
        wrongMsg: isEn
          ? 'A filed patent application still requires strict confidentiality prior to publication; even after publication, only the scope covered by the published documents enters the public domain, while unpublished tuning know-how must remain protected! Do not delete the batch. Please re-select!'
          : '專利已送件申請在尚未公開前依然具有保密必要；即使日後公開，也只有公開文件涵蓋的範圍變成公開資訊，未納入申請的調校紀錄仍需繼續保護！不可直接將整批資料移除。請重新選擇！'
      }
    ];

    function renderCard() {
      const cur = cardsData[idx];
      const cardState = c.cards[cur.key];
      c.currentCardIdx = idx;

      let feedbackHtml = '';
      if (cardState.feedback) {
        const isOk = cardState.isCorrect;
        feedbackHtml = `
          <div class="${isOk ? 'inline-ok-box' : 'inline-warning-box'}" style="margin:10px 0; font-size:12.5px; line-height:1.5;">
            <strong>${isOk ? (isEn ? '✅ Feedback: ' : '✅ 回饋：') : (isEn ? '⚠ Feedback: ' : '⚠ 回饋：')}</strong>${cardState.feedback}
          </div>
        `;
      }

      let advanceBtnHtml = '';
      if (cardState.isCorrect) {
        if (idx < 2) {
          advanceBtnHtml = `
            <div style="margin-top:10px;">
              <button class="pixel-btn primary" id="btn-card-next" type="button" style="width:100%; font-weight:700;">${isEn ? `Next Data Card (${idx + 2}/3) ▶` : `下一張資料卡（${idx + 2}/3） ▶`}</button>
            </div>
          `;
        } else {
          advanceBtnHtml = `
            <div style="margin-top:10px;">
              <button class="pixel-btn primary" id="btn-card-finish" type="button" style="width:100%; font-weight:700;">${isEn ? '✅ All 3 Cards Identified; Proceed to 2F Duty PC ▶' : '✅ 三組資料辨識完成，上 2F 辦公區值班電腦 ▶'}</button>
            </div>
          `;
        }
      }

      body.innerHTML = `
        <div class="pc-card" style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h3 style="margin:0;">🗂️ ${cur.title}</h3>
            <span class="status-badge ${cardState.isCorrect ? 'ok' : 'warn'}">${cur.badge}</span>
          </div>
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:10px; font-size:13px; color:#1e293b; line-height:1.6; margin-bottom:10px;">
            <strong>${isEn ? '[ Data Content ]' : '【資料內容】'}</strong><br>${cur.desc}
          </div>
          <div style="font-size:12px; color:#64748b; margin-bottom:8px;">
            ${isEn ? '※ Key Consideration: Within the same project, boundaries differ between public info, undisclosed know-how, and patent filings. Assess by actual content and scope.' : '※ 思考重點：同一研究計畫下，公開資訊、未公開 know-how 與專利申請資料界線不同，依實際內容與範圍判斷。'}
          </div>

          <div style="display:flex; flex-direction:column; gap:8px;">
            <button class="pixel-btn ${cardState.choice === 'optA' ? (cur.optA.correct ? 'primary' : 'danger') : ''}" id="btn-card-opt-a" type="button" style="text-align:left; padding:8px 10px; font-size:12.5px;">
              ${cur.optA.label}
            </button>
            <button class="pixel-btn ${cardState.choice === 'optB' ? (cur.optB.correct ? 'primary' : 'danger') : ''}" id="btn-card-opt-b" type="button" style="text-align:left; padding:8px 10px; font-size:12.5px;">
              ${cur.optB.label}
            </button>
          </div>

          ${feedbackHtml}
          ${advanceBtnHtml}
        </div>
      `;

      function handlePick(pickKey, optObj) {
        cardState.choice = pickKey;
        if (optObj.correct) {
          cardState.isCorrect = true;
          cardState.feedback = cur.correctMsg;
          window.BS.Audio.success();
        } else {
          cardState.isCorrect = false;
          cardState.feedback = cur.wrongMsg;
          window.BS.Audio.alert();
        }
        renderCard();
      }

      $('btn-card-opt-a').onclick = () => handlePick('optA', cur.optA);
      $('btn-card-opt-b').onclick = () => handlePick('optB', cur.optB);

      if ($('btn-card-next')) {
        $('btn-card-next').onclick = () => {
          window.BS.Audio.select();
          idx++;
          renderCard();
        };
      }

      if ($('btn-card-finish')) {
        $('btn-card-finish').onclick = () => {
          c.cardsCompleted = true;
          c.stage = 'to_pc';
          window.BS.Audio.confirm();
          closeAllModals();
          if (callbacks && callbacks.onComplete) {
            callbacks.onComplete();
          }
        };
      }
    }

    renderCard();
  }

  // ===== Chapter 3 (Internal 4): R&D Asset Checklist Workbench (2F PC) =====
  function openChecklistModal(state, callbacks) {
    activeModal = 'record';
    $('record-modal').classList.remove('hidden');
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const c = state.ch4;
    const body = $('record-body');
    const titleEl = $('record-title');
    if (titleEl) titleEl.textContent = isEn ? '📋 2F Duty PC — R&D Records Inventory' : '📋 2F 值班電腦 — 研發成果清單管理系統';

    const lblName = isEn ? 'Record Name or Scope' : '資料名稱或範圍';
    const lblType = isEn ? 'Record Type' : '資料類型';
    const lblReason = isEn ? 'Reason for Protection' : '保護原因';
    const lblLocation = isEn ? 'Storage Location' : '存放位置';
    const lblPerson = isEn ? 'Person Responsible' : '負責人';

    function render() {
      const prevScrollTop = body ? body.scrollTop : 0;
      // Stage 1: Review Draft Checklist (before draft saved)
      if (!c.draftSaved) {
        let valBox = '';
        if (c.draftValidationMsg) {
          valBox = `
            <div class="inline-warning-box" style="margin-bottom:10px; font-size:12.5px;">
              ${c.draftValidationMsg}
            </div>
          `;
        }

        body.innerHTML = `
          <div class="pc-card" style="margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <h3 style="margin:0;">📋 ${isEn ? 'Research Project: StarSky Project R&D Records Inventory Draft' : '研究計畫：星空計畫（StarSky Project）研發成果清單草稿'}</h3>
              <span class="status-badge warn">${isEn ? 'Pending Scope Confirmation' : '待確認納入範圍'}</span>
            </div>
            <p style="font-size:12px; color:#475569; margin:6px 0 0; line-height:1.5;">
              ${isEn
                ? 'The inventory is an index for management and retrieval, <strong>organized by research project or data cluster</strong>, with 5 mandatory fields (Record Name or Scope, Record Type, Reason for Protection, Storage Location, Person Responsible). Detailed files and technical secrets remain securely in controlled folders.'
                : '清單是管理與查找目錄，<strong>按研究計畫或資料群組整理</strong>，每筆記錄五項必要欄位（資料名稱或範圍、資料類型、保護原因、存放位置、負責人）。檔案明細與機密技術細節留在受控資料夾。'}
            </p>
          </div>

          ${valBox}

          <div class="pc-scroll-hint-bar" id="checklist-scroll-hint" role="button" tabindex="0">
            <span class="scroll-arrow">⬇</span>
            <span>${isEn ? 'Scroll down below to review all 4 items & save draft' : '請往下捲動核對 4 項紀錄並儲存草稿'}</span>
            <span class="scroll-arrow">⬇</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:8px;">
            <!-- Group Item 1: 量測條件優化紀錄 -->
            <div class="lookup-step-card ${c.draft.optimization ? 'ok' : ''}">
              <div class="access-card-top">
                <strong>1. ${isEn ? 'StarSky Project | Measurement Condition Optimization Log' : '星空計畫｜量測條件優化紀錄'}</strong>
                <button class="pixel-btn ${c.draft.optimization ? 'primary' : ''}" id="btn-toggle-opt" type="button" style="padding:3px 8px; font-size:11.5px;">
                  ${c.draft.optimization ? (isEn ? '✓ In Inventory' : '✓ 納入清單') : (isEn ? 'Excluded' : '未納入')}
                </button>
              </div>
              <div class="rec-field-row"><span class="rec-field-label">${lblName}</span><span class="rec-field-val">${isEn ? 'StarSky Project | Measurement Condition Optimization Log' : '星空計畫｜量測條件優化紀錄'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblType}</span><span class="rec-field-val">${isEn ? 'Undisclosed Know-how' : '自研 know-how'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblReason}</span><span class="rec-field-val">${isEn ? 'Proprietary method not yet published (stabilizing measurement parameters)' : '自研方法尚未公開（讓量測更穩定之參數）'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblLocation}</span><span class="rec-field-val"><code>/TeamDrive/StarSky_Project/02_ConditionOpt/</code></span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblPerson}</span><span class="rec-field-val">${isEn ? 'A-Wen' : '阿文'}</span></div>
            </div>

            <!-- Group Item 2: 量測裝置申請資料 -->
            <div class="lookup-step-card ${c.draft.patentDevice ? 'ok' : ''}">
              <div class="access-card-top">
                <strong>2. ${isEn ? 'StarSky Project | Measurement Device Application Data' : '星空計畫｜量測裝置申請資料'}</strong>
                <button class="pixel-btn ${c.draft.patentDevice ? 'primary' : ''}" id="btn-toggle-patent" type="button" style="padding:3px 8px; font-size:11.5px;">
                  ${c.draft.patentDevice ? (isEn ? '✓ In Inventory' : '✓ 納入清單') : (isEn ? 'Excluded' : '未納入')}
                </button>
              </div>
              <div class="rec-field-row"><span class="rec-field-label">${lblName}</span><span class="rec-field-val">${isEn ? 'StarSky Project | Measurement Device Application Data' : '星空計畫｜量測裝置申請資料'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblType}</span><span class="rec-field-val">${isEn ? 'Patent Application Related Records' : '專利申請相關資料'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblReason}</span><span class="rec-field-val">${isEn ? 'Application content not yet published (Patent Application Filed, Not Yet Published)' : '本情境的申請內容尚未公開（已送件，尚未公開）'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblLocation}</span><span class="rec-field-val"><code>/TeamDrive/StarSky_Project/01_PatentDrafts/</code></span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblPerson}</span><span class="rec-field-val">${isEn ? 'A-Wen (Project Contact)' : '阿文（專案窗口）'}</span></div>
              <div style="font-size:11.5px; color:#2563eb; margin-top:4px;">📌 ${isEn ? 'Status: Patent application filed, App No. TW115-XXXXX (Not yet published)' : '狀態標記：已送件申請專利，專利案號 TW115-XXXXX（尚未公開）'}</div>
            </div>

            <!-- Group Item 3: 量測裝置調校紀錄 -->
            <div class="lookup-step-card ${c.draft.tuning ? 'ok' : ''}">
              <div class="access-card-top">
                <strong>3. ${isEn ? 'StarSky Project | Measurement Device Tuning Log' : '星空計畫｜量測裝置調校紀錄'}</strong>
                <button class="pixel-btn ${c.draft.tuning ? 'primary' : ''}" id="btn-toggle-tuning" type="button" style="padding:3px 8px; font-size:11.5px;">
                  ${c.draft.tuning ? (isEn ? '✓ In Inventory' : '✓ 納入清單') : (isEn ? 'Excluded' : '未納入')}
                </button>
              </div>
              <div class="rec-field-row"><span class="rec-field-label">${lblName}</span><span class="rec-field-val">${isEn ? 'StarSky Project | Measurement Device Tuning Log' : '星空計畫｜量測裝置調校紀錄'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblType}</span><span class="rec-field-val">${isEn ? 'Undisclosed Know-how' : '自研 know-how'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblReason}</span><span class="rec-field-val">${isEn ? 'Tuning methods unpublished and not included in patent filing' : '調校方法尚未公開，且未納入該專利申請'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblLocation}</span><span class="rec-field-val"><code>/TeamDrive/StarSky_Project/03_DeviceTuning/</code></span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblPerson}</span><span class="rec-field-val">${isEn ? 'A-Wen' : '阿文'}</span></div>
              <div style="font-size:11.5px; color:#6b7280; margin-top:4px;">📌 ${isEn ? 'Note: Excluded from patent claims; managed independently as Undisclosed Know-how' : '備註：未納入專利申請範圍，獨立作為自研 know-how 管理'}</div>
            </div>

            <!-- Candidate Item 4: 公開方法重現紀錄 -->
            <div class="lookup-step-card ${c.draft.reproduce ? 'warn' : ''}">
              <div class="access-card-top">
                <strong>4. ${isEn ? 'StarSky Project | Public Method Reproduction Log (Candidate)' : '星空計畫｜公開方法重現紀錄（候選項）'}</strong>
                <button class="pixel-btn ${c.draft.reproduce ? 'danger' : ''}" id="btn-toggle-reproduce" type="button" style="padding:3px 8px; font-size:11.5px;">
                  ${c.draft.reproduce ? (isEn ? 'Included (Click to cancel)' : '已納入（點擊取消）') : (isEn ? 'Excluded (Keep as routine record)' : '不納入（留作一般紀錄）')}
                </button>
              </div>
              <div class="rec-field-row"><span class="rec-field-label">${lblName}</span><span class="rec-field-val">${isEn ? 'StarSky Project | Public Method Reproduction Log' : '星空計畫｜公開方法重現紀錄'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblType}</span><span class="rec-field-val">${isEn ? 'Routine Lab Operational Log' : '一般實驗操作紀錄'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblReason}</span><span class="rec-field-val">${isEn ? 'Replicating public tutorial only; no proprietary improvements or secret results' : '僅重現公開教學，無自家改良與未公開結果'}</span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblLocation}</span><span class="rec-field-val"><code>/TeamDrive/StarSky_Project/00_GeneralLogs/</code></span></div>
              <div class="rec-field-row"><span class="rec-field-label">${lblPerson}</span><span class="rec-field-val">${isEn ? 'A-Wen' : '阿文'}</span></div>
              <div style="font-size:11.5px; color:#9a3412; margin-top:4px;">
                ${
                  c.draft.reproduce
                    ? (isEn ? '⚠ Hint: Replicating public tutorials belongs in routine lab logs, not the controlled R&D Records Inventory.' : '⚠ 提示：此項僅為重現公開教學，留作一般實驗紀錄即可，不應列入受控清單。')
                    : (isEn ? '💡 Status: Excluded from controlled inventory; retained as routine lab log.' : '💡 狀態：不列入受控研發成果清單，保留作一般實驗紀錄。')
                }
              </div>
            </div>
          </div>

          <div style="margin-top:12px;">
            <button class="pixel-btn primary" id="btn-save-draft" type="button" style="width:100%; font-weight:700; padding:8px 0;">
              💾 ${isEn ? 'Save & Confirm R&D Records Inventory Draft' : '儲存並確認研發成果清單草稿'}
            </button>
          </div>
        `;

        $('btn-toggle-opt').onclick = () => { c.draft.optimization = !c.draft.optimization; render(); };
        $('btn-toggle-patent').onclick = () => { c.draft.patentDevice = !c.draft.patentDevice; render(); };
        $('btn-toggle-tuning').onclick = () => { c.draft.tuning = !c.draft.tuning; render(); };
        $('btn-toggle-reproduce').onclick = () => { c.draft.reproduce = !c.draft.reproduce; render(); };

        $('btn-save-draft').onclick = () => {
          if (c.draft.reproduce) {
            c.draftValidationMsg = isEn
              ? 'The draft incorrectly includes "Public Method Reproduction Log"! This simply replicates a public tutorial without internal enhancements and belongs in routine lab logs, not the protected inventory. Please uncheck it.'
              : '草稿多列了「公開方法重現紀錄」！本情境僅為重現公開教學且無自家改良，留作一般實驗紀錄即可，無須列入保護清單。請取消納入後重存。';
            window.BS.Audio.alert();
            render();
            return;
          }
          if (!c.draft.optimization || !c.draft.patentDevice || !c.draft.tuning) {
            c.draftValidationMsg = isEn
              ? 'The draft is missing necessary proprietary results or patent application records! Undisclosed know-how and pending filings must be cataloged so colleagues know where to look and whom to consult. Please check to include them before saving.'
              : '草稿缺少了必要的自研成果或專利申請資料！自研 know-how 與未公開申請資料皆需列入清單，讓同事找得到、找誰問。請勾選納入後儲存。';
            window.BS.Audio.alert();
            render();
            return;
          }

          c.draftSaved = true;
          c.draftValidationMsg = '';
          window.BS.Audio.success();
          render();
        };

        if ($('checklist-scroll-hint')) {
          $('checklist-scroll-hint').onclick = () => {
            const btn = $('btn-save-draft');
            if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'end' });
            else body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
          };
        }
        if (prevScrollTop > 0 && body) {
          body.scrollTop = prevScrollTop;
        }
        return;
      }

      // Stage 2: Notice received & update checklist
      if (c.draftSaved && !c.updatedSaved) {
        let updateMsgHtml = '';
        if (c.updateValidationMsg) {
          updateMsgHtml = `
            <div class="inline-warning-box" style="margin-bottom:10px; font-size:12.5px;">
              ${c.updateValidationMsg}
            </div>
          `;
        }

        let updatedPreviewHtml = '';
        if (c.updateChoice === 'only_published') {
          updatedPreviewHtml = `
            <div class="inline-ok-box" style="margin:10px 0;">
              <strong>🔍 ${isEn ? 'Before / After Comparison Preview:' : '更新前後對照預覽：'}</strong>
              <div style="margin-top:6px; font-size:12px; line-height:1.6;">
                <strong>${isEn ? '【Measurement Device Application Data】(Updated in-place, no duplicate created):' : '【量測裝置申請資料】（同一筆項目更新，不重複建立）：'}</strong><br>
                • ${isEn ? 'Before: Reason "Application content not yet published" | Status "Filed, not yet published"' : '更新前：保護原因「申請內容尚未公開」｜狀態「已送件，尚未公開」'}<br>
                • ${isEn ? 'After: Reason updated to "Disclosed in published patent documents; application files retained for reference" | Status marked as "✅ Published (Device structure & principle only, Publication Date: Today 2026-11-22)"' : '更新後：保護原因改為「已公開專利文件所載內容已公開；申請文件留存備查」｜狀態標示為「✅ 已公開（僅限裝置結構與原理，公開日：今日 2026-11-22）」'}<br><br>
                <strong>${isEn ? '【Measurement Device Tuning Log】:' : '【量測裝置調校紀錄】：'}</strong><br>
                • ${isEn ? 'Status: 🔒 Excluded from filing, maintained as controlled "Undisclosed Know-how"; original protection reason and location remain active!' : '狀態：🔒 未納入申請，維持「未公開 know-how」受控管理，原保護原因與存放位置繼續有效！'}<br><br>
                <strong>${isEn ? '【Measurement Condition Optimization Log】:' : '【量測條件優化紀錄】：'}</strong><br>
                • ${isEn ? 'Status: 🔒 Proprietary know-how, continuously managed under controlled scope.' : '狀態：🔒 自研 know-how，繼續按原範圍受控管理。'}
              </div>
            </div>
            <button class="pixel-btn primary" id="btn-save-update" type="button" style="width:100%; font-weight:700; padding:8px 0; margin-top:6px;">
              ${isEn ? '💾 Save Updated R&D Records Inventory' : '💾 儲存更新後的研發成果清單'}
            </button>
          `;
        }

        body.innerHTML = `
          <div class="inline-ok-box" style="background:#eefaf4; border-color:#369364; font-size:13px; line-height:1.6; margin-bottom:10px;">
            <strong>📢 ${isEn ? 'Team Lead A-Ming Real-time System Notification (16:45):' : '阿明組長即時系統通知（16:45）：'}</strong><br>
            ${isEn
              ? '“The patent application for the measurement device published today. Disclosed documents cover device structure and principle, but not our internal tuning logs. Please update the inventory.”'
              : '「量測裝置的申請案今天公開了。公開文件有裝置的結構與原理，沒有我們內部的調校紀錄。請更新清單。」'}
          </div>

          <div class="pc-card" style="margin-bottom:8px;">
            <h3 style="margin:0 0 6px;">🔄 ${isEn ? 'Patent Application Published — Dynamic Inventory Update' : '專利申請案公開 — 研發成果清單動態更新'}</h3>
            <p style="font-size:12px; color:#475569; margin:0 0 8px;">
              ${isEn
                ? 'When data status changes, update the existing entry to clarify what has been disclosed versus what remains protected. Per Team Lead A-Ming\'s notice, choose the correct update method:'
                : '當資料狀態改變時，應更新原有項目，確認實際公開的內容與仍需保護的資料。依據阿明組長的公開通知，請選擇正確的更新方式：'}
            </p>

            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="pixel-btn ${c.updateChoice === 'only_published' ? 'primary' : ''}" id="btn-upd-only-pub" type="button" style="text-align:left; padding:8px 10px; font-size:12.5px;">
                ✅ <strong>${isEn ? 'Update Disclosed Items Only' : '只更新已公開的項目'}</strong><br>
                <small style="color:#15803d;">${isEn ? 'Update "Measurement Device Application Data" to Published; maintain unfiled "Tuning Log" and "Optimization Log" under undisclosed protection.' : '更新「量測裝置申請資料」為已公開，保留未納入申請的「調校紀錄」與「優化紀錄」為未公開保護。'}</small>
              </button>
              <button class="pixel-btn ${c.updateChoice === 'whole_project' ? 'danger' : ''}" id="btn-upd-whole-proj" type="button" style="text-align:left; padding:8px 10px; font-size:12.5px;">
                ⚠ <strong>${isEn ? 'Mark Entire Project as Disclosed' : '將整個計畫標為已公開'}</strong><br>
                <small style="color:#b91c1c;">${isEn ? 'Mark all measurement data in StarSky Project as publicly disclosed.' : '將星空計畫所有量測資料全部標記為已公開。'}</small>
              </button>
            </div>
          </div>

          ${updateMsgHtml}
          ${updatedPreviewHtml}
        `;

        $('btn-upd-whole-proj').onclick = () => {
          c.updateChoice = 'whole_project';
          c.updateValidationMsg = isEn
            ? 'Caution: Published documents only cover device structure and principle. Internal tuning logs were not included in the application and remain undisclosed know-how; condition optimization logs are also unpublished! Do not mark the entire project as disclosed. Please re-select!'
            : '注意：公開文件僅包含量測裝置的結構與原理，內部的調校紀錄並未納入專利申請，仍屬未公開 know-how，條件優化紀錄也未公開！不可將整個計畫標為已公開。請重新選擇！';
          window.BS.Audio.alert();
          render();
        };

        $('btn-upd-only-pub').onclick = () => {
          c.updateChoice = 'only_published';
          c.updateValidationMsg = '';
          window.BS.Audio.select();
          render();
        };

        if ($('btn-save-update')) {
          $('btn-save-update').onclick = () => {
            c.updatedSaved = true;
            c.stage = 'pc_updated';
            window.BS.Audio.confirm();
            window.BS.UI.showToast(isEn ? '✅ Inventory update saved! Please verify with inventory colleague Xiao-Qing at 2F Office.' : '✅ 清單更新儲存完成！請找 2F 辦公區的盤點同事小晴核對。', false, 4800);
            closeAllModals();
            if (callbacks && callbacks.onUpdate) callbacks.onUpdate();
          };
        }
        return;
      }

      // Stage 3: Saved & Updated List View
      body.innerHTML = `
        <div class="inline-ok-box" style="margin-bottom:10px;">
          ✅ <strong>${isEn ? 'StarSky Project R&D Records Inventory (Latest Version — Saved)' : '星空計畫研發成果清單（最新版本 — 已儲存）'}</strong><br>
          ${isEn ? 'Patent publication status updated in-place with complete audit trail; no redundant records created.' : '已完成專利公開狀態更新，同一筆記錄完整留痕，無重複登記。'}
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div class="lookup-step-card ok">
            <div class="access-card-top">
              <strong>1. ${isEn ? 'StarSky Project | Measurement Device Application Data' : '星空計畫｜量測裝置申請資料'}</strong>
              <span class="status-badge ok">${isEn ? '✅ Published (Device Structure & Principle)' : '✅ 已公開（裝置結構原理）'}</span>
            </div>
            <div class="rec-field-row"><span class="rec-field-label">${lblName}</span><span class="rec-field-val">${isEn ? 'StarSky Project | Measurement Device Application Data' : '星空計畫｜量測裝置申請資料'}</span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblType}</span><span class="rec-field-val">${isEn ? 'Patent Application Related Records' : '專利申請相關資料'}</span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblReason}</span><span class="rec-field-val">${isEn ? 'Disclosed in published patent documents; application files retained for reference' : '已公開專利文件所載內容已公開；申請文件留存備查'}</span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblLocation}</span><span class="rec-field-val"><code>/TeamDrive/StarSky_Project/01_PatentDrafts/</code></span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblPerson}</span><span class="rec-field-val">${isEn ? 'A-Wen (Project Contact)' : '阿文（專案窗口）'}</span></div>
            <div style="font-size:11.5px; color:#15803d; margin-top:4px;">${isEn ? 'Update Date: Today (2026-11-22) | Scope: Device structure & principle only' : '更新日期：今日（2026-11-22）｜範圍：僅限裝置結構與原理'}</div>
          </div>

          <div class="lookup-step-card ok">
            <div class="access-card-top">
              <strong>2. ${isEn ? 'StarSky Project | Measurement Device Tuning Log' : '星空計畫｜量測裝置調校紀錄'}</strong>
              <span class="status-badge ok">${isEn ? '🔒 Undisclosed Proprietary Know-how' : '🔒 未公開自研 know-how'}</span>
            </div>
            <div class="rec-field-row"><span class="rec-field-label">${lblName}</span><span class="rec-field-val">${isEn ? 'StarSky Project | Measurement Device Tuning Log' : '星空計畫｜量測裝置調校紀錄'}</span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblType}</span><span class="rec-field-val">${isEn ? 'Undisclosed Know-how' : '自研 know-how'}</span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblReason}</span><span class="rec-field-val">${isEn ? 'Tuning methods unpublished and not included in patent filing' : '調校方法尚未公開，且未納入該專利申請'}</span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblLocation}</span><span class="rec-field-val"><code>/TeamDrive/StarSky_Project/03_DeviceTuning/</code></span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblPerson}</span><span class="rec-field-val">${isEn ? 'A-Wen' : '阿文'}</span></div>
            <div style="font-size:11.5px; color:#2563eb; margin-top:4px;">${isEn ? 'Status: Excluded from filing; continuously protected under original scope' : '狀態：未納入申請，繼續按原範圍受控保護'}</div>
          </div>

          <div class="lookup-step-card ok">
            <div class="access-card-top">
              <strong>3. ${isEn ? 'StarSky Project | Measurement Condition Optimization Log' : '星空計畫｜量測條件優化紀錄'}</strong>
              <span class="status-badge ok">${isEn ? '🔒 Undisclosed Proprietary Know-how' : '🔒 未公開自研 know-how'}</span>
            </div>
            <div class="rec-field-row"><span class="rec-field-label">${lblName}</span><span class="rec-field-val">${isEn ? 'StarSky Project | Measurement Condition Optimization Log' : '星空計畫｜量測條件優化紀錄'}</span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblType}</span><span class="rec-field-val">${isEn ? 'Undisclosed Know-how' : '自研 know-how'}</span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblReason}</span><span class="rec-field-val">${isEn ? 'Proprietary method not yet published (stabilizing measurement parameters)' : '自研方法尚未公開（量測穩定度提升參數）'}</span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblLocation}</span><span class="rec-field-val"><code>/TeamDrive/StarSky_Project/02_ConditionOpt/</code></span></div>
            <div class="rec-field-row"><span class="rec-field-label">${lblPerson}</span><span class="rec-field-val">${isEn ? 'A-Wen' : '阿文'}</span></div>
          </div>
        </div>

        <div style="margin-top:12px;">
          <button class="pixel-btn primary" id="btn-close-checklist" type="button" style="width:100%; font-weight:700; padding:8px 0;">
            ${isEn ? 'Close Window and Verify Inventory with Xiao-Qing at 2F Office ▶' : '關閉視窗，找 2F 辦公區小晴核對清單 ▶'}
          </button>
        </div>
      `;

      $('btn-close-checklist').onclick = () => {
        window.BS.Audio.select();
        closeAllModals();
      };
    }

    render();
  }

  const openRecordModal = openChecklistModal;
  const openLookupModal = openDataCardsModal;

  // ===== Chapter 3 (Internal 5): Document Marking & Layout Preview System =====
  function openMarkingModal(state, callbacks) {
    activeModal = 'marking';
    $('marking-modal').classList.remove('hidden');

    const c = state.ch5;
    let activeDocIdx = c.currentDocIdx || 0;
    let lastRenderedDocIdx = -1;

    function render(forceScrollTop = false) {
      const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
      const body = $('marking-body');
      const isDocChanged = (lastRenderedDocIdx !== activeDocIdx) || forceScrollTop;
      const prevScrollTop = (!isDocChanged && body) ? body.scrollTop : 0;
      lastRenderedDocIdx = activeDocIdx;
      const doc = c.docs[activeDocIdx];
      const allCompleted = c.markingCompleted;

      const title = (isEn && doc.title_en) ? doc.title_en : doc.title;
      const typeTag = (isEn && doc.typeTag_en) ? doc.typeTag_en : doc.typeTag;
      const source = (isEn && doc.source_en) ? doc.source_en : doc.source;
      const content = (isEn && doc.content_en) ? doc.content_en : doc.content;
      const purpose = (isEn && doc.purpose_en) ? doc.purpose_en : doc.purpose;
      const placementHint = (isEn && doc.placementHint_en) ? doc.placementHint_en : doc.placementHint;
      const feedback = (isEn && doc.feedback_en) ? doc.feedback_en : doc.feedback;
      const preview = (isEn && doc.previewDetails_en) ? doc.previewDetails_en : doc.previewDetails;

      const tabsHtml = c.docs
        .map((d, idx) => {
          const isActive = idx === activeDocIdx;
          const statusText = d.isCorrect
            ? (isEn ? '✓ Completed' : '✓ 已完成')
            : d.chosenMarking
            ? (isEn ? '✕ Fix needed' : '✕ 待修正')
            : (isEn ? 'Unlabeled' : '未標示');
          const badgeCls = d.isCorrect ? 'ok' : d.chosenMarking ? 'warn' : '';
          const tabLabel = (isEn && d.title_en) ? d.title_en.split(':')[0] : d.title.split('：')[0];
          return `
            <button class="marking-tab-btn ${isActive ? 'active' : ''}" data-idx="${idx}" type="button">
              <span>${tabLabel}</span>
              <span class="badge-status ${badgeCls}">${statusText}</span>
            </button>
          `;
        })
        .join('');

      // Preview Content Generation
      let previewHtml = '';
      if (doc.id === 'poster') {
        const isConf = doc.chosenMarking === 'confidential';
        previewHtml = `
          <div class="poster-sim-card">
            ${isConf ? `<div class="slide-stamp-tag">⚠ ${isEn ? 'MISMARKED: CONFIDENTIAL' : '誤標機密 CONFIDENTIAL'}</div>` : ''}
            <div class="poster-sim-title">${preview.heading}</div>
            <div class="poster-sim-details">
              ${preview.sub}<br>
              ${isEn ? 'Agenda: R&D Highlights, Technical Discussions, Academic Exchange' : '議程：研發成果分享、專題報告、技術諮詢與產學合作交流'}
            </div>
            <div class="poster-sim-tag">${isConf ? (isEn ? 'Marked Confidential (Cannot be posted publicly)' : '已加上機密標籤（可能無法公開張貼）') : (isEn ? 'Public Promotional Edition' : '公開宣傳版（適合對外張貼與推廣）')}</div>
          </div>
        `;
      } else if (doc.id === 'slides') {
        const isConf = doc.chosenMarking === 'confidential';
        previewHtml = `
          <div class="slide-sim-wrap">
            <div class="slide-card">
              ${isConf ? `<div class="slide-stamp-tag">${isEn ? 'CONFIDENTIAL' : '機密 CONFIDENTIAL'}</div>` : ''}
              <div>
                <div style="font-size:10px; color:#38bdf8; font-weight:700;">${isEn ? '[ Title Cover Slide Preview ]' : '[ 簡報首頁封面預覽 ]'}</div>
                <div class="slide-title-txt">${preview.heading}</div>
                <div class="slide-sub-txt">${preview.sub}</div>
              </div>
              <div style="font-size:10.5px; color:#cbd5e1;">${isEn ? 'Lab Trade Secret Reasonable Safeguards' : '實驗室營業秘密合理保護措施'}</div>
            </div>
            <div class="slide-card">
              <div>
                <div style="font-size:10px; color:#38bdf8; font-weight:700;">${isEn ? '[ Slide Body & Footer Preview ]' : '[ 投影片內頁與頁腳預覽 ]'}</div>
                <div style="font-size:12px; margin-top:8px; color:#e2e8f0; line-height:1.4;">
                  • ${isEn ? 'Temperature compensation curve parameter tuning' : '溫度補償曲線參數調整演算法'}<br>
                  • ${isEn ? 'Key calibration range (undisclosed know-how)' : '關鍵靈敏度校正數值範圍（未公開）'}
                </div>
              </div>
              ${isConf ? `<div class="slide-footer-bar">${preview.footer}</div>` : `<div style="font-size:9.5px; color:#94a3b8; text-align:center;">${isEn ? '(No footer disclaimer)' : '（頁腳未標記警語）'}</div>`}
            </div>
          </div>
        `;
      } else if (doc.id === 'paper') {
        const isConf = doc.chosenMarking === 'confidential';
        previewHtml = `
          <div class="paper-sim-card">
            ${isConf ? `<div class="paper-red-stamp">${preview.stamp}</div>` : `<div style="font-size:11px; color:#71717a; margin-bottom:6px;">${isEn ? '(No Confidential Stamp)' : '（未蓋機密戳印）'}</div>`}
            <div class="paper-heading">${preview.heading}</div>
            <div class="paper-meta-row">${preview.sub}</div>
            <div class="paper-body-sketch">
              ${isEn ? '[ Page 1 / Raw Measurement Log ]' : '[第 1 頁 / 原始圖譜紀錄]'}<br>
              Sample CS-2026-A4: Peak=4.82V, Temp=77K, Baseline Offset=0.12<br>
              ※ ${isEn ? 'Note: Lock in 2F fireproof filing cabinet after use. Maintain clean desk.' : '註記：實體文件閱畢請立即收妥至 2F 防火公文櫃，落實桌面淨空。'}
            </div>
          </div>
        `;
      }

      body.innerHTML = `
        <div class="marking-tabs" id="marking-tabs">${tabsHtml}</div>

        <div class="pc-scroll-hint-bar" id="marking-scroll-hint" role="button" tabindex="0">
          <span class="scroll-arrow">⬇</span>
          <span>${isEn ? 'Scroll down below for labeling decisions and live layout preview' : '請往下捲動進行標示決策與查看即時版面預覽'}</span>
          <span class="scroll-arrow">⬇</span>
        </div>

        <div class="marking-doc-hero">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
            <h3 style="margin:0; font-size:14px; color:#0f172a;">${title}</h3>
            <span class="preview-badge-pill ${doc.isCorrect ? (doc.isConfidential ? 'confidential' : 'public') : ''}">
              ${typeTag}
            </span>
          </div>

          <div class="marking-meta-grid">
            <div class="marking-meta-item">
              <span class="marking-meta-label">${isEn ? 'Document Source' : '文件來源'}</span>
              <span class="marking-meta-val">${source}</span>
            </div>
            <div class="marking-meta-item">
              <span class="marking-meta-label">${isEn ? 'Recommended Label Placement' : '建議標示位置'}</span>
              <span class="marking-meta-val">${placementHint}</span>
            </div>
          </div>

          <div>
            <div style="font-size:11.5px; font-weight:700; color:#475569; margin-top:4px;">${isEn ? '📄 Content Review:' : '📄 文件內容檢視：'}</div>
            <div class="marking-text-block">${content}</div>
          </div>

          <div>
            <div style="font-size:11.5px; font-weight:700; color:#475569; margin-top:4px;">${isEn ? '🎯 Intended Purpose:' : '🎯 預計用途：'}</div>
            <div class="marking-text-block" style="background:#f8fafc;">${purpose}</div>
          </div>
        </div>

        <div class="marking-decision-wrap">
          <div class="marking-decision-title">
            <span>${isEn ? '🤔 Decision: Does this document require a "Confidential" label?' : '🤔 決策判斷：這份文件是否需要加上「機密（Confidential）」標示？'}</span>
          </div>

          <div class="marking-btns-row">
            <button class="marking-opt-btn opt-public ${doc.chosenMarking === 'public' ? 'selected' : ''}" id="btn-mark-public" type="button">
              <span>🔘 ${isEn ? 'Mark as 【General / Public】' : '標示為【一般 / 公開 (Public)】'}</span>
              <span class="marking-opt-hint">${isEn ? 'No undisclosed know-how. Keep promotional public layout.' : '無未公開自研 know-how，無須標註機密，維持公開版面'}</span>
            </button>
            <button class="marking-opt-btn opt-confidential ${doc.chosenMarking === 'confidential' ? 'selected' : ''}" id="btn-mark-conf" type="button">
              <span>🔒 ${isEn ? 'Mark as 【Confidential】' : '標示為【機密 (Confidential)】'}</span>
              <span class="marking-opt-hint">${isEn ? 'Contains undisclosed know-how / raw data. Mark conspicuously.' : '含未公開自研技術／原始數據，於顯著位置（封面、頁腳、首頁印記）標密'}</span>
            </button>
          </div>

          ${
            feedback
              ? `
                <div class="marking-feedback-box ${doc.isCorrect ? 'success' : 'error'}">
                  <div>${feedback}</div>
                  ${doc.isCorrect && activeDocIdx < c.docs.length - 1 ? `
                    <div style="margin-top:10px; display:flex; align-items:center; gap:8px;">
                      <button class="pixel-btn primary" id="btn-goto-next-doc" type="button" style="padding:6px 14px; font-size:12px; font-weight:700; cursor:pointer;">
                        👉 ${isEn ? 'Proceed to Next Document' : '前往下一份文件'} (${activeDocIdx + 2}/${c.docs.length}) ▶
                      </button>
                    </div>
                  ` : ''}
                </div>
              `
              : `<div style="font-size:12px; color:#64748b;">${isEn ? 'Select an option above based on content and purpose. Wrong choices receive specific feedback and can be retried immediately!' : '請依內容與用途點選上方選項。若選錯，系統會給予具體回饋並可當場重新選擇！'}</div>`
          }
        </div>

        <div class="preview-box-outer">
          <div class="preview-box-header">
            <span>👁️ ${isEn ? 'Live Layout Preview' : '即時版面預覽效果'}</span>
            <span style="color:#64748b;">${placementHint}</span>
          </div>
          ${previewHtml}
        </div>

        <div class="pc-actions" style="margin-top:14px; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; gap:6px;">
            <button class="pixel-btn" id="btn-prev-doc" type="button" ${activeDocIdx === 0 ? 'disabled' : ''}>◀ ${isEn ? 'Prev Doc' : '上一份文件'}</button>
            <button class="pixel-btn" id="btn-next-doc" type="button" ${activeDocIdx === c.docs.length - 1 ? 'disabled' : ''}>${isEn ? 'Next Doc' : '下一份文件'} ▶</button>
          </div>
          <div>
            ${
              allCompleted
                ? `<button class="pixel-btn primary" id="btn-finish-marking" type="button">🎉 ${isEn ? 'All 3 Documents Done! Hand over to Xiao-Qing ▶' : '三份文件標示已完成！去找小晴交接 ▶'}</button>`
                : `<button class="pixel-btn" id="btn-close-marking-temp" type="button">${isEn ? 'Close Workbench' : '暫時離開工作台'}</button>`
            }
          </div>
        </div>
      `;

      // Event handlers
      Array.from($('marking-tabs').children).forEach((btn) => {
        btn.onclick = () => {
          window.BS.Audio.select();
          activeDocIdx = Number(btn.dataset.idx);
          c.currentDocIdx = activeDocIdx;
          render(true);
        };
      });

      $('btn-mark-public').onclick = () => {
        window.BS.Audio.confirm();
        const res = window.BS.State.setCh5DocMarking(state, activeDocIdx, 'public');
        if (!res.isCorrect) {
          window.BS.Audio.alert();
        }
        render(false);
      };

      $('btn-mark-conf').onclick = () => {
        window.BS.Audio.confirm();
        const res = window.BS.State.setCh5DocMarking(state, activeDocIdx, 'confidential');
        if (!res.isCorrect) {
          window.BS.Audio.alert();
        }
        render(false);
      };

      if ($('btn-goto-next-doc')) {
        $('btn-goto-next-doc').onclick = () => {
          if (activeDocIdx < c.docs.length - 1) {
            window.BS.Audio.select();
            activeDocIdx++;
            c.currentDocIdx = activeDocIdx;
            render(true);
          }
        };
      }

      if ($('btn-prev-doc')) {
        $('btn-prev-doc').onclick = () => {
          if (activeDocIdx > 0) {
            window.BS.Audio.select();
            activeDocIdx--;
            c.currentDocIdx = activeDocIdx;
            render(true);
          }
        };
      }

      if ($('btn-next-doc')) {
        $('btn-next-doc').onclick = () => {
          if (activeDocIdx < c.docs.length - 1) {
            window.BS.Audio.select();
            activeDocIdx++;
            c.currentDocIdx = activeDocIdx;
            render(true);
          }
        };
      }

      if ($('btn-finish-marking')) {
        $('btn-finish-marking').onclick = () => {
          window.BS.Audio.confirm();
          closeAllModals();
          if (callbacks && callbacks.onCompleted) {
            callbacks.onCompleted();
          }
        };
      }

      if ($('btn-close-marking-temp')) {
        $('btn-close-marking-temp').onclick = () => {
          window.BS.Audio.cancel();
          closeAllModals();
        };
      }

      if ($('marking-scroll-hint')) {
        $('marking-scroll-hint').onclick = () => {
          const dec = body.querySelector('.marking-decision-wrap');
          if (dec) dec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
        };
      }

      if (body) {
        if (isDocChanged) {
          body.scrollTop = 0;
          requestAnimationFrame(() => {
            if (body) body.scrollTop = 0;
          });
        } else if (prevScrollTop > 0) {
          body.scrollTop = prevScrollTop;
        }
      }
    }

    render();

    $('btn-marking-close').onclick = () => {
      window.BS.Audio.cancel();
      closeAllModals();
    };
  }

  // ===== Field Notes / Clues Modal =====
  function openCluesModal(state) {
    activeModal = 'clues';
    $('clues-modal').classList.remove('hidden');
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';

    if (state.chapter === 5) {
      const c = state.ch5;
      const d = c.docs;
      $('clues-title').textContent = isEn
        ? '📋 Chapter 3 Notes — How to Label this Document?'
        : '📋 第三章筆記 — 這份文件要怎麼標？（SELECT）';
      $('clues-body').innerHTML = `
        <div class="section-card">
          <h3>🏢 ${isEn ? 'Mission Guidance' : '本章任務指引'}</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${isEn
              ? '<strong>2F Office / Duty PC</strong>: Review 3 documents delivered by A-Wen (event poster, tuning deck, paper log). Determine confidentiality levels and preview layouts.'
              : '<strong>2F 辦公區／值班電腦</strong>：檢視阿文交付的三份文件（活動海報、調校方法簡報、紙本量測紀錄），判定機密等級並預覽封面與頁腳／首頁印記。'}</li>
            <li>${isEn
              ? '<strong>2F Office</strong>: Hand over labeled documents to Xiao-Qing; verify custody & sharing principle ("Markings guide custody; verify recipient and rights before sharing").'
              : '<strong>2F 辦公區</strong>：將標示好的文件交接給小晴，確認保管與分享授權原則（「標示讓接手人知道怎麼處理，分享前仍要確認對象及權限」）。'}</li>
            <li>${isEn
              ? '<strong>2F Duty Desk</strong>: Complete Chapter 3 handover.'
              : '<strong>2F 值班桌</strong>：完成第三章交班。'}</li>
          </ul>
        </div>

        <div class="section-card">
          <h3>🔍 ${isEn ? 'Current Labeling & Handover Progress' : '目前標示與交接進度'}</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${d[0].isCorrect ? '✅' : '⬜'} <strong>${isEn ? 'Doc 1: Public Event Poster' : '文件一：可公開的活動海報'}</strong>：${d[0].isCorrect ? (isEn ? 'Confirmed as [General / Public]' : '已確認標示為【一般／公開】') : (isEn ? 'Pending labeling confirmation' : '尚未確認標示')}</li>
            <li>${d[1].isCorrect ? '✅' : '⬜'} <strong>${isEn ? 'Doc 2: Tuning Deck' : '文件二：含未公開調校方法的簡報'}</strong>：${d[1].isCorrect ? (isEn ? 'Marked [Confidential] on cover & footers' : '已標註【機密】於封面與每頁頁腳') : (isEn ? 'Pending labeling confirmation' : '尚未確認標示')}</li>
            <li>${d[2].isCorrect ? '✅' : '⬜'} <strong>${isEn ? 'Doc 3: Paper Log with Raw Data' : '文件三：含原始數據的紙本紀錄'}</strong>：${d[2].isCorrect ? (isEn ? 'Stamped [Confidential] with control number on cover' : '已於首頁加蓋【機密】戳印與管制編號') : (isEn ? 'Pending labeling confirmation' : '尚未確認標示')}</li>
            <li>${c.verifiedWithQing ? '✅' : '⬜'} <strong>${isEn ? 'Xiao-Qing Verification' : '小晴接手確認'}</strong>：${c.verifiedWithQing ? (isEn ? 'Xiao-Qing confirmed custody; ready for handover!' : '小晴已確認保管方式，可隨時交班！') : (isEn ? 'Visit Xiao-Qing at 2F Office for handover' : '尚未找 2F 辦公區小晴接手交接')}</li>
          </ul>
        </div>
      `;
      return;
    }

    if (state.chapter === 4) {
      const c = state.ch4;
      $('clues-title').textContent = isEn
        ? '📋 Chapter 4 Notes — Include in Inventory?'
        : '📋 第四章筆記 — 這批資料要列入清單嗎？（SELECT）';
      $('clues-body').innerHTML = `
        <div class="section-card">
          <h3>🏢 ${isEn ? 'Dual-Floor Route & Mission Guidance' : '兩層樓動線與任務指引'}</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${isEn
              ? '<strong>1F Lobby</strong>: Chat with Xiao-Qing to learn about tomorrow\'s R&D inventory task.'
              : '<strong>1F 大廳</strong>：與小晴對話，瞭解明天的研發成果盤點任務。'}</li>
            <li>${isEn
              ? '<strong>2F Lab</strong>: Find colleague A-Wen to identify 3 data cards (reproduction log, condition optimization, patented device).'
              : '<strong>2F 量測實驗區</strong>：找同事阿文辨識三組資料卡（公開方法重現、量測條件優化、已申請專利之裝置）。'}</li>
            <li>${isEn
              ? '<strong>2F Office</strong>: Visit Duty PC to review R&D Records Inventory (5 fields & data clusters); update inventory upon receiving Team Lead A-Ming\'s patent publication notice.'
              : '<strong>2F 辦公區</strong>：到值班電腦確認研發成果清單（五欄位落實與群組管理），收到阿明組長專利公開通知後及時更新清單。'}</li>
            <li>${isEn
              ? '<strong>2F Office</strong>: Verify inventory with Xiao-Qing and complete Chapter 4 handover.'
              : '<strong>2F 辦公區</strong>：找小晴核對清單並完成第四章交班。'}</li>
          </ul>
        </div>

        <div class="section-card">
          <h3>🔍 ${isEn ? 'Current Progress Status' : '目前進度狀態'}</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${c.cardsCompleted ? '✅' : '⬜'} <strong>${isEn ? '2F Data Card Identification' : '2F 資料卡辨識'}</strong>：${c.cardsCompleted ? (isEn ? 'All 3 data cards identified!' : '三組資料卡已辨識完成！') : (isEn ? 'Pending identification with A-Wen at 2F Lab.' : '尚未找 2F 量測實驗區阿文辨識三組資料卡。')}</li>
            <li>${c.draftSaved ? '✅' : '⬜'} <strong>${isEn ? '2F Inventory Draft Saved' : '2F 清單草稿儲存'}</strong>：${c.draftSaved ? (isEn ? '5-field inventory draft saved at Duty PC.' : '已在值班電腦確認五欄位清單草稿。') : (isEn ? 'Pending saving draft at 2F Duty PC.' : '尚未在 2F 值班電腦儲存清單草稿。')}</li>
            <li>${c.updatedSaved ? '✅' : '⬜'} <strong>${isEn ? '2F Patent Publication Update' : '2F 專利公開更新'}</strong>：${c.updatedSaved ? (isEn ? 'Updated device status accurately; preserved undisclosed know-how.' : '已精準更新量測裝置公開狀態，並保留未公開 know-how。') : (isEn ? 'Pending patent publication update.' : '尚未更新專利公開狀態。')}</li>
            <li>${c.verifiedWithQing ? '✅' : '⬜'} <strong>${isEn ? '2F Xiao-Qing Verification' : '2F 小晴核對'}</strong>：${c.verifiedWithQing ? (isEn ? 'Verified with Xiao-Qing; ready for handover!' : '已與小晴核對完成，可隨時交班！') : (isEn ? 'Pending verification with Xiao-Qing at 2F Office.' : '尚未找 2F 辦公區小晴核對清單。')}</li>
          </ul>
        </div>
      `;
      return;
    }

    if (state.chapter === 3) {
      const c = state.ch3;
      const pending = window.BS.State.getCh3PendingItems(state);
      $('clues-title').textContent = isEn
        ? '📋 Chapter 5 Notes — A-Wen\'s Last Day'
        : '📋 第五章筆記 — 阿文的最後一天（SELECT）';
      $('clues-body').innerHTML = `
        <div class="section-card">
          <h3>🏢 ${isEn ? 'Dual-Floor Route Map' : '雙樓層交接路線圖'}</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${isEn
              ? '<strong>2F Office</strong>: Duty PC (Handover checklist + A-Wen / Xiao-Qing access preview), Duty Desk (Handover).'
              : '<strong>2F 辦公區</strong>：值班電腦（交接清單＋阿文／小晴存取預覽）、值班桌（交班）。'}</li>
            <li>${isEn
              ? '<strong>2F Lab</strong>: A-Wen (Transfer raw log, remind confidentiality), Xiao-Qing (Test open and confirm reception), Lab PC (Inspect original vs target location).'
              : '<strong>2F 實驗區</strong>：阿文（移交原始紀錄、提醒保密義務）、小晴（實測開啟紀錄並確認接收）、實驗紀錄電腦（對照原位置與接手位置）。'}</li>
            <li>${isEn
              ? '<strong>1F Lobby</strong>: Team Lead A-Ming (Approve 30-day scope for 2 figures; or initiate admin transfer if revoked early), 1F Main Reception Desk (Collect and record A-Wen\'s physical access badge).'
              : '<strong>1F 大門大廳</strong>：阿明組長（核定兩張圖 30 天授權範圍；或誤提早停權時啟動管理員協助移交）、1F 大門接待櫃台（收回並登記阿文的實體門禁卡）。'}</li>
          </ul>
        </div>

        <div class="section-card">
          <h3>✅ ${isEn ? `Handover Checklist Status (${pending.length} Items Pending)` : `交接清單目前狀態（剩餘 ${pending.length} 項待辦）`}</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${c.rawLogLocation === 'project' ? '✅' : '⬜'} <strong>${isEn ? 'Raw Log Transfer' : '原始紀錄移交'}</strong>：<code>${c.rawLogName}</code>（${c.rawLogLocation === 'project' ? (isEn ? 'Transferred to project folder' : '已移交至專案指定位置') : (isEn ? 'Still in A-Wen personal workspace' : '仍在阿文個人工作區')}）</li>
            <li>${c.qingHasProjectAccess ? '✅' : '⬜'} <strong>${isEn ? 'Xiao-Qing Project Access' : '小晴專案存取權限'}</strong>：${c.qingHasProjectAccess ? (isEn ? 'Activated' : '已開通') : (isEn ? 'Pending activation at 2F Duty PC' : '尚未於 2F 值班電腦開通')}</li>
            <li>${c.qingConfirmedOpen ? '✅' : '⬜'} <strong>${isEn ? 'Xiao-Qing Tested Opening' : '小晴親自確認開啟'}</strong>：${c.qingConfirmedOpen ? (isEn ? 'Confirmed' : '小晴已確認接收') : (isEn ? 'Visit 2F Lab to have Xiao-Qing test opening' : '請到 2F 實驗區找小晴實測確認')}</li>
            <li>${c.clues.mingConfirmedScope ? '✅' : '⬜'} <strong>${isEn ? '1F Team Lead Approved Scope' : '1F 阿明組長核定範圍'}</strong>：${c.clues.mingConfirmedScope ? (isEn ? '2 figures only · Paper revision · 30 days post-departure' : '僅兩張會議圖・論文修訂・離開後 30 天') : (isEn ? 'Consult 1F Team Lead A-Ming downstairs' : '請下樓找 1F 阿明組長確認')}</li>
            <li>${c.awenOrigAccess === 'revoked' ? '✅' : '⬜'} <strong>${isEn ? 'Terminate A-Wen Original Access' : '終止阿文原專案權限'}</strong>：${c.awenOrigAccess === 'revoked' ? (isEn ? 'Terminated' : '已終止') : (isEn ? '🚨 Still Open!' : '🚨 仍開放中！')}</li>
            <li>${c.awenPaperGrant ? '✅' : '⬜'} <strong>${isEn ? 'Configure 2 Figures Grant' : '設定兩張圖限期授權'}</strong>：${c.awenPaperGrant ? (isEn ? 'Configured (30 days)' : '已設定（離開後 30 天）') : (isEn ? 'Not yet configured' : '尚未設定')}</li>
            <li>${c.badgeReturned ? '✅' : '⬜'} <strong>${isEn ? '1F Badge Return' : '1F 實體門禁卡收回'}</strong>：${c.badgeReturned ? (isEn ? 'Collected & logged at 1F Desk' : '已於 1F 櫃台登記收回') : (isEn ? 'Visit 1F Main Reception Desk downstairs' : '請下樓至 1F 大門接待櫃台登記')}</li>
            <li>${c.ndaRemindedToAwen ? '✅' : '⬜'} <strong>${isEn ? 'Confidentiality Reminder' : '離職保密義務提醒'}</strong>：${c.ndaRemindedToAwen ? (isEn ? 'Reminded and confirmed with A-Wen' : '已向阿文提醒確認') : (isEn ? 'Confirm reminder with A-Wen at 2F Lab' : '請找 2F 實驗區阿文確認提醒')}</li>
          </ul>
        </div>
      `;
      return;
    }

    if (state.chapter === 2) {
      const c = state.ch2;
      const wv = window.BS.State.getWorkingVersion(state);
      const wm = window.BS.State.getVersionStatusMeta(wv.status);
      $('clues-title').textContent = isEn ? '📋 Chapter 2 Notes & Poster Progress' : '📋 第二章筆記與海報進度';
      $('clues-body').innerHTML = `
        <div class="section-card">
          <h3>📌 ${isEn ? 'Chapter 2 "Night Before Submission" Tasks' : '第二章「投稿前一晚」待辦'}</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${isEn
              ? '<strong>Office PC (Poster Draft)</strong>: Inspect 3 figures, compare version diffs, replace Fig 2 & remove Fig 3, then submit for review.'
              : '<strong>辦公區電腦（海報草稿）</strong>：檢視三張示意圖、完成圖片整理（替換圖二、移除圖三）並送交阿明組長核准後提交。'}</li>
            <li><strong>${isEn ? 'Working Version' : '目前作業版本'}</strong>：<code>${wv.filename}</code>（${wm.text}）</li>
            <li><strong>${isEn ? 'Submission Progress' : '投稿進度'}</strong>：${
              c.outcome === 'in_progress'
                ? c.pendingReviewVersionId
                  ? (isEn ? 'Submitted for review; consult Team Lead A-Ming in Office' : '已送審，請找辦公區阿明組長確認核准')
                  : (isEn ? 'Reviewing (Organize figures, replace Fig 2 & remove Fig 3, then send for review)' : '審閱整理中（請替換圖二並移除圖三，送交組長審核）')
                : c.outcome === 'submitted_approved'
                ? (isEn ? '✅ Submitted approved version; return to Duty Desk for handover' : '✅ 已提交核准版本，請回值班桌填寫交班紀錄')
                : c.outcome === 'deferred'
                ? (isEn ? '⏸ Deferred submission; return to Duty Desk for handover' : '⏸ 已決定暫緩投稿，請回值班桌填寫交班紀錄')
                : c.contactedOrganizer && c.reportedToLead
                ? (isEn ? '🚒 Contacted organizer & reported to Team Lead A-Ming; return to Duty Desk for handover' : '🚒 誤傳已聯絡主辦方並回報阿明組長（公開狀態待確認），可回值班桌交班')
                : (isEn ? '🚨 Unconfirmed version uploaded! Return to PC to contact organizer and report to Team Lead A-Ming' : '🚨 誤傳未確認版本！請回電腦聯絡主辦方並找阿明組長回報')
            }</li>
          </ul>
        </div>

        <div class="section-card">
          <h3>🔍 ${isEn ? 'Gathered Clues' : '已掌握的線索'}</h3>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li>${c.openedPoster ? '✅' : '⬜'} <strong>${isEn ? 'Inspect Poster Draft' : '檢視海報草稿'}</strong>：${c.openedPoster ? (isEn ? 'Inspected 3 figures (Fig 1 public, Fig 2 pending check, Fig 3 involves patent).' : '已檢視三張示意圖（圖一可公開、圖二待確認、圖三涉及專利安排）。') : (isEn ? 'Pending PC inspection of poster draft.' : '尚未開啟辦公區電腦查看海報草稿。')}</li>
            <li>${c.clues.wenExplainedFig2 ? '✅' : '⬜'} <strong>${isEn ? 'A-Wen at Lab' : '實驗區的阿文'}</strong>：${c.clues.wenExplainedFig2 ? (isEn ? 'Fig 2 used in prior collab meeting; replacement figure obtained and unlocked on PC.' : '確認圖二原用於上次合作會議，已取得可送審替代圖（電腦已解鎖替換）。') : (isEn ? 'Ask A-Wen at Lab regarding Fig 2 origin and replacement.' : '尚未找實驗區的阿文詢問圖二來源與替代圖。')}</li>
            <li>${c.clues.mingExplainedRules ? '✅' : '⬜'} <strong>${isEn ? 'Team Lead A-Ming (Public & Patent)' : '辦公區的阿明組長（公開與專利）'}</strong>：${c.clues.mingExplainedRules ? (isEn ? 'Collab meeting figures need public release clearance; Fig 3 patent publication timing pending, remove or defer.' : '確認合作會議圖未確認公開授權不可直接放海報；圖三專利公開時點待確認，可先移除或暫緩投稿。') : (isEn ? 'Ask Team Lead A-Ming: "Which figure can be used now?".' : '尚未詢問辦公區阿明組長「現在哪張圖能用？」。')}</li>
            <li>${c.clues.mingExplainedVersion ? '✅' : '⬜'} <strong>${isEn ? 'Version Approval Procedure' : '版本確認流程'}</strong>：${c.clues.mingExplainedVersion ? (isEn ? 'Approval binds to exact reviewed version; edits require re-review; verify filename before upload.' : '核准綁定當時送審版本，核准後若再編輯須重新確認，上傳前須核對檔名。') : (isEn ? 'Ask Team Lead A-Ming: "How to confirm versions once finalized?".' : '可向辦公區阿明組長詢問「整理好之後怎麼確認版本？」。')}</li>
          </ul>
        </div>
      `;
      return;
    }

    $('clues-title').textContent = isEn ? '📋 Chapter 1 Duty Notes & Progress' : '📋 第一章值班筆記與進度';
    const c = state.clues;
    const l = state.labItems;
    const e = state.email;
    const v = state.visitor;

    $('clues-body').innerHTML = `
      <div class="section-card">
        <h3>📌 ${isEn ? 'Today\'s Duty Tasks (Any Order)' : '今日值班待辦（可任意順序處理）'}</h3>
        <ul style="margin:6px 0 0; padding-left:18px;">
          <li><strong>${isEn ? 'Partner Email (Duty PC)' : '合作方來信（辦公區電腦）'}</strong>：${
            e.status === 'unread' ? (isEn ? 'Unread email' : '尚未開信') :
            e.status === 'read' ? (isEn ? 'Read, pending decision on sharing method' : '已讀，待決定分享方式') :
            e.status === 'holding' ? (isEn ? 'Replied holding email; gather info and return to PC to send' : '已回覆確認中，補齊資訊後回電腦寄出') :
            e.misshared && !e.linkRevoked ? (isEn ? '🚨 Public link shared by mistake! Return to PC immediately to revoke and report to Team Lead A-Ming' : '🚨 誤設公開連結！請快回電腦停權並找阿明組長通報') :
            e.misshared && !e.reportedToLead ? (isEn ? '⚠ Link revoked; report incident to Team Lead A-Ming' : '⚠ 連結已停用，請找負責人阿明組長完成通報') :
            (isEn ? '✅ Resolved' : '✅ 已處理完成')
          }</li>
          <li><strong>${isEn ? 'Visitor Photos (1F Reception Desk)' : '訪客拍照（1F 大門櫃台）'}</strong>：${
            v.status === 'waiting' ? (isEn ? 'Mr. Chen waiting at 1F Reception Desk (take stairs/elevator on the left down)' : '陳先生在一樓大門櫃台等候接待（由左側樓梯／電梯下樓）') :
            v.status === 'in_lab' ? (isEn ? 'Accompanied to 2F Lab; clean whiteboard/screen/labels before re-taking photo' : '已陪同上 2F 實驗區，整理完白板／螢幕／標籤後再找陳先生重拍') :
            (isEn ? '✅ Completed reception & photo' : '✅ 已完成接待與拍攝')
          }</li>
          <li><strong>${isEn ? 'Final Handover (2F Office Duty Desk)' : '最後交班（2F 辦公區值班桌）'}</strong>：${isEn ? 'After resolving both tasks, return to 2F Duty Desk to submit handover notes!' : '兩件事處理完後，回 2F 值班桌填寫交班紀錄！'}</li>
        </ul>
      </div>

      <div class="section-card">
        <h3>🔍 ${isEn ? 'Verified Information' : '已掌握的核對資訊'}</h3>
        <ul style="margin:6px 0 0; padding-left:18px;">
          <li>${c.meetingVersion ? '✅' : '⬜'} <strong>${isEn ? 'Approved Meeting Version' : '會議用核准版本'}</strong>：${c.meetingVersion ? (isEn ? 'A-Wen prepared a 2-figure meeting edition (StarSky_Conference_Summary_Fig_v2).' : '阿文已整理只含兩張圖的會議版（StarSky_會議用摘要圖_v2）。') : (isEn ? 'Unconfirmed (ask colleague A-Wen at Lab).' : '尚未確認（可到實驗區問同事阿文）。')}</li>
          <li>${c.ndaScope ? '✅' : '⬜'} <strong>${isEn ? 'Vendor NDA Verification (NDA-CS-2026)' : '廠商 NDA 簽署查核（NDA-CS-2026）'}</strong>：${c.ndaScope ? (isEn ? 'Confirmed StarSea Tech signed valid NDA; covers 2 summary figures for Ms. Su\'s meeting only; excludes raw logs, process notes, and subcontractors.' : '已確認星海科技已簽署有效 NDA（效期內），僅涵蓋兩張摘要圖供蘇小姐開會用，不含原始數據、製程筆記與協力廠商。') : (isEn ? 'Unconfirmed whether valid NDA exists (check NDA registry on PC or consult Team Lead A-Ming).' : '尚未確認是否已簽署有效 NDA（可於電腦查詢 NDA 合約清單或詢問辦公區阿明組長）。')}</li>
          <li>${c.visitorLog ? '✅' : '⬜'} <strong>${isEn ? 'Visitor Logbook' : '訪客接待登記'}</strong>：${c.visitorLog ? (isEn ? 'Checked logbook: Approved photo at logo wall; entering lab requires full escort and no sensitive data in frame.' : '已核對登記簿：核准入口形象牆拍照；若進實驗區須全程陪同且不得拍入敏感資訊。') : (isEn ? 'Unconfirmed (inspect 1F Reception Desk).' : '尚未確認（可調查訪客入口接待處）。')}</li>
          <li>${c.visitorPurpose ? '✅' : '⬜'} <strong>${isEn ? 'Photo Purpose' : '訪客拍攝用途'}</strong>：${c.visitorPurpose ? (isEn ? 'Mr. Chen confirmed photos are for a public outreach visit report.' : '陳先生表示照片將放進對外公開的參訪紀錄報告。') : (isEn ? 'Ask visitor Mr. Chen.' : '尚未詢問訪客陳先生。')}</li>
        </ul>
      </div>

      <div class="section-card">
        <h3>🧪 ${isEn ? 'Lab Sensitive Info Check Status' : '實驗區敏感資訊檢查狀態'}</h3>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;">
          <span class="cam-tag ${l.whiteboard ? 'ok' : 'leak'}">${l.whiteboard ? (isEn ? '✓ Whiteboard Erased' : '✓ 白板已擦拭') : (isEn ? '⚠ Whiteboard Formula Exposed' : '⚠ 白板有配方參數')}</span>
          <span class="cam-tag ${l.monitor ? 'ok' : 'leak'}">${l.monitor ? (isEn ? '✓ Lab Monitor Locked' : '✓ 實驗螢幕已鎖定') : (isEn ? '⚠ Monitor Displays Raw Data' : '⚠ 實驗螢幕顯示原始數據')}</span>
          <span class="cam-tag ${l.samples ? 'ok' : 'leak'}">${l.samples ? (isEn ? '✓ Sample Labels Shielded' : '✓ 樣品標籤已收妥') : (isEn ? '⚠ Code Labels Exposed on Rack' : '⚠ 樣品架露出代碼標籤')}</span>
        </div>
      </div>
    `;
  }

  // ===== Endings Gallery Modal (Chapter 1) =====
  function openEndingsModal() {
    activeModal = 'endings';
    $('endings-modal').classList.remove('hidden');
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const unlocked = window.BS.State.loadUnlockedEndings();
    const catalog = window.BS.State.ENDINGS_CATALOG;

    const titleEl = $('endings-title');
    if (titleEl) {
      titleEl.textContent = isEn ? '🏆 Endings Gallery' : '🏆 結局圖鑑';
    }

    $('endings-body').innerHTML = `
      <p style="margin:0 0 10px; font-size:12.5px; color:#4c586e;">
        ${isEn
          ? `Chapter 1 "Before Sending" unlocked <strong>${unlocked.length} / ${catalog.length}</strong> endings. Different choices trigger different outcomes!`
          : `第一章「寄出之前」已解鎖 <strong>${unlocked.length} / ${catalog.length}</strong> 種交班結果。不同選擇會觸發不同劇情，歡迎重玩體驗！`}
      </p>
      <div class="ending-grid">
        ${catalog
          .map((item) => {
            const isOpen = unlocked.includes(item.id);
            const title = (isEn && item.title_en) ? item.title_en : item.title;
            const desc = (isEn && item.desc_en) ? item.desc_en : item.desc;
            const hint = (isEn && item.hint_en) ? item.hint_en : item.hint;
            return `
              <div class="ending-item ${isOpen ? 'unlocked' : 'locked'}">
                <div style="font-weight:800; font-size:13.5px; margin-bottom:3px;">
                  ${isOpen ? `${item.icon} ${title}` : (isEn ? `🔒 ??? (Locked)` : `🔒 ？？？（尚未解鎖）`)}
                </div>
                <div style="font-size:12px;">
                  ${isOpen ? desc : (isEn ? `Hint: ${hint}` : `提示：${hint}`)}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  // ===== Character Profiles Modal =====
  const CHARACTER_PROFILES = [
    {
      key: 'an',
      spriteKey: 'player',
      name: '小安',
      name_en: 'Xiao-An',
      title: '值班研究助理 · 玩家主角',
      title_en: 'Duty Research Assistant · Player Protagonist',
      chapter: '全章節主角（第 1 ~ 5 章）',
      chapter_en: 'All Chapters (Ch 1–5)',
      badge: '防護先鋒',
      badge_en: 'Protagonist',
      badgeClass: '',
      desc: '中央研究院 RCCI 智慧感知與前瞻運算實驗室研究助理。負責日常值班、實驗室安全規範落實、訪客接待及交接任務。在每一章面對不同情境的營業秘密與智財防護決策。',
      desc_en: 'Research Assistant at the RCCI Lab. Responsible for daily duty, lab safety protocols, visitor management, and handover tasks. Guides the team through trade secret defense decisions across all chapters.',
      keyPoint: '嚴格遵守保密守則，落實訪客 NDA 簽署、清除白板敏感公式、收拾未公開樣品、鎖定值班電腦螢幕，並在交接時核對資產與權限。',
      keyPoint_en: 'Strictly follow confidentiality rules: execute visitor NDAs, clear sensitive whiteboards, store prototypes, lock terminals, and verify handover clearances.'
    },
    {
      key: 'colleague',
      name: '阿文',
      name_en: 'A-Wen',
      title: '資深研發人員',
      title_en: 'Senior Researcher',
      chapter: '登場章節：第 2、4、5 章',
      chapter_en: 'Appears in Ch 2, 4, 5',
      badge: '研發主力',
      badge_en: 'Researcher',
      badgeClass: 'colleague',
      desc: '實驗室的資深研發主力，技術能力強且工作投入。曾面臨論文截稿壓力欲攜出未公開數據、離職前夕整理研發成果與移轉清冊，代表研發人員在效率、學術發表與保密界線間的挑戰。',
      desc_en: 'Senior core researcher at RCCI Lab. Dedicated and high-output, he experiences submission crunch deadlines and offboarding handovers, embodying the tension between research speed and IP protection.',
      keyPoint: '未公開的核心數據與演算法嚴禁以私人隨身碟或外部雲端攜出；離職前落實研發清單盤點、繳回設備並切斷系統存取權限。',
      keyPoint_en: 'Never transfer unreleased core data/code via private USBs or clouds; verify complete IP inventory, return devices, and revoke access upon departure.'
    },
    {
      key: 'lead',
      name: '阿明組長',
      name_en: 'Lead A-Ming',
      title: '實驗室負責人 · 計畫主持人',
      title_en: 'Lab Lead · Principal Investigator',
      chapter: '登場章節：第 1、2、3 章',
      chapter_en: 'Appears in Ch 1, 2, 3',
      badge: '計畫主持',
      badge_en: 'Lab Lead',
      badgeClass: 'lead',
      desc: 'RCCI 實驗室計畫主持人與法規守門人。負責統籌研發計畫、對外合作審查、保密措施制度化推動，以及產學合作合約與專利申請進度把關。',
      desc_en: 'Principal Investigator and IP gatekeeper at RCCI Lab. Oversees research roadmaps, joint venture contracts, patent filing schedules, and compliance standards.',
      keyPoint: '研發成果發表前必須評估專利申請時程，避免「先公開後申請」喪失新穎性；產學合作時嚴格把關保密條款與授權界線。',
      keyPoint_en: 'Assess patent timing before publishing to protect novelty; strictly enforce NDAs and intellectual property licensing scopes in partnerships.'
    },
    {
      key: 'qing',
      name: '小晴',
      name_en: 'Xiao-Qing',
      title: '接手研究助理 · 成果盤點員',
      title_en: 'Successor & Inventory Assistant',
      chapter: '登場章節：第 3、4、5 章',
      chapter_en: 'Appears in Ch 3, 4, 5',
      badge: '交接盤點',
      badge_en: 'Handover Lead',
      badgeClass: '',
      desc: '細心負責的研究團隊成員，負責研發文件機密等級標示、成果清單盤點與離職人員業務接手。嚴格把關每一份研發紀錄的實質保護措施。',
      desc_en: 'Meticulous research team member in charge of document sensitivity labeling, asset inventorying, and offboarding succession. Ensures rigorous protective measures for all lab assets.',
      keyPoint: '落實「合理保密措施」，明確區分機密／內部／公開文件標示，確保離職交接清單與智財權利移轉文件完整簽署並歸檔。',
      keyPoint_en: 'Enforce reasonable security measures: label docs by sensitivity tier (Secret/Internal/Public) and archive signed handover & IP transfer records.'
    },
    {
      key: 'visitor',
      name: '陳先生',
      name_en: 'Mr. Chen',
      title: '學術參訪學者 · 外部交流訪客',
      title_en: 'Visiting Scholar',
      chapter: '登場章節：第 1 章',
      chapter_en: 'Appears in Ch 1',
      badge: '外部訪客',
      badge_en: 'Guest',
      badgeClass: 'guest',
      desc: '受邀前來實驗室參觀並進行技術交流的外部訪客。對前瞻實驗器材與進行中的專案高度好奇，考驗實驗室接待流程中的保密界線與動線控管。',
      desc_en: 'External visiting scholar invited for academic exchange. Highly curious about active research setups and instruments, testing the lab\'s physical security and NDA protocols.',
      keyPoint: '外部人士進入核心研發場域前必須換證並簽署保密協定（NDA）；參訪全程專人陪同，管制拍照攝影與未經許可的接觸。',
      keyPoint_en: 'External visitors must register and sign NDAs before entering labs; provide continuous escorts and prohibit unauthorized photo-taking.'
    },
    {
      key: 'su',
      name: '蘇小姐',
      name_en: 'Ms. Su',
      title: '星芒科技業界窗口 · 產學合作經理',
      title_en: 'Industry Partner Contact',
      chapter: '登場章節：第 3 章',
      chapter_en: 'Appears in Ch 3',
      badge: '合作夥伴',
      badge_en: 'Partner',
      badgeClass: 'partner',
      desc: '業界合作夥伴「星芒科技」的研發專案經理。前來洽談產學合作案規格與技術轉移細節，代表外部企業在研發合作過程中的資訊互換與邊界維護。',
      desc_en: 'R&D Project Manager from industry partner Starlight Tech. Coordinates collaboration specs and technology transfer, representing external partner interactions and IP boundaries.',
      keyPoint: '交付合作廠商的文件必須清晰標示「機密（Confidential）」字樣、指定收受對象與用途限制，防杜合作過程中的二次擴散與外流。',
      keyPoint_en: 'Deliverables shared with partners must feature clear "Confidential" watermarks, designated recipients, and purpose-bound use clauses.'
    }
  ];

  function openCharactersModal() {
    activeModal = 'characters';
    $('characters-modal').classList.remove('hidden');
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';

    const titleEl = $('characters-title');
    if (titleEl) {
      titleEl.textContent = isEn
        ? '👥 Character Profiles — RCCI Lab Team & External Partners'
        : '👥 登場人物介紹 — RCCI 實驗室團隊與外部夥伴';
    }

    const bodyEl = $('characters-body');
    if (bodyEl) {
      bodyEl.innerHTML = `
        <p style="margin:0 0 12px; font-size:12.5px; color:#4c586e; line-height:1.5;">
          ${isEn
            ? 'Meet the <strong>6 key characters</strong> appearing across the 5 chapters. Learn their roles, lab duties, and essential trade secret protection takeaways:'
            : '本遊戲共收錄 <strong>6 位核心登場人物</strong>。了解他們在各章節的角色定位、研發職責，以及在營業秘密防護情境中的關鍵守則：'}
        </p>
        <div class="character-list">
          ${CHARACTER_PROFILES.map((c) => {
            const title = isEn ? c.title_en : c.title;
            const chapter = isEn ? c.chapter_en : c.chapter;
            const desc = isEn ? c.desc_en : c.desc;
            const badge = isEn ? c.badge_en : c.badge;
            const keyPoint = isEn ? c.keyPoint_en : c.keyPoint;
            return `
              <div class="character-card">
                <div class="character-portrait-box">
                  <canvas id="char-canvas-${c.key}" class="character-portrait-canvas" width="32" height="32" aria-label="${c.name}"></canvas>
                </div>
                <div class="character-info">
                  <div class="character-header-line">
                    <div class="character-name-group">
                      <span class="character-name">${c.name}</span>
                      <span class="character-name-en">${c.name_en}</span>
                    </div>
                    <span class="character-role-badge ${c.badgeClass || ''}">${badge}</span>
                  </div>
                  <div class="character-chapters-tag">${chapter} · ${title}</div>
                  <div class="character-bio">${desc}</div>
                  <div class="character-secret-duty">
                    <span class="duty-label">${isEn ? '🔑 Secret Defense Note: ' : '🔑 營業秘密防護職責：'}</span>${keyPoint}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Draw portraits on each canvas
      setTimeout(() => {
        CHARACTER_PROFILES.forEach((c) => {
          const cvs = document.getElementById(`char-canvas-${c.key}`);
          if (cvs && window.BS && window.BS.Sprites && window.BS.Sprites.drawPortrait) {
            window.BS.Sprites.drawPortrait(cvs, c.spriteKey || c.key);
          }
        });
      }, 0);
    }
  }

  function closeCharactersModal() {
    $('characters-modal').classList.add('hidden');
    if (activeModal === 'characters') activeModal = null;
  }

  // ===== Handover Summary Modal (Ch1, Ch2, Ch3, Ch4 & Ch5) =====
  function openHandoverModal(result, callbacks) {
    activeModal = 'handover';
    $('handover-modal').classList.remove('hidden');
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';

    if (result.chapter === 5) {
      const { banner, sections } = result;
      $('handover-title').textContent = isEn
        ? '📑 Chapter 3 Handover Notes — How to Label this Document?'
        : '📑 第三章交班紀錄 — 這份文件要怎麼標？';
      $('handover-body').innerHTML = `
        <div class="ending-banner">
          <div class="ending-label">${isEn ? 'Chapter 3 "How to Label this Document?" Handover Notes' : '第三章「這份文件要怎麼標？」交班紀錄'}</div>
          <h2>${banner.icon} ${banner.title}</h2>
          <p>${banner.desc}</p>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '1. Document Review & Confidentiality Classification' : '1. 文件內容檢視與機密判定'}</span>
            <span class="status-badge ${sections.doc.badge.cls}">${sections.doc.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.doc.detail}</p>
          <div class="reminder-quote">💡 ${sections.doc.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '2. Label Conspicuousness & Layout Preview' : '2. 標示顯著度與版面預覽落實'}</span>
            <span class="status-badge ${sections.visual.badge.cls}">${sections.visual.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.visual.detail}</p>
          <div class="reminder-quote">💡 ${sections.visual.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '3. Custody Handover & External Sharing Principles' : '3. 接手保管與對外分享確認原則'}</span>
            <span class="status-badge ${sections.handover.badge.cls}">${sections.handover.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.handover.detail}</p>
          <div class="reminder-quote">💡 ${sections.handover.reminder}</div>
        </div>

        <div class="section-card">
          <h3>${isEn ? '📘 Scenario vs Lab Trade Secret Self-Assessment Checklist' : '📘 本章情境與實驗室營業秘密自評表對照'}</h3>
          <table class="checklist-table">
            <thead>
              <tr>
                <th>${isEn ? 'Game Scenario' : '遊戲片段'}</th>
                <th>${isEn ? 'Self-Assessment Dimension' : '對應自評表構面'}</th>
                <th>${isEn ? 'Key Practiced Behavior' : '練習的關鍵行為'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${isEn ? 'Event Poster vs Tuning Slides & Paper Log' : '活動海報 vs 調校簡報與紙本紀錄'}</td>
                <td>${isEn ? 'Document Classification & Access Control' : '文件分級標示與存取管理'}</td>
                <td>${isEn ? 'Accurately determine confidentiality level based on whether undisclosed know-how is present; avoid marking everything confidential or causing leaks due to absent markings.' : '依文件內容是否含未公開自研 know-how 正確判定機密等級，避免不分輕重全數標密或未標密導致外流。'}</td>
              </tr>
              <tr>
                <td>${isEn ? 'Slide Cover/Footers & Paper Cover Stamp' : '簡報封面／頁腳與紙本首頁印記'}</td>
                <td>${isEn ? 'Document Classification & Access Control' : '文件分級標示與存取管理'}</td>
                <td>${isEn ? 'Place Confidentiality Labels conspicuously (electronic slide title cover & body footers, physical paper cover stamp), providing clear visual warnings during reading and presentation.' : '機密標示落實於顯著位置（電子簡報封面與每頁頁腳、紙本首頁加蓋印章），使閱讀與投影時皆能明確警示。'}</td>
              </tr>
              <tr>
                <td>${isEn ? 'Xiao-Qing Custody & Sharing Principle' : '小晴接手保管與分享授權原則'}</td>
                <td>${isEn ? 'Information Security & External Sharing Governance' : '資訊安全與對外分享管理'}</td>
                <td>${isEn ? 'Apply core guideline: "Markings guide custody; verify recipient and rights before sharing", preventing unauthorized re-distribution.' : '落實核心守則：「標示讓接手人知道怎麼處理，分享前仍要確認對象及權限」，防止逕自轉發。'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pc-actions" style="justify-content:center; margin-top:14px;">
          <button class="pixel-btn primary" id="btn-replay-game" type="button">${isEn ? '🔄 Replay Chapter 3' : '🔄 再玩一次第三章'}</button>
          <button class="pixel-btn" id="btn-handover-menu" type="button">${isEn ? '🏠 Return to Chapter Menu' : '🏠 返回章節選單'}</button>
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

    if (result.chapter === 4) {
      const { banner, sections } = result;
      $('handover-title').textContent = isEn
        ? '📑 Chapter 4 Handover Notes — Include in Inventory?'
        : '📑 第四章交班紀錄 — 這批資料要列入清單嗎？';
      $('handover-body').innerHTML = `
        <div class="ending-banner">
          <div class="ending-label">${isEn ? 'Chapter 4 "Include in Inventory?" Inventory Handover Notes' : '第四章「這批資料要列入清單嗎？」盤點交班紀錄'}</div>
          <h2>${banner.icon} ${banner.title}</h2>
          <p>${banner.desc}</p>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '1. Data Identification & Cluster Organization' : '1. 資料辨識與群組整理'}</span>
            <span class="status-badge ${sections.data.badge.cls}">${sections.data.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.data.detail}</p>
          <div class="reminder-quote">💡 ${sections.data.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '2. Implementation of 5 Mandatory Fields' : '2. 清單五欄位落實'}</span>
            <span class="status-badge ${sections.correction.badge.cls}">${sections.correction.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.correction.detail}</p>
          <div class="reminder-quote">💡 ${sections.correction.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '3. Dynamic Updates & Publication Boundaries' : '3. 動態更新與公開界線'}</span>
            <span class="status-badge ${sections.followup.badge.cls}">${sections.followup.badge.text}</span>
          </h3>
          <ul style="margin:4px 0; padding-left:18px;">
            ${sections.followup.items.map((t) => `<li>${t}</li>`).join('')}
          </ul>
          <div class="reminder-quote">💡 ${sections.followup.reminder}</div>
        </div>

        <div class="section-card">
          <h3>${isEn ? '📘 Scenario vs Lab Trade Secret Self-Assessment Checklist' : '📘 本章情境與實驗室營業秘密自評表對照'}</h3>
          <table class="checklist-table">
            <thead>
              <tr>
                <th>${isEn ? 'Game Scenario' : '遊戲片段'}</th>
                <th>${isEn ? 'Self-Assessment Dimension' : '對應自評表構面'}</th>
                <th>${isEn ? 'Key Practiced Behavior' : '練習的關鍵行為'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${isEn ? 'Distinguishing Proprietary Know-how vs Public Replication' : '分辨自研 know-how 與公開重現'}</td>
                <td>${isEn ? 'Document Classification & Access Control' : '文件分級標示與存取管理'}</td>
                <td>${isEn ? 'Distinguish routine lab logs, undisclosed proprietary know-how, and patent filings; catalog by cluster while keeping secret parameters in controlled folders.' : '精準區分一般實驗紀錄、未公開自研 know-how 與專利申請資料；以群組建立清單，機密參數留在受控資料夾。'}</td>
              </tr>
              <tr>
                <td>${isEn ? 'Implementing All 5 Mandatory Fields' : '落實清單五欄位'}</td>
                <td>${isEn ? 'Document Classification & Access Control' : '文件分級標示與存取管理'}</td>
                <td>${isEn ? 'Record Scope, Type, Reason for Protection, Location, and Person Responsible for every entry.' : '每筆資料清楚載明名稱範圍、類型、保護原因、存放位置與負責人，資訊完整明確。'}</td>
              </tr>
              <tr>
                <td>${isEn ? 'Dynamic Updates upon Patent Publication' : '專利公開時動態更新'}</td>
                <td>${isEn ? 'Document Classification & Access Control' : '文件分級標示與存取管理'}</td>
                <td>${isEn ? 'Upon patent publication, update original application entry in-place; retain unfiled know-how under protected status without creating duplicate entries.' : '專利公開時及時精準更新申請案紀錄，並保留未納入專利的 know-how 繼續受保護，不重複建檔。'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pc-actions" style="justify-content:center; margin-top:14px;">
          <button class="pixel-btn primary" id="btn-replay-game" type="button">${isEn ? '🔄 Replay Chapter 4' : '🔄 再玩一次第四章'}</button>
          <button class="pixel-btn" id="btn-handover-menu" type="button">${isEn ? '🏠 Return to Chapter Menu' : '🏠 返回章節選單'}</button>
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
      $('handover-title').textContent = isEn
        ? '📑 Chapter 5 Handover Notes — A-Wen\'s Last Day'
        : '📑 第五章交班紀錄 — 阿文的最後一天';
      $('handover-body').innerHTML = `
        <div class="ending-banner">
          <div class="ending-label">${isEn ? 'Chapter 5 "A-Wen\'s Last Day" Offboarding Handover Notes' : '第五章「阿文的最後一天」離職交班紀錄'}</div>
          <h2>${banner.icon} ${banner.title}</h2>
          <p>${banner.desc}</p>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '1. Research Data Transfer & Successor Verification' : '1. 研究資料移交與接手人（小晴）確認'}</span>
            <span class="status-badge ${sections.transfer.badge.cls}">${sections.transfer.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.transfer.detail}</p>
          <div class="reminder-quote">💡 ${sections.transfer.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '2. Original Access Termination & Time-Limited Grant' : '2. 原專案權限終止與兩張圖限期授權'}</span>
            <span class="status-badge ${sections.access.badge.cls}">${sections.access.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.access.detail}</p>
          <div class="reminder-quote">💡 ${sections.access.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '3. Physical Badge, Confidentiality Obligations & Pending Items' : '3. 實體門禁、保密提醒與待辦事項'}</span>
            <span class="status-badge ${sections.compliance.badge.cls}">${sections.compliance.badge.text}</span>
          </h3>
          <ul style="margin:4px 0; padding-left:18px;">
            ${sections.compliance.items.map((t) => `<li>${t}</li>`).join('')}
          </ul>
          <div class="reminder-quote">💡 ${sections.compliance.reminder}</div>
        </div>

        <div class="section-card">
          <h3>${isEn ? '📘 Scenario vs Lab Trade Secret Self-Assessment Checklist' : '📘 本章情境與實驗室營業秘密自評表對照'}</h3>
          <table class="checklist-table">
            <thead>
              <tr>
                <th>${isEn ? 'Game Scenario' : '遊戲片段'}</th>
                <th>${isEn ? 'Self-Assessment Dimension' : '對應自評表構面'}</th>
                <th>${isEn ? 'Key Practiced Behavior' : '練習的關鍵行為'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${isEn ? '2F Record Transfer & Xiao-Qing Verification' : '2F 紀錄移交與小晴實測'}</td>
                <td>${isEn ? 'Offboarding & Access Termination / Document Classification & Access Control' : '離職與權限終止作業／文件分級標示與存取管理'}</td>
                <td>${isEn ? 'Transfer personal data to designated project location before departure; have successor personally verify opening to avoid sole custody by departing staff.' : '離職前將個人區資料移交至專案指定位置，並由接手人實際確認可開啟，避免僅由離任者持有。'}</td>
              </tr>
              <tr>
                <td>${isEn ? 'Perspective Switch, Termination & Time-Limited Grant' : '切換視角、停權與限期授權'}</td>
                <td>${isEn ? 'Offboarding & Access Termination' : '離職與權限終止作業'}</td>
                <td>${isEn ? 'Terminate original project access on departure date; if ongoing paper collaboration is required, configure an independent grant with minimum scope and clear duration.' : '離職當日取消原專案權限；仍有合作論文需求者，依核准範圍另行設定最小內容與明確期限之授權。'}</td>
              </tr>
              <tr>
                <td>${isEn ? '1F Badge Return & Confidentiality Reminder' : '1F 門禁收回與保密提醒'}</td>
                <td>${isEn ? 'Offboarding & Access Termination / Physical & Environmental Security' : '離職與權限終止作業／實體環境與出入控管'}</td>
                <td>${isEn ? 'Govern physical badge return separately from electronic access; reaffirm non-disclosure obligations and data removal restrictions prior to exit.' : '門禁憑證回收與電子權限分別管制登記，離職前再次確認保密約定並提醒攜出限制。'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pc-actions" style="justify-content:center; margin-top:14px;">
          <button class="pixel-btn primary" id="btn-replay-game" type="button">${isEn ? '🔄 Replay Chapter 5' : '🔄 再玩一次第五章'}</button>
          <button class="pixel-btn" id="btn-handover-menu" type="button">${isEn ? '🏠 Return to Chapter Menu' : '🏠 返回章節選單'}</button>
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
      $('handover-title').textContent = isEn
        ? '📑 Chapter 2 Handover Notes — Night Before Submission'
        : '📑 第二章交班紀錄 — 投稿前一晚';
      $('handover-body').innerHTML = `
        <div class="ending-banner">
          <div class="ending-label">${isEn ? 'Chapter 2 "Night Before Submission" Duty Notes' : '第二章「投稿前一晚」值班紀錄'}</div>
          <h2>${banner.icon} ${banner.title}</h2>
          <p>${banner.desc}</p>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '1. Poster Submission & Strategic Decision' : '1. 海報提交與決策結果'}</span>
            <span class="status-badge ${sections.route.badge.cls}">${sections.route.badge.text}</span>
          </h3>
          <p style="margin:4px 0;">${sections.route.detail}</p>
          <div class="reminder-quote">💡 ${sections.route.reminder}</div>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '2. Poster Versioning & Approval Verification Audit' : '2. 本次海報版本與確認狀態紀錄'}</span>
            <span class="status-badge ${sections.versions.badge.cls}">${sections.versions.badge.text}</span>
          </h3>
          <ul style="margin:4px 0; padding-left:18px;">
            ${sections.versions.lines.map((l) => `<li>${l}</li>`).join('')}
          </ul>
        </div>

        <div class="section-card">
          <h3>
            <span>${isEn ? '3. Follow-up Tracking & Action Items' : '3. 後續追蹤與待辦事項'}</span>
            <span class="status-badge ${sections.followup.badge.cls}">${sections.followup.badge.text}</span>
          </h3>
          <ul style="margin:4px 0; padding-left:18px;">
            ${sections.followup.items.map((t) => `<li>${t}</li>`).join('')}
          </ul>
          <div class="reminder-quote">💡 ${sections.followup.reminder}</div>
        </div>

        <div class="section-card">
          <h3>${isEn ? '📘 Scenario vs Lab Trade Secret Management Framework' : '📘 本章情境與實驗室營業秘密管理對照'}</h3>
          <table class="checklist-table">
            <thead>
              <tr>
                <th>${isEn ? 'Game Scenario' : '遊戲片段'}</th>
                <th>${isEn ? 'Governance Dimension' : '對應管理構面'}</th>
                <th>${isEn ? 'Key Practiced Behavior' : '練習的關鍵行為'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${isEn ? 'Poster 3-Figure Inspection & Replacement' : '海報三圖檢查與換圖'}</td>
                <td>${isEn ? 'Publication & External Collaboration Governance' : '文件發表與外部合作管理'}</td>
                <td>${isEn ? 'Verify public disclosure clearance and patent arrangements prior to external publication; substitute with approved figures or remove sensitive charts.' : '對外公開前確認合作資料公開授權與專利申請安排，必要時改用核准替代圖或移除敏感圖表。'}</td>
              </tr>
              <tr>
                <td>${isEn ? 'Version Comparison & Review Approval' : '版本比較與送審核准'}</td>
                <td>${isEn ? 'Publication Governance / Access Control' : '文件發表與外部合作管理／存取管理'}</td>
                <td>${isEn ? 'Approval binds to exact reviewed version; post-approval edits mandate re-review; verify actual filename and version before uploading.' : '核准狀態綁定送審版本；核准後再修改須重新確認，提交前核對實際檔名與版本。'}</td>
              </tr>
              <tr>
                <td>${isEn ? 'Mis-upload Remediation & Incident Reporting' : '誤傳聯絡主辦方並回報'}</td>
                <td>${isEn ? 'Incident Reporting & Corrective Action Tracking' : '異常通報與改善追蹤'}</td>
                <td>${isEn ? 'Upon mis-uploading an unconfirmed version, immediately request retraction, report to supervisor, and continuously track publication status.' : '發現誤傳未確認版本時立即提出撤換請求、向負責人回報，並持續追蹤公開狀態。'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pc-actions" style="justify-content:center; margin-top:14px;">
          <button class="pixel-btn primary" id="btn-replay-game" type="button">${isEn ? '🔄 Replay Chapter 2 (Try Other Routes)' : '🔄 再玩一次第二章（挑戰其他路線）'}</button>
          <button class="pixel-btn" id="btn-handover-menu" type="button">${isEn ? '🏠 Return to Chapter Menu' : '🏠 返回章節選單'}</button>
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
    $('handover-title').textContent = isEn
      ? '📑 Chapter 1 Duty Handover Notes — Before Sending'
      : '📑 第一章值班交班紀錄 — 寄出之前';
    const { ending, unlockedCount, totalEndings, sections } = result;

    $('handover-body').innerHTML = `
      <div class="ending-banner">
        <div class="ending-label">${isEn ? `Chapter 1 Duty Complete · Ending Recorded (${unlockedCount}/${totalEndings})` : `第一章值班結束 · 結局已收錄 (${unlockedCount}/${totalEndings})`}</div>
        <h2>${ending.icon} ${ending.title}</h2>
        <p>${ending.desc}</p>
      </div>

      <div class="section-card">
        <h3>
          <span>${isEn ? '1. Whom was the data shared with?' : '1. 資料實際分享給誰？'}</span>
          <span class="status-badge ${sections.email.badge.cls}">${sections.email.badge.text}</span>
        </h3>
        <p style="margin:4px 0;">${sections.email.detail}</p>
        <div class="reminder-quote">💡 ${sections.email.reminder}</div>
      </div>

      <div class="section-card">
        <h3>
          <span>${isEn ? '2. Where did the visitor take photos?' : '2. 訪客在哪裡拍攝？'}</span>
          <span class="status-badge ${sections.visitor.badge.cls}">${sections.visitor.badge.text}</span>
        </h3>
        <p style="margin:4px 0;">${sections.visitor.detail}</p>
        <div class="reminder-quote">💡 ${sections.visitor.reminder}</div>
      </div>

      <div class="section-card">
        <h3>
          <span>${isEn ? '3. Are there follow-up incident tracking items?' : '3. 是否有需要追蹤的事件？'}</span>
          <span class="status-badge ${sections.tracking.badge.cls}">${sections.tracking.badge.text}</span>
        </h3>
        <ul style="margin:4px 0; padding-left:18px;">
          ${sections.tracking.items.map((t) => `<li>${t}</li>`).join('')}
        </ul>
        <div class="reminder-quote">💡 ${sections.tracking.reminder}</div>
      </div>

      <div class="section-card">
        <h3>${isEn ? '📘 Scenario vs Lab Trade Secret Self-Assessment Checklist' : '📘 本次情境與實驗室營業秘密自評表對照'}</h3>
        <table class="checklist-table">
          <thead>
            <tr>
              <th>${isEn ? 'Game Scenario' : '遊戲片段'}</th>
              <th>${isEn ? 'Self-Assessment Dimension' : '對應自評表構面'}</th>
              <th>${isEn ? 'Key Practiced Behavior' : '練習的關鍵行為'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${isEn ? 'Verify NDA & Reply to Partner Email' : '查核 NDA 並回覆來信'}</td>
              <td>${isEn ? 'Document Classification & Access Control / Publication & External Collaboration' : '文件分級標示與存取管理／文件發表與外部合作管理'}</td>
              <td>${isEn ? 'First verify vendor has signed valid NDA, active term, and authorized personnel; verify recipient, version, link permissions and expiry; provide only necessary data and log records.' : '先確認廠商是否已簽署有效 NDA、效期與適用對象；再確認收件者、版本、連結權限與期限，僅提供必要資料並留存紀錄。'}</td>
            </tr>
            <tr>
              <td>${isEn ? 'Visitor Reception & Photography' : '接待與拍照'}</td>
              <td>${isEn ? 'Physical & Environmental Security' : '實體環境與出入控管'}</td>
              <td>${isEn ? 'Verify logbook and intended purpose, escort per approved scope; check whiteboard, screens, and sample rack tags before taking photos.' : '確認登記與用途、依核准範圍陪同；拍照前檢查白板、螢幕與樣品標籤。'}</td>
            </tr>
            <tr>
              <td>${isEn ? 'Restrict Link & Report Incident' : '限制連結並通報'}</td>
              <td>${isEn ? 'Incident Reporting & Corrective Action Tracking' : '異常通報與改善追蹤'}</td>
              <td>${isEn ? 'Upon discovering an accidental public link, immediately revoke access to contain leak and brief Team Lead A-Ming on timestamp, data, systems, and status.' : '發現誤設公開權限時，立即停權止血並向阿明組長說明時間、資料、系統及現況。'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pc-actions" style="justify-content:center; margin-top:14px;">
        <button class="pixel-btn primary" id="btn-replay-game" type="button">${isEn ? '🔄 Replay Chapter 1' : '🔄 再玩一次第一章'}</button>
        <button class="pixel-btn" id="btn-handover-gallery" type="button">${isEn ? `🏆 Endings Gallery (${unlockedCount}/${totalEndings})` : `🏆 結局圖鑑 (${unlockedCount}/${totalEndings})`}</button>
        <button class="pixel-btn" id="btn-handover-menu" type="button">${isEn ? '🏠 Return to Chapter Menu' : '🏠 返回章節選單'}</button>
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
    $('btn-characters-close').addEventListener('click', () => {
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

  function scrollActiveModal(deltaY) {
    if (!activeModal) return false;
    const bodyMap = {
      pc: $('pc-body'),
      poster: $('poster-body'),
      offboard: $('offboard-body'),
      checklist: $('checklist-body'),
      marking: $('marking-body'),
      clues: $('clues-body'),
      endings: $('endings-body'),
      characters: $('characters-body'),
      handover: $('handover-body'),
      dataCards: $('datacards-body'),
      camera: $('camera-body')
    };
    let target = bodyMap[activeModal];
    if (!target) {
      const activeWin = document.querySelector('.modal-window:not(.hidden), .pixel-window:not(.hidden)');
      if (activeWin) {
        target = activeWin.querySelector('.window-body, .pc-body, .modal-body, .card-grid') || activeWin;
      }
    }
    if (target) {
      target.scrollBy({ top: deltaY, behavior: 'smooth' });
      return true;
    }
    return false;
  }

  window.BS.UI = {
    bindStaticHandlers,
    isOverlayOpen,
    getActiveModal: () => activeModal,
    scrollActiveModal,
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
    openDataCardsModal,
    openChecklistModal,
    openLookupModal,
    openCameraModal,
    openMarkingModal,
    openCluesModal,
    openEndingsModal,
    openCharactersModal,
    closeCharactersModal,
    openHandoverModal
  };
})();
