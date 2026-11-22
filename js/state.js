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

  const CH3_STORAGE_KEY = 'before_sending_ch3_endings_v1';

  function createChapter3State() {
    return {
      chapter: 3,
      started: false,
      timeMinutes: 17 * 60, // 17:00
      introShown: false,
      ch3: {
        openedChecklist: false,
        clues: {
          talkedToWen: false,          // 阿文 pointed out raw log in personal workspace
          talkedToQing: false,         // 小晴 explained she needs CS_2026_RawLog_Full.csv
          mingConfirmedScope: false,   // 阿明組長 confirmed 2 charts + 論文修訂 + 離開後 30 天 + 保密約定提醒
          inspectedLabTerminal: false  // Inspected 2F 實驗紀錄電腦
        },
        rawLogName: 'CS_2026_RawLog_Full.csv',
        rawLogOrigPath: '/Users/Awen/Personal_Workspace/CS_2026_RawLog_Full.csv',
        rawLogTargetPath: '/Projects/ClearSky/01_RawData/CS_2026_RawLog_Full.csv',
        rawLogLocation: 'personal',    // 'personal' | 'project'
        transferredBy: null,           // 'awen' | 'admin'
        interruptedByEarlyRevoke: false,
        adminTransferCompleted: false,

        qingHasProjectAccess: false,
        qingConfirmedOpen: false,

        awenOrigAccess: 'active',      // 'active' | 'kept_explicit' | 'revoked'
        everKeptExplicit: false,
        awenPaperGrant: false,
        awenPaperDuration: '離開後 30 天',
        awenPaperPurpose: '後續論文修訂（僅限會議用兩張圖：圖A、圖B）',

        awenGaveBadge: false,
        badgeReturned: false,
        ndaRemindedToAwen: false,

        checkedAwenView: false,
        checkedQingView: false
      },
      handoverDone: false
    };
  }

  const CH4_STORAGE_KEY = 'before_sending_ch4_endings_v1';

  const CH4_PATHS = {
    optimization: '/TeamDrive/ClearSky_Project/02_ConditionOpt/',
    patentDrafts: '/TeamDrive/ClearSky_Project/01_PatentDrafts/',
    deviceTuning: '/TeamDrive/ClearSky_Project/03_DeviceTuning/',
    generalLogs: '/TeamDrive/ClearSky_Project/00_GeneralLogs/'
  };

  function createChapter4State() {
    return {
      chapter: 4,
      started: false,
      timeMinutes: 16 * 60 + 30, // 16:30
      introShown: false,
      ch4: {
        stage: 'cards', // 'cards' | 'to_pc' | 'pc_draft' | 'pc_notice' | 'pc_updated' | 'verified'
        currentCardIdx: 0, // 0, 1, 2
        cardsCompleted: false,
        cards: {
          card1: {
            title: '資料一：公開方法重現紀錄',
            desc: '阿文照網路上的公開教學重做量測。本次沒有自家改良，也沒有需要保護的未公開結果。',
            choice: null, // 'general' | 'protect'
            feedback: '',
            isCorrect: false
          },
          card2: {
            title: '資料二：量測條件優化紀錄',
            desc: '團隊自行摸索出一套調整方法，能讓量測結果更穩定。方法還沒公開，具體參數保存在受控資料夾。',
            choice: null, // 'group' | 'details'
            feedback: '',
            isCorrect: false
          },
          card3: {
            title: '資料三：已申請專利的量測裝置',
            desc: '裝置的結構與原理已送件申請專利。本章開場時，申請案尚未公開。另有一份自行摸索的裝置調校紀錄，沒有納入申請。',
            choice: null, // 'track' | 'remove'
            feedback: '',
            isCorrect: false
          }
        },
        draft: {
          optimization: true,    // 量測條件優化紀錄 (群組自研 know-how)
          patentDevice: true,    // 量測裝置申請資料 (專利申請)
          tuning: true,          // 量測裝置調校紀錄 (未納入申請之自研 know-how)
          reproduce: false       // 公開方法重現紀錄 (候選項，本情境僅一般紀錄，不應列入)
        },
        draftSaved: false,
        draftValidationMsg: '',
        noticeShown: false,
        updateChoice: null,      // 'only_published' | 'whole_project'
        updateValidationMsg: '',
        updatedSaved: false,
        verifiedWithQing: false
      },
      handoverDone: false
    };
  }

  function createStateForChapter(chapter) {
    if (chapter === 2) return createChapter2State();
    if (chapter === 3) return createChapter3State();
    if (chapter === 4) return createChapter4State();
    return createChapter1State();
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
    if (state.chapter === 3) {
      const c = state.ch3;
      return (
        c.openedChecklist ||
        c.awenOrigAccess !== 'active' ||
        c.rawLogLocation === 'project' ||
        c.badgeReturned ||
        c.ndaRemindedToAwen
      );
    }
    if (state.chapter === 4) {
      const c = state.ch4;
      return c.cardsCompleted && (c.draftSaved || c.updatedSaved || c.verifiedWithQing);
    }
    const emailTouched =
      state.email.status !== 'unread' &&
      state.email.status !== 'read' &&
      state.email.status !== 'holding';
    return emailTouched && isVisitorResolved(state);
  }

  function isCh3FullyComplete(state) {
    if (state.chapter !== 3) return false;
    const c = state.ch3;
    return (
      c.rawLogLocation === 'project' &&
      c.qingHasProjectAccess &&
      c.qingConfirmedOpen &&
      c.awenOrigAccess === 'revoked' &&
      c.awenPaperGrant &&
      c.badgeReturned &&
      c.ndaRemindedToAwen
    );
  }

  function isCh4FullyComplete(state) {
    if (state.chapter !== 4 || !state.ch4) return false;
    const c = state.ch4;
    return c.cardsCompleted && c.draftSaved && c.updatedSaved && c.verifiedWithQing;
  }

  // ===== Chapter 1 Handover Evaluation =====
  function evaluateHandover(state) {
    if (state.chapter === 2) {
      return evaluateChapter2Handover(state);
    }
    if (state.chapter === 3) {
      return evaluateChapter3Handover(state);
    }
    if (state.chapter === 4) {
      return evaluateChapter4Handover(state);
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

  // ===== Chapter 3 Helpers & Handover Evaluation =====
  function unlockCh3Ending(id) {
    try {
      const raw = localStorage.getItem(CH3_STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(arr) ? arr : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(CH3_STORAGE_KEY, JSON.stringify(list));
      }
      return list;
    } catch {
      return [id];
    }
  }

  function getCh3AccessPreview(state, role) {
    const c = state.ch3;
    const origOpen = c.awenOrigAccess !== 'revoked';

    if (role === 'awen') {
      return [
        {
          title: `1. 原始量測紀錄（${c.rawLogName}）`,
          canOpen: origOpen,
          cls: origOpen ? 'warn' : 'ok',
          badge: origOpen ? '⚠ 可開啟（原權限未關閉）' : '🔒 無法開啟（原權限已終止）',
          detail: origOpen
            ? '阿文仍可透過尚未終止的原專案／個人工作區權限開啟完整原始量測紀錄。'
            : '原專案與個人工作區權限已終止，阿文已無法存取原始量測紀錄。'
        },
        {
          title: '2. 後續論文需要的兩張會議用圖（ClearSky_會議用摘要圖_v2）',
          canOpen: c.awenPaperGrant || origOpen,
          cls: c.awenPaperGrant && !origOpen ? 'ok' : origOpen ? 'warn' : 'warn',
          badge:
            c.awenPaperGrant && !origOpen
              ? `✅ 可唯讀檢視（限期：${c.awenPaperDuration}）`
              : c.awenPaperGrant && origOpen
              ? '⚠ 可存取（已設限期，但原專案權限仍未終止）'
              : origOpen
              ? '⚠ 可存取（透過過廣的原專案權限）'
              : '🔒 無法開啟（尚未設定兩張圖的限期授權）',
          detail: c.awenPaperGrant
            ? `已依阿明組長核定範圍設定獨立限期授權：僅含圖A、圖B，限論文修訂使用，${c.awenPaperDuration}自動到期。`
            : origOpen
            ? '目前是透過整個原專案資料夾權限開啟，而非限縮於這兩張圖的獨立授權。'
            : '尚未為阿文開通論文修訂所需的兩張核准圖限期授權。'
        },
        {
          title: '3. 與後續論文無關的其他專案資料（製程筆記、其他實驗資料夾）',
          canOpen: origOpen,
          cls: origOpen ? 'danger' : 'ok',
          badge: origOpen ? '🚨 仍可存取！（授權過廣風險）' : '✅ 無法存取（已妥善隔離）',
          detail: origOpen
            ? '警告：因保留阿文原本的專案資料夾權限，離開後仍能開啟與論文修訂無關的機密製程筆記與其他專案檔案！'
            : '已終止原專案權限，阿文完全無法存取與後續論文無關的其他實驗室資料。'
        }
      ];
    }

    // role === 'qing'
    const transferred = c.rawLogLocation === 'project';
    return [
      {
        title: `1. 原始量測紀錄（${c.rawLogName}）`,
        canOpen: transferred && c.qingHasProjectAccess,
        cls: !transferred ? 'danger' : !c.qingHasProjectAccess ? 'warn' : c.qingConfirmedOpen ? 'ok' : 'warn',
        badge: !transferred
          ? '❌ 找不到檔案（尚未移交）'
          : !c.qingHasProjectAccess
          ? '⚠ 檔案已移交，接手人仍無法開啟'
          : c.qingConfirmedOpen
          ? '✅ 可正常開啟（小晴已親自確認接收）'
          : '🟡 可開啟（請找 2F 實驗區小晴親自確認接收）',
        detail: !transferred
          ? `專案指定位置（${c.rawLogTargetPath}）目前沒有此檔案，檔案仍在阿文個人工作區。${c.awenOrigAccess === 'revoked' ? ' 因阿文原權限已終止，請找 1F 阿明組長請管理員協助移交！' : ' 請到 2F 實驗區請阿文移交。'}`
          : !c.qingHasProjectAccess
          ? `檔案已移交至 ${c.rawLogTargetPath}，但小晴帳號尚未開通此資料夾存取權限，點開會顯示「權限不足」！`
          : c.qingConfirmedOpen
          ? `檔案已妥善存放於 ${c.rawLogTargetPath}，且小晴已親自測試開啟無誤並完成接收確認。`
          : `檔案已移交且小晴權限已開通！請到 2F 實驗區請小晴親自測試開啟，交接清單才會勾選「接收人已確認」。`
      },
      {
        title: '2. 後續論文需要的兩張會議用圖（ClearSky_會議用摘要圖_v2）',
        canOpen: c.qingHasProjectAccess,
        cls: c.qingHasProjectAccess ? 'ok' : 'warn',
        badge: c.qingHasProjectAccess ? '✅ 可存取（專案資料夾）' : '⚠ 尚未確認專案權限',
        detail: c.qingHasProjectAccess
          ? '小晴已具備晴空計畫專案資料夾權限，可隨時對照會議用兩張圖與阿文合作修改論文。'
          : '為小晴確認晴空計畫工作所需存取權限後即可檢視。'
      },
      {
        title: '3. 與晴空計畫無關的其他實驗室專案資料',
        canOpen: false,
        cls: 'ok',
        badge: '🔒 無法存取（符合最小權限原則）',
        detail: '依工作需要僅開放晴空計畫存取權限，不開放無關專案資料夾。'
      }
    ];
  }

  function getCh3PendingItems(state) {
    const c = state.ch3;
    const pending = [];
    if (c.rawLogLocation !== 'project') {
      pending.push(
        c.awenOrigAccess === 'revoked'
          ? '原始量測紀錄尚未移交（因已終止阿文原權限，須找 1F 阿明組長請管理員協助移交指定檔案）'
          : '原始量測紀錄仍在阿文個人工作區，尚未移交至專案指定位置'
      );
    }
    if (!c.qingHasProjectAccess) {
      pending.push('尚未為接手人小晴確認專案資料夾存取權限');
    }
    if (!c.qingConfirmedOpen) {
      pending.push('尚未由 2F 實驗區的小晴親自測試開啟紀錄並確認接收');
    }
    if (c.awenOrigAccess !== 'revoked') {
      pending.push('阿文的原專案資料夾權限仍開放中（可存取原始紀錄與無關專案資料，須終止原權限）');
    }
    if (!c.awenPaperGrant) {
      pending.push('尚未依阿明組長核定範圍，為阿文設定僅含兩張會議圖的限期授權（離開後 30 天）');
    }
    if (!c.badgeReturned) {
      pending.push('尚未於 1F 大門接待櫃台收回阿文的實體門禁卡並完成登記');
    }
    if (!c.ndaRemindedToAwen) {
      pending.push('尚未透過交接對話提醒阿文離開後仍須遵守的保密義務與資料攜出限制');
    }
    return pending;
  }

  function evaluateChapter3Handover(state) {
    const c = state.ch3;
    const pending = getCh3PendingItems(state);
    const complete = pending.length === 0;
    const origOpen = c.awenOrigAccess !== 'revoked';

    let ch3EndingId = 'ch3_complete';
    let banner = {
      icon: '🏅',
      title: '完美離職交接與限期授權',
      desc: '資料完整移交並由小晴確認開啟，終止原專案權限、改設兩張圖 30 天限期授權，並完成 1F 門禁卡收回與保密提醒。'
    };

    if (!complete) {
      ch3EndingId = origOpen ? 'ch3_overbroad_risk' : 'ch3_incomplete';
      banner = origOpen
        ? {
            icon: '⚠️',
            title: '交班警報：原專案權限仍開放',
            desc: '保留原專案權限會讓離任人員持續存取與後續論文無關的機密資料！交班清單已列出風險與待辦事項。'
          }
        : {
            icon: '⚠️',
            title: '離職交接尚有未完成待辦',
            desc: '本次帶著未完成事項交班，交班清單已明確標出剩餘待辦項目，建議重玩補齊完整流程。'
          };
    } else if (c.interruptedByEarlyRevoke && c.adminTransferCompleted) {
      ch3EndingId = 'ch3_admin_remediated';
      banner = {
        icon: '🚒',
        title: '交接中斷後成功補救',
        desc: '雖曾太早終止原權限導致交接中斷，但未恢復阿文整包權限，而是透過阿明組長以管理員協助移交指定檔案並由小晴確認開啟！'
      };
    }

    unlockCh3Ending(ch3EndingId);

    // Section 1: 資料交接與小晴接收確認
    let transferBadge = { text: '已移交並確認接收', cls: 'ok' };
    if (c.rawLogLocation !== 'project' || !c.qingConfirmedOpen) {
      transferBadge = { text: '交接未完成', cls: 'danger' };
    } else if (c.interruptedByEarlyRevoke) {
      transferBadge = { text: '中斷後管理員補救完成', cls: 'warn' };
    }

    const transferDetail =
      `接手人：小晴｜檔案：${c.rawLogName}｜指定存放位置：${c.rawLogTargetPath}。` +
      (c.interruptedByEarlyRevoke
        ? `【交接曾中斷】因先終止阿文原權限導致小晴無法取得檔案；${
            c.adminTransferCompleted
              ? '已由 1F 阿明組長透過管理員權限僅移交指定紀錄（未恢復阿文整包原權限）完成補救。'
              : '尚未請 1F 阿明組長啟動管理員協助移交！'
          }`
        : c.rawLogLocation === 'project'
        ? '已由阿文將原始紀錄自個人工作區移交至專案指定位置。'
        : '檔案目前仍留在阿文個人工作區，尚未移交。') +
      ` 接收人狀態：${c.qingConfirmedOpen ? '✅ 小晴已於 2F 實驗區親自測試開啟並確認接收。' : c.qingHasProjectAccess ? '⚠ 權限已開通但小晴尚未親自確認開啟。' : '❌ 小晴尚未開通權限或無法開啟。'}`;

    const transferReminder = c.interruptedByEarlyRevoke
      ? '「先確認檔案已移交並由接手人實測開啟，再終止原權限最順暢；若不慎提早關閉權限，應請管理員單獨移交指定檔案，切勿重新打開整包原權限。」'
      : '「離職交接不是把檔案丟進資料夾就好，必須確認存放於專案指定位置，並讓接手同事親自打開確認無誤。」';

    // Section 2: 權限終止與兩張圖限期授權
    let accessBadge = { text: '原權限已終止＋限期授權', cls: 'ok' };
    if (origOpen) {
      accessBadge = { text: '原權限仍開放（過廣）', cls: 'danger' };
    } else if (!c.awenPaperGrant) {
      accessBadge = { text: '已停權（未設合作授權）', cls: 'warn' };
    }

    const accessDetail =
      `原專案權限：${origOpen ? '🚨 仍開放中！阿文目前仍可存取「原始量測紀錄」、「兩張會議圖」以及「與後續論文無關的其他專案機密資料」。' : '✅ 已終止，阿文已無法存取原始紀錄與無關專案資料。'}` +
      ` 後續論文合作授權：${
        c.awenPaperGrant
          ? `✅ 已設定獨立限期授權——範圍：${c.awenPaperPurpose}；期限：${c.awenPaperDuration}。`
          : '⬜ 尚未設定僅含兩張會議圖的限期授權。'
      }`;

    const accessReminder =
      '「人員離職當日應立即取消原專案權限；若仍有論文修訂等合作需求，應另行核定最小範圍、用途與明確期限的獨立授權。」';

    // Section 3: 實體門禁、保密提醒與待辦追蹤
    let complianceBadge = complete
      ? { text: '全數完成', cls: 'ok' }
      : { text: `尚有 ${pending.length} 項待辦`, cls: origOpen ? 'danger' : 'warn' };

    const complianceItems = [
      `【1F 實體門禁卡】${c.badgeReturned ? '✅ 已於 1F 大門接待櫃台收回阿文的門禁卡並完成登記（與電子權限分開管制）。' : '❌ 尚未於 1F 大門接待櫃台收回並登記門禁卡！'}`,
      `【離職保密義務提醒】${c.ndaRemindedToAwen ? '✅ 已透過交接對話向阿文再次提醒離職後仍適用之保密約定與研究資料攜出限制。' : '❌ 尚未向阿文確認保密約定並提醒離職後保密義務！'}`
    ];

    if (pending.length > 0) {
      pending.forEach((p) => complianceItems.push(`【待辦事項】${p}`));
    } else {
      complianceItems.push(`【例行追蹤】${c.awenPaperDuration}後系統將自動撤銷阿文的兩張會議圖唯讀授權，屆時可再確認權限清單。`);
    }

    const complianceReminder =
      '「實體門禁憑證回收、電子存取權限終止、資料實測交接與保密義務提醒四者缺一不可，須分項確認並留下紀錄。」';

    return {
      chapter: 3,
      complete,
      hasRisk: origOpen || !complete,
      banner,
      sections: {
        transfer: { badge: transferBadge, detail: transferDetail, reminder: transferReminder },
        access: { badge: accessBadge, detail: accessDetail, reminder: accessReminder },
        compliance: { badge: complianceBadge, items: complianceItems, reminder: complianceReminder }
      }
    };
  }

  // ===== Chapter 3 (Internal 4): R&D Asset Checklist & Patent Disclosure Evaluation =====
  function unlockCh4Ending(id) {
    try {
      const raw = localStorage.getItem(CH4_STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(arr) ? arr : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(CH4_STORAGE_KEY, JSON.stringify(list));
      }
      return list;
    } catch {
      return [id];
    }
  }

  function evaluateCh4Lookup(state) {
    const c = state.ch4;
    return {
      allOk: c.updatedSaved,
      dangerCount: c.updatedSaved ? 0 : 1,
      warnCount: 0,
      steps: [
        {
          cls: c.cardsCompleted ? 'ok' : 'warn',
          badge: c.cardsCompleted ? '✅ 資料精準辨識' : '⬜ 尚未辨識資料卡',
          title: '1. 資料卡分類與群組管理',
          detail: '成功分辨公開教學重現（一般紀錄）、自研 know-how（條件優化）與專利申請資料。'
        },
        {
          cls: c.draftSaved ? 'ok' : 'warn',
          badge: c.draftSaved ? '✅ 清單五欄位齊備' : '⬜ 清單未儲存',
          title: '2. 研發成果清單五欄位',
          detail: '包含資料名稱或範圍、資料類型、保護原因、存放位置、負責人，技術細節留在受控資料夾。'
        },
        {
          cls: c.updatedSaved ? 'ok' : 'warn',
          badge: c.updatedSaved ? '✅ 專利公開精確更新' : '⬜ 尚未更新公開狀態',
          title: '3. 專利申請案公開動態更新',
          detail: '更新量測裝置申請資料為已公開，並保留未納入申請之調校紀錄與自研優化紀錄的受控保護。'
        }
      ]
    };
  }

  function evaluateChapter4Handover(state) {
    const c = state.ch4;
    const isPerfect = c.cardsCompleted && c.draftSaved && c.updatedSaved && c.verifiedWithQing;
    const endingId = isPerfect ? 'ch4_perfect_list' : 'ch4_incomplete_list';
    unlockCh4Ending(endingId);

    const banner = isPerfect
      ? {
          icon: '🏅',
          title: '研發成果清單盤點典範',
          desc: '精準分辨自研 know-how 與專利資料，落實清單五欄位，並在專利公開時及時精確更新！'
        }
      : {
          icon: '⚠️',
          title: '研發成果清單尚有待補強項目',
          desc: '清單草稿尚未完整更新或尚未向小晴確認盤點。交班紀錄已列出補強方向！'
        };

    // Section 1: 資料辨識與群組整理
    const cardBadge = c.cardsCompleted ? { text: '精準分類', cls: 'ok' } : { text: '尚未完成辨識', cls: 'warn' };
    const cardDetail = '成功分辨公開教學重現（留作一般紀錄）、自研 know-how（量測條件優化與調校紀錄）與專利申請資料；以群組建立清單，機密參數與檔案明細留在受控資料夾。';
    const cardReminder = '「清單是管理與查找目錄，讓同事知道去哪裡找、找誰問；機密技術細節應留在受控位置。」';

    // Section 2: 清單五欄位落實
    const fieldBadge = c.draftSaved ? { text: '五欄位齊備', cls: 'ok' } : { text: '清單未完整儲存', cls: 'warn' };
    const fieldDetail = '每筆資料皆清楚載明五項必要欄位：資料名稱或範圍、資料類型、保護原因、存放位置、負責人，資訊完整明確。';
    const fieldReminder = '「落實五個必要欄位，接手同事才能在無口頭交接下順暢盤點。」';

    // Section 3: 動態更新與公開界線
    const updateBadge = c.updatedSaved ? { text: '精確更新留痕', cls: 'ok' } : { text: '公開狀態未更新', cls: 'warn' };
    const updateDetail = c.updatedSaved
      ? '專利公開時，精準更新申請資料原有項目（不建重複紀錄），並清楚保留未納入申請之調校紀錄與自研優化紀錄的未公開保護狀態。'
      : '專利申請公開時，應核對公開文件範圍，僅更新涵蓋部分，其餘未公開 know-how 應繼續受控保護。';
    const updateReminder = '「申請案公開時，應核對實際公開範圍，僅更新涵蓋部分，未公開的 know-how 仍應繼續受控保護。」';

    return {
      chapter: 4,
      complete: isPerfect,
      hasRisk: !isPerfect,
      banner,
      sections: {
        data: { badge: cardBadge, detail: cardDetail, reminder: cardReminder },
        correction: { badge: fieldBadge, detail: fieldDetail, reminder: fieldReminder },
        followup: { badge: updateBadge, items: [updateDetail], reminder: updateReminder }
      }
    };
  }

  window.BS.State = {
    ENDINGS_CATALOG,
    CH4_PATHS,
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
    isCh3FullyComplete,
    isCh4FullyComplete,
    getCh3AccessPreview,
    getCh3PendingItems,
    evaluateCh4Lookup,
    evaluateHandover,
    evaluateChapter2Handover,
    evaluateChapter3Handover,
    evaluateChapter4Handover
  };
})();
