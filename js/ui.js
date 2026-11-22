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

  // ===== Modal Helpers =====
  function closeAllModals() {
    ['computer-modal', 'poster-modal', 'camera-modal', 'clues-modal', 'endings-modal', 'handover-modal'].forEach((id) => {
      $(id).classList.add('hidden');
    });
    activeModal = null;
  }

  // ===== Chapter 1: Computer Email & Cloud Share UI =====
  function openComputerModal(state, callbacks) {
    activeModal = 'pc';
    $('computer-modal').classList.remove('hidden');

    let selectedPayload = state.clues.meetingVersion ? 'charts_only' : 'full_folder';
    let selectedPerm = state.clues.ndaScope ? 'restricted_7d' : 'public_link';

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

      // Case 3: Normal Compose & Share Panel
      const isPublic = selectedPerm === 'public_link';
      const isFull = selectedPayload === 'full_folder';
      const previewRisky = isPublic || isFull;

      let previewHtml = '';
      if (isPublic && isFull) {
        previewHtml = `<strong>👁 收件人視角預覽：</strong>任何取得連結的人（包含被轉傳的協力廠商）都能開啟並下載 <strong>4 個檔案</strong>，內含 <code>原始量測數據</code> 與 <code>未審製程筆記</code>！`;
      } else if (isPublic && !isFull) {
        previewHtml = `<strong>👁 收件人視角預覽：</strong>雖然只有兩張會議圖，但連結設為「持連結者皆可存取」，若遭轉傳給非授權對象仍可直接開啟！`;
      } else if (!isPublic && isFull) {
        previewHtml = `<strong>👁 收件人視角預覽：</strong>僅蘇小姐可開啟，但資料夾仍包含超出會議需求的 <code>原始量測數據</code> 與 <code>未審製程筆記</code>！`;
      } else {
        previewHtml = `<strong>👁 收件人視角預覽：</strong>僅星海科技蘇小姐可唯讀檢視 <strong>2 張已核准會議圖</strong>${selectedPerm === 'restricted_7d' ? '，且 7 天後自動失效' : '（未設定到期日）'}。${state.clues.ndaScope ? '（已核對 NDA-CS-2026）' : '（尚未向阿明組長確認 NDA 涵蓋範圍）'}`;
      }

      body.innerHTML = `
        <div class="pc-grid">
          <div class="pc-card">
            <h3>✉ 合作方來信（四點會議急件）</h3>
            <div class="email-meta">寄件者：星海科技 蘇小姐 ｜ 主旨：晴空計畫 16:00 會議資料</div>
            <div class="email-content">
              「小安您好，四點就要開進度會議了！麻煩把 <strong>ClearSky_TestData 整個測試資料夾</strong>設成連結寄給我，我們開會只需要看裡面<strong>兩張結果圖</strong>，謝謝！」
            </div>
            ${e.usedHoldingReply ? '<div style="font-size:12px;color:#1d6b58;margin-bottom:6px;">✅ 你已先回覆「正在確認核准版本與範圍」，蘇小姐表示沒問題。</div>' : ''}
            <div style="font-size:12px;font-weight:700;color:#39465e;margin-bottom:4px;">📂 ClearSky_TestData 資料夾內容：</div>
            <div class="file-list">
              <div class="file-item"><span>01_會議摘要圖A.png / 02_摘要圖B.png</span><span class="file-tag safe">${state.clues.meetingVersion ? '已核准版本' : '待確認版本'}</span></div>
              <div class="file-item"><span>03_原始量測數據_RAW.csv</span><span class="file-tag secret">內部機密</span></div>
              <div class="file-item"><span>04_製程筆記_草稿.md</span><span class="file-tag unverified">未審核對外</span></div>
            </div>
            <div style="font-size:12px;color:#525f75;margin-top:6px;">
              <strong>核對狀態：</strong><br>
              • 核准版本：${state.clues.meetingVersion ? '<span style="color:#1b6e44;font-weight:700;">✅ 已問過阿文（找到會議用兩張圖）</span>' : '<span style="color:#9a5b13;">尚未確認（可到實驗區問同事阿文）</span>'}<br>
              • 保密約定：${state.clues.ndaScope ? '<span style="color:#1b6e44;font-weight:700;">✅ 已由阿明組長確認 NDA-CS-2026</span>' : '<span style="color:#9a5b13;">尚未確認（可找辦公區負責人阿明組長）</span>'}
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
      px(ctx, 110, 28, 136, 46, '#20594e');
      px(ctx, 114, 32, 128, 38, '#2f7d6d');
      ctx.fillStyle = '#e8fff9';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('明光材料實驗室', 132, 51);
      ctx.font = 'bold 9px monospace';
      ctx.fillText('LUMINA MATERIALS LAB', 127, 63);
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

  // ===== Field Notes / Clues Modal =====
  function openCluesModal(state) {
    activeModal = 'clues';
    $('clues-modal').classList.remove('hidden');

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
          <li><strong>訪客拍照（訪客入口）</strong>：${
            v.status === 'waiting' ? '陳先生在訪客入口等候接待' :
            v.status === 'in_lab' ? '已陪同進實驗區，整理完白板／螢幕／標籤後再找陳先生重拍' :
            '✅ 已完成接待與拍攝'
          }</li>
          <li><strong>最後交班（辦公區值班桌）</strong>：兩件事處理完後，回值班桌填寫交班紀錄！</li>
        </ul>
      </div>

      <div class="section-card">
        <h3>🔍 已掌握的核對資訊</h3>
        <ul style="margin:6px 0 0; padding-left:18px;">
          <li>${c.meetingVersion ? '✅' : '⬜'} <strong>會議用核准版本</strong>：${c.meetingVersion ? '阿文已整理只含兩張圖的會議版（ClearSky_會議用摘要圖_v2）。' : '尚未確認（可到實驗區問同事阿文）。'}</li>
          <li>${c.ndaScope ? '✅' : '⬜'} <strong>保密約定範圍（NDA-CS-2026）</strong>：${c.ndaScope ? '阿明組長確認僅涵蓋兩張摘要圖供星海科技開會用，不含原始數據與製程筆記，不可轉傳協力廠商。' : '尚未確認（可問辦公區負責人阿明組長）。'}</li>
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

  // ===== Handover Summary Modal (Ch1 & Ch2) =====
  function openHandoverModal(result, callbacks) {
    activeModal = 'handover';
    $('handover-modal').classList.remove('hidden');

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
              <td>回覆合作來信</td>
              <td>文件分級標示與存取管理／文件發表與外部合作管理</td>
              <td>確認收件者、版本、連結權限與期限；核對保密約定，僅提供必要資料並留存紀錄。</td>
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
    openComputerModal,
    openPosterModal,
    openCameraModal,
    openCluesModal,
    openEndingsModal,
    openHandoverModal
  };
})();
