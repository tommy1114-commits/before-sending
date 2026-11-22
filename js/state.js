(function () {
  window.BS = window.BS || {};

  const STORAGE_KEY = 'before_sending_endings_v1';

  const ENDINGS_CATALOG = [
    {
      id: 'flawless',
      icon: '🏆',
      title: '滴水不漏值班員',
      desc: '先確認核准版本與保密約定、以最小範圍與限時權限分享，且安全完成訪客拍攝。',
      hint: '找阿文與阿明組長確認後，只分享核准的兩張會議圖並設定限定對象與期限；訪客也安全完成拍照。'
    },
    {
      id: 'steady_confirm',
      icon: '🧭',
      title: '先緩後查穩健派',
      desc: '面對催件不慌張，先禮貌回覆「正在確認中」，補足核准資訊後再穩妥寄出。',
      hint: '在尚未掌握全部資訊前，先回覆合作方正在確認，再找阿文與阿明組長補齊條件後寄出。'
    },
    {
      id: 'rapid_remediation',
      icon: '🚒',
      title: '黃金止血通報者',
      desc: '雖曾誤設公開連結分享整個資料夾，但第一時間停用連結並向阿明組長完整通報四要素。',
      hint: '把整個資料夾設成公開連結寄出，觸發協力廠商轉傳詢問後，回電腦停權並找阿明組長完成通報。'
    },
    {
      id: 'shutter_save',
      icon: '📸',
      title: '快門前的覺醒',
      desc: '在實驗區相機預覽中察覺機密入鏡，立刻暫停拍攝、整理現場或改回核准角度後重拍。',
      hint: '先陪同訪客進實驗區看取景預覽，發現未處理的敏感資訊時按暫停，整理完現場或改角度再拍。'
    },
    {
      id: 'alarm_handover',
      icon: '⚠️',
      title: '交班警報響起',
      desc: '下班交班時仍留下未處置的外洩風險——幸好這是遊戲，重來一次試試不同做法吧！',
      hint: '在誤分享未補救或未遮蔽機密資訊就拍照的情況下完成交班。'
    }
  ];

  function createChapter1State() {
    return {
      chapter: 1,
      started: false,
      timeMinutes: 15 * 60 + 40, // 15:40
      introShown: false,
      clues: {
        meetingVersion: false,     // Talked to 阿文 -> unlocked approved 2 charts
        ndaCheckedInSystem: false, // Verified NDA signing list on PC
        ndaScope: false,           // Confirmed NDA signing & scope (via PC NDA check or 阿明組長)
        visitorLog: false,         // Checked 接待處 logbook -> knows approved scope
        visitorPurpose: false      // Asked 陳先生 why he wants the photo
      },
      email: {
        status: 'unread',        // 'unread' | 'read' | 'holding' | 'sent_safe' | 'sent_unverified' | 'misshared_active' | 'misshared_remediated'
        usedHoldingReply: false,
        sentPayload: null,       // 'charts_only' | 'full_folder'
        sentPermission: null,    // 'restricted_7d' | 'restricted_noexp' | 'public_link'
        sentWithNdaCheck: false,
        misshared: false,
        followupArrived: false,
        linkRevoked: false,
        reportedToLead: false,
        reportComplete: false,
        sentSafeAfterFix: false,
        misshareTimeStr: null
      },
      visitor: {
        status: 'waiting',       // 'waiting' | 'in_lab' | 'done_entrance' | 'done_lab_clean' | 'done_lab_leaked'
        pausedAndFixed: false,
        leakedItems: [],
        photoSpot: null
      },
      labItems: {
        whiteboard: false,
        monitor: false,
        samples: false
      },
      handoverDone: false
    };
  }

  function describeVersionSlots(slots) {
    const p1 = '圖一：設備配置示意（保留）';
    const p2 = slots.fig2 === 'alt' ? '圖二：自研校準趨勢示意圖（已替換）' : '圖二：合作方量測圖（原圖保留）';
    const p3 = slots.fig3 === 'removed' ? '圖三：測試條件與結果摘要（已移除）' : '圖三：測試條件與結果摘要（原圖保留）';
    return `${p1}／${p2}／${p3}`;
  }

  function createChapter2State() {
    const v1Slots = { fig1: 'orig', fig2: 'orig', fig3: 'orig' };
    return {
      chapter: 2,
      started: false,
      timeMinutes: 18 * 60, // 18:00
      introShown: false,
      ch2: {
        openedPoster: false,
        clues: {
          wenExplainedFig2: false,   // Talked to 阿文 -> knows fig2 is from cooperation meeting & unlocks alt fig
          hasReplacementFig2: false,
          mingExplainedRules: false, // Talked to 阿明組長 -> knows fig2 public check & fig3 patent status
          mingExplainedVersion: false
        },
        versions: [
          {
            id: 'v1',
            num: 1,
            filename: 'Poster_v1_原始草稿.pdf',
            label: '原始草稿 v1',
            slots: v1Slots,
            status: 'unapproved', // 'unapproved' | 'draft_unreviewed' | 'needs_reapproval' | 'pending_review' | 'approved'
            summary: describeVersionSlots(v1Slots),
            approvedBy: null,
            approvedAt: null
          }
        ],
        nextVersionNum: 2,
        workingVersionId: 'v1',
        pendingReviewVersionId: null,
        lastApprovedVersionId: null,
        outcome: 'in_progress', // 'in_progress' | 'submitted_approved' | 'deferred' | 'misuploaded'
        submittedVersionId: null,
        submittedFilename: null,
        submittedTimeStr: null,
        deferredReasons: [],
        deferredNextStep: '',
        misuploaded: false,
        misuploadTimeStr: null,
        contactedOrganizer: false,
        contactedOrganizerTimeStr: null,
        reportedToLead: false
      },
      handoverDone: false
    };
  }

  function createStateForChapter(chapter) {
    return chapter === 2 ? createChapter2State() : createChapter1State();
  }

  function createInitialState() {
    return createChapter1State();
  }

  function formatClock(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // ===== Chapter 2 Version Management =====
  function getWorkingVersion(state) {
    const c = state.ch2;
    return c.versions.find((v) => v.id === c.workingVersionId) || c.versions[0];
  }

  function getVersionById(state, id) {
    return state.ch2.versions.find((v) => v.id === id) || null;
  }

  function getVersionStatusMeta(status) {
    switch (status) {
      case 'approved':
        return { text: '已核准（阿明組長確認）', badgeCls: 'ok', diffCls: 'safe' };
      case 'pending_review':
        return { text: '待阿明組長確認', badgeCls: 'warn', diffCls: 'warn' };
      case 'needs_reapproval':
        return { text: '待重新確認（核准後已修改）', badgeCls: 'warn', diffCls: 'warn' };
      case 'draft_unreviewed':
        return { text: '編輯中（尚未送審）', badgeCls: 'warn', diffCls: 'warn' };
      default:
        return { text: '未確認可公開', badgeCls: 'danger', diffCls: 'danger' };
    }
  }

  function getVersionIssues(version, clues) {
    const issues = [];
    if (version.slots.fig2 === 'orig') {
      issues.push(
        clues && clues.wenExplainedFig2
          ? '圖二「合作方量測圖」（曾用於合作會議，未確認可用於公開海報，可替換為阿文提供的替代圖）'
          : '圖二「合作方量測圖」（來源與公開授權待確認，可先找實驗區的阿文確認）'
      );
    }
    if (version.slots.fig3 === 'orig') {
      issues.push(
        clues && clues.mingExplainedRules
          ? '圖三「測試條件與結果摘要」（專利申請安排與公開時點尚待確認，可先從公開版移除或暫緩投稿）'
          : '圖三「測試條件與結果摘要」（涉及尚待確認的專利申請安排，可先問辦公區的阿明組長）'
      );
    }
    return issues;
  }

  function applyPosterEdit(state, patch) {
    const c = state.ch2;
    const current = getWorkingVersion(state);
    const nextSlots = {
      fig1: current.slots.fig1,
      fig2: patch.fig2 !== undefined ? patch.fig2 : current.slots.fig2,
      fig3: patch.fig3 !== undefined ? patch.fig3 : current.slots.fig3
    };

    // No actual change
    if (nextSlots.fig2 === current.slots.fig2 && nextSlots.fig3 === current.slots.fig3) {
      return current;
    }

    const hasAnyApproved = c.versions.some((v) => v.status === 'approved');
    const isImmutable =
      current.id === 'v1' ||
      current.status === 'approved' ||
      current.status === 'pending_review';

    if (isImmutable) {
      const num = c.nextVersionNum++;
      const newStatus = hasAnyApproved ? 'needs_reapproval' : 'draft_unreviewed';
      const newVersion = {
        id: `v${num}`,
        num,
        filename: `Poster_v${num}_編輯版.pdf`,
        label: hasAnyApproved ? `修訂版 v${num}（待重新確認）` : `編輯版 v${num}`,
        slots: nextSlots,
        status: newStatus,
        summary: describeVersionSlots(nextSlots),
        approvedBy: null,
        approvedAt: null
      };
      c.versions.push(newVersion);
      c.workingVersionId = newVersion.id;
      return newVersion;
    } else {
      current.slots = nextSlots;
      current.summary = describeVersionSlots(nextSlots);
      current.status = hasAnyApproved ? 'needs_reapproval' : 'draft_unreviewed';
      return current;
    }
  }

  function submitWorkingForReview(state) {
    const c = state.ch2;
    const current = getWorkingVersion(state);
    const issues = getVersionIssues(current, c.clues);
    if (issues.length > 0) {
      return { ok: false, issues, version: current };
    }
    if (current.status === 'approved') {
      return { ok: true, alreadyApproved: true, version: current };
    }
    // Mark previous pending review back to draft if another superseded it
    c.versions.forEach((v) => {
      if (v.status === 'pending_review' && v.id !== current.id) {
        v.status = 'draft_unreviewed';
      }
    });
    current.status = 'pending_review';
    current.filename = `Poster_${current.id}_送審版.pdf`;
    current.label = `送審版 ${current.id}`;
    c.pendingReviewVersionId = current.id;
    return { ok: true, alreadyApproved: false, version: current };
  }

  function approvePendingVersion(state) {
    const c = state.ch2;
    if (!c.pendingReviewVersionId) return null;
    const target = getVersionById(state, c.pendingReviewVersionId);
    if (!target) return null;
    target.status = 'approved';
    target.filename = `Poster_${target.id}_核准版.pdf`;
    target.label = `核准版 ${target.id}`;
    target.approvedBy = '阿明組長';
    target.approvedAt = formatClock(state.timeMinutes);
    c.lastApprovedVersionId = target.id;
    c.pendingReviewVersionId = null;
    return target;
  }

  // ===== Chapter 1 Endings Persistence =====
  function loadUnlockedEndings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function unlockEnding(id) {
    const list = loadUnlockedEndings();
    if (!list.includes(id)) {
      list.push(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch {
        // ignore storage restrictions
      }
    }
    return list;
  }

  function getExposedLabItems(state) {
    if (state.chapter !== 1) return [];
    const exposed = [];
    if (!state.labItems.whiteboard) exposed.push('白板研究參數');
    if (!state.labItems.monitor) exposed.push('實驗螢幕原始數據');
    if (!state.labItems.samples) exposed.push('樣品代碼標籤');
    return exposed;
  }

  function isEmailResolved(state) {
    return (
      state.email.status === 'sent_safe' ||
      state.email.status === 'sent_unverified' ||
      state.email.status === 'misshared_remediated'
    );
  }

  function isVisitorResolved(state) {
    return (
      state.visitor.status === 'done_entrance' ||
      state.visitor.status === 'done_lab_clean' ||
      state.visitor.status === 'done_lab_leaked'
    );
  }

  function canHandover(state) {
    if (state.chapter === 2) {
      return state.ch2.outcome !== 'in_progress';
    }
    const emailTouched =
      state.email.status !== 'unread' &&
      state.email.status !== 'read' &&
      state.email.status !== 'holding';
    return emailTouched && isVisitorResolved(state);
  }

  // ===== Chapter 1 Handover Evaluation =====
  function evaluateHandover(state) {
    if (state.chapter === 2) {
      return evaluateChapter2Handover(state);
    }

    const e = state.email;
    const v = state.visitor;

    const emailHasRisk =
      (e.misshared && (!e.linkRevoked || !e.reportedToLead)) ||
      (!e.misshared && e.sentPermission === 'public_link');
    const visitorHasRisk = v.status === 'done_lab_leaked';

    let endingId = 'flawless';
    if (emailHasRisk || visitorHasRisk) {
      endingId = 'alarm_handover';
    } else if (e.misshared && e.linkRevoked && e.reportedToLead) {
      endingId = 'rapid_remediation';
    } else if (v.pausedAndFixed) {
      endingId = 'shutter_save';
    } else if (e.usedHoldingReply && e.status === 'sent_safe') {
      endingId = 'steady_confirm';
    } else if (e.status === 'sent_safe' && !visitorHasRisk) {
      endingId = 'flawless';
    } else {
      endingId = 'steady_confirm';
    }

    const unlockedNow = unlockEnding(endingId);
    const ending = ENDINGS_CATALOG.find((x) => x.id === endingId) || ENDINGS_CATALOG[0];

    let emailBadge = { text: '妥善完成', cls: 'ok' };
    let emailDetail = '';
    let emailReminder = '「寄出前，用收件人的角度確認連結誰能開啟、包含哪些檔案。」';

    if (e.misshared) {
      if (e.linkRevoked && e.reportedToLead) {
        emailBadge = { text: '誤分享已止血並通報', cls: 'warn' };
        emailDetail =
          `原本將整個 ClearSky_TestData 資料夾（含原始量測數據與製程筆記）設為「持連結者皆可存取」寄給星海科技蘇小姐。發現對方詢問是否轉傳協力廠商後，已於電腦停用公開連結，並向阿明組長完成通報（含發現時間 ${e.misshareTimeStr || '15:50'}、涉及檔案、雲端連結系統與目前處置）。` +
          (e.sentSafeAfterFix ? ' 後續亦已改寄核准的會議用兩張圖。' : '');
        emailReminder = '「發現誤設公開權限時，第一時間先停權止血，再清楚向阿明組長通報四要素：時間、資料、系統與現況。」';
      } else {
        emailBadge = { text: '外洩風險未完成處置', cls: 'danger' };
        emailDetail =
          `將測試資料夾設為不當權限寄給合作方，且收到對方詢問是否能轉傳協力廠商。目前` +
          `${e.linkRevoked ? '已停用連結，但尚未向阿明組長通報' : '公開連結仍未停用，且尚未完成通報'}。`;
        emailReminder = '「公開連結一旦發出，任何收到連結的人都可能開啟或轉傳；發現異常務必立即撤銷權限並通報。」';
      }
    } else if (e.status === 'sent_safe') {
      const expText = e.sentPermission === 'restricted_7d' ? '指定收件人唯讀、7 天效期' : '指定收件人唯讀（建議加設效期）';
      emailBadge = { text: '已確認NDA並合規分享', cls: 'ok' };
      emailDetail =
        `寄出前已確認星海科技已簽署有效保密協議（NDA-CS-2026，仍在效期內），並核對核准版本（僅圖A、圖B），限定分享給星海科技蘇小姐（權限：${expText}），未夾帶原始量測數據或製程筆記。` +
        (e.usedHoldingReply ? ' 期間並先回覆確認中，避免倉促寄出。' : '');
      emailReminder = e.sentPermission === 'restricted_7d'
        ? '「與廠商交流資料前，第一步先確認是否已簽署有效 NDA 與涵蓋範圍，再僅給最小必要檔案並設效期，就是最穩妥的防護。」'
        : '「已先確認 NDA 簽署並指定收件人很好！若能順手加上分享期限，就能避免會議結束後連結長期有效。」';
    } else {
      emailBadge = { text: '未確認NDA簽署', cls: 'warn' };
      emailDetail =
        `僅分享了會議用兩張圖給蘇小姐（未夾帶原始數據），但寄出前尚未確認星海科技是否已簽署有效 NDA（保密協議）及其涵蓋對象與用途。`;
      emailReminder = '「與廠商交流研究資料前，務必先確認對方是否已簽署有效 NDA、仍在效期內，且涵蓋這次提供的資料與對象！」';
    }

    let visitorBadge = { text: '合規完成', cls: 'ok' };
    let visitorDetail = '';
    let visitorReminder = '「拍照前不只看構圖，更要掃視背景的白板、螢幕與樣品標籤。」';

    if (v.status === 'done_entrance') {
      visitorBadge = { text: '核准範圍拍攝', cls: 'ok' };
      visitorDetail =
        `依接待登記核准範圍，引導陳先生在訪客入口指定角度拍攝形象牆合照，完全未揭露實驗區內研究資訊。` +
        (v.pausedAndFixed ? '（途中先在實驗區預覽發現入鏡風險，果斷改回核准角度拍攝。）' : '');
      visitorReminder = '「入口指定角度既能滿足參訪留念，又能自然隔絕實驗區內的敏感資訊。」';
    } else if (v.status === 'done_lab_clean') {
      visitorBadge = { text: '陪同並完成清場', cls: 'ok' };
      visitorDetail =
        `全程陪同陳先生進入實驗區，拍攝前已將白板研究參數、實驗螢幕畫面與樣品代碼標籤全數擦拭／鎖定／收妥，取景畫面乾淨無外洩風險。` +
        (v.pausedAndFixed ? '（在預覽時即時喊卡整理現場，成功避免外洩！）' : '');
      visitorReminder = '「訪客進實驗區務必全程陪同，按下快門前逐一檢查白板、螢幕與樣品標籤。」';
    } else {
      visitorBadge = { text: '敏感資訊入鏡', cls: 'danger' };
      visitorDetail =
        `陪同陳先生在實驗區拍照時，畫面拍入了未遮蔽的敏感資訊：${v.leakedItems.join('、')}。訪客表示照片將用於對外參訪報告，存在外洩風險。`;
      visitorReminder = '「發現鏡頭內有研究數據或標籤時，禮貌暫停拍攝並先收妥遮蔽，才是對雙方最好的保護。」';
    }

    let trackBadge = { text: '無待追蹤異常', cls: 'ok' };
    let trackItems = [];
    let trackReminder = '「留下實際提供的版本、對象與處置紀錄，未來需要追溯時就能有憑有據。」';

    if (e.misshared) {
      if (e.linkRevoked && e.reportedToLead) {
        trackBadge = { text: '有待追蹤事項（已立案）', cls: 'warn' };
        trackItems.push('【誤分享追蹤】協力廠商是否已取得或下載原始檔案，待阿明組長與星海科技窗口進一步確認。');
        trackItems.push('【紀錄留存】已記錄原始分享範圍（公開連結）、停權時間與通報四要素。');
      } else {
        trackBadge = { text: '緊急異常未處理', cls: 'danger' };
        if (!e.linkRevoked) trackItems.push('【緊急】公開分享連結仍處於啟用狀態，須立即停用！');
        if (!e.reportedToLead) trackItems.push('【緊急】尚未向負責人阿明組長通報誤分享事件。');
        trackItems.push('【風險】合作方已詢問是否可轉傳協力廠商，須儘速確認擴散範圍。');
      }
      trackReminder = '「發生疑似外洩時不要自行默默刪掉就算了；及早通報並留存紀錄，才能真正控制影響範圍。」';
    }

    if (v.status === 'done_lab_leaked') {
      trackBadge = { text: '異常照片需追蹤', cls: 'danger' };
      trackItems.push(`【拍攝外洩】訪客照片拍入「${v.leakedItems.join('、')}」，須立刻向阿明組長通報並協調訪客刪除原檔。`);
    }

    if (trackItems.length === 0) {
      trackItems.push('今日兩項任務皆依規範完成，已留存分享版本／對象／效期紀錄與訪客接待紀錄，無異常事件須追蹤。');
      if (e.status === 'sent_safe' && e.sentPermission === 'restricted_7d') {
        trackItems.push('【例行提醒】7 天後分享連結將自動失效，屆時可再確認專案資料夾授權名單。');
      }
    }

    return {
      chapter: 1,
      ending,
      unlockedCount: unlockedNow.length,
      totalEndings: ENDINGS_CATALOG.length,
      sections: {
        email: { badge: emailBadge, detail: emailDetail, reminder: emailReminder },
        visitor: { badge: visitorBadge, detail: visitorDetail, reminder: visitorReminder },
        tracking: { badge: trackBadge, items: trackItems, reminder: trackReminder }
      }
    };
  }

  // ===== Chapter 2 Handover Evaluation =====
  function evaluateChapter2Handover(state) {
    const c = state.ch2;
    const submittedVer = c.submittedVersionId ? getVersionById(state, c.submittedVersionId) : null;
    const approvedVers = c.versions.filter((v) => v.status === 'approved');

    let banner = {
      icon: '✅',
      title: '核准後提交完成',
      desc: '已整理海報、取得阿明組長確認，並正確核對檔名後提交核准版本。'
    };
    let routeBadge = { text: '已提交核准版', cls: 'ok' };
    let routeDetail = '';
    let routeReminder =
      '「這張圖上次用於合作會議。放進公開海報前，要確認合作約定是否涵蓋公開用途，也要核對最後上傳的版本。」';

    let versionBadge = { text: '版本紀錄完整', cls: 'ok' };
    let versionLines = c.versions.map((v) => {
      const m = getVersionStatusMeta(v.status);
      return `${v.filename}（${m.text}）— ${v.summary}`;
    });

    let followBadge = { text: '無待處理異常', cls: 'ok' };
    let followItems = [];
    let followReminder = '「對外發表前保留核准版本與確認紀錄，核准後若再修改，就必須視為新版本重新確認。」';

    if (c.outcome === 'submitted_approved' && submittedVer) {
      banner = {
        icon: '🏅',
        title: '核准後穩妥提交',
        desc: '找阿文取得替代圖、移除專利待確認的圖三，經阿明組長核准後正確上傳核准版海報。'
      };
      routeBadge = { text: '核准後提交', cls: 'ok' };
      routeDetail = `實際提交檔案：${submittedVer.filename}（提交時間：${c.submittedTimeStr || '18:20'}）。核准狀態：已由${submittedVer.approvedBy || '阿明組長'}於 ${submittedVer.approvedAt || '18:15'} 確認核准。內容：${submittedVer.summary}。`;
      followItems.push('已留存最終核准版海報與阿明組長確認紀錄，可直接備查。');
      followItems.push('圖三「測試條件與結果摘要」待日後專利申請安排確定後，再評估後續公開時機。');
    } else if (c.outcome === 'deferred') {
      banner = {
        icon: '⏸️',
        title: '審慎暫緩投稿',
        desc: '發現合作資料公開用途或專利申請安排尚待確認，選擇先暫緩上傳，避免未核准資訊對外公開。'
      };
      routeBadge = { text: '暫緩提交', cls: 'warn' };
      const reasons = c.deferredReasons.length > 0
        ? c.deferredReasons
        : ['圖二「合作方量測圖」（合作會議用途是否涵蓋公開海報尚待確認）', '圖三「測試條件與結果摘要」（專利申請安排與公開時點尚待確認）'];
      routeDetail = `本次尚未上傳海報。暫緩原因：${reasons.join('；')}。`;
      routeReminder = '「趕在截止前草率上傳反而風險最大；確認不到公開授權或專利安排時，暫緩提交並記下下一步才是穩妥做法。」';
      followBadge = { text: '待後續確認', cls: 'warn' };
      followItems.push(`【待確認圖片】${reasons.join('；')}`);
      followItems.push(`【下一步行動】${c.deferredNextStep || '請阿文準備公開替代圖、並與阿明組長確認合作契約公開條款及專利申請時程後，再重新送審。'}`);
    } else if (c.outcome === 'misuploaded') {
      const fullyRemediated = c.contactedOrganizer && c.reportedToLead;
      if (fullyRemediated) {
        banner = {
          icon: '🚒',
          title: '誤傳舊版後即時補救',
          desc: '發現誤傳未確認版本後，已聯絡主辦方提出撤換請求並向阿明組長回報，持續追蹤公開狀態。'
        };
        routeBadge = { text: '誤傳已啟動補救', cls: 'warn' };
        followBadge = { text: '公開狀態待確認', cls: 'warn' };
      } else {
        banner = {
          icon: '⚠️',
          title: '誤傳海報尚待補救',
          desc: '已上傳未確認可公開的版本，且交班時仍有補救步驟尚未完成！'
        };
        routeBadge = { text: '誤傳未完成補救', cls: 'danger' };
        followBadge = { text: '緊急事項未處理', cls: 'danger' };
      }

      const subMeta = submittedVer ? getVersionStatusMeta(submittedVer.status).text : '未確認可公開';
      const issues = submittedVer ? getVersionIssues(submittedVer, c.clues) : [];
      routeDetail =
        `誤傳檔案：${c.submittedFilename || 'Poster_v1_原始草稿.pdf'}（狀態：${subMeta}，上傳時間：${c.misuploadTimeStr || '18:15'}）。` +
        (issues.length > 0 ? `內含未確認內容：${issues.join('；')}。` : '該版本為核准後重新編輯或尚未取得阿明組長確認之版本。') +
        (approvedVers.length > 0 ? `（註：當時電腦中已有核准版 ${approvedVers[approvedVers.length - 1].filename}，因選錯檔案而誤傳。）` : '');

      if (c.contactedOrganizer) {
        followItems.push(`【已聯絡主辦方】於 ${c.contactedOrganizerTimeStr || '18:18'} 透過投稿系統聯繫主辦方——目前狀態：「已提出撤換請求，公開狀態待確認」。`);
      } else {
        followItems.push('【尚待處理－緊急】尚未透過辦公區電腦聯絡研討會主辦方申請撤換或下架！目前該檔案仍處於已上傳狀態。');
      }

      if (c.reportedToLead) {
        followItems.push('【已回報負責人】已向阿明組長回報誤傳版本與涉及圖片，後續由阿明組長協助追蹤主辦方回覆與合作方／專利影響。');
      } else {
        followItems.push('【尚待處理－緊急】尚未向辦公區負責人阿明組長回報誤傳事件！');
      }

      followItems.push('【撤換與公開狀態】在主辦方正式確認下架或完成檔案替換前，公開狀態仍須標記為「公開狀態待確認」並持續追蹤。');
      followReminder = '「即使已經取得核准版，上傳瞬間選錯檔名仍會造成外洩。誤傳後務必立刻聯繫主辦方撤換並向負責人回報，且持續追蹤直到確認未公開。」';
    }

    return {
      chapter: 2,
      banner,
      sections: {
        route: { badge: routeBadge, detail: routeDetail, reminder: routeReminder },
        versions: { badge: versionBadge, lines: versionLines },
        followup: { badge: followBadge, items: followItems, reminder: followReminder }
      }
    };
  }

  window.BS.State = {
    ENDINGS_CATALOG,
    createInitialState,
    createStateForChapter,
    formatClock,
    describeVersionSlots,
    getWorkingVersion,
    getVersionById,
    getVersionStatusMeta,
    getVersionIssues,
    applyPosterEdit,
    submitWorkingForReview,
    approvePendingVersion,
    loadUnlockedEndings,
    unlockEnding,
    getExposedLabItems,
    isEmailResolved,
    isVisitorResolved,
    canHandover,
    evaluateHandover,
    evaluateChapter2Handover
  };
})();
