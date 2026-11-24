(function () {
  window.BS = window.BS || {};

  const STORAGE_KEY = 'before_sending_endings_v1';

  const ENDINGS_CATALOG = [
    {
      id: 'flawless',
      icon: '🏆',
      title: '滴水不漏值班員',
      title_en: 'Flawless Duty Officer',
      desc: '先確認核准版本與保密約定、以最小範圍與限時權限分享，且安全完成訪客拍攝。',
      desc_en: 'Verified approval and NDA, shared minimal scope with expiring link, and completed visitor photography safely.',
      hint: '找阿文與阿明組長確認後，只分享核准的兩張會議圖並設定限定對象與期限；訪客也安全完成拍照。',
      hint_en: 'Confirm with A-Wen & A-Ming, share only approved figures with restricted expiring access, and guide visitor safely.'
    },
    {
      id: 'steady_confirm',
      icon: '🧭',
      title: '先緩後查穩健派',
      title_en: 'Prudent Verifier',
      desc: '面對催件不慌張，先禮貌回覆「正在確認中」，補足核准資訊後再穩妥寄出。',
      desc_en: 'Remained calm under rush requests, politely replied "verifying with team", and sent securely after obtaining approval.',
      hint: '在尚未掌握全部資訊前，先回覆合作方正在確認，再找阿文與阿明組長補齊條件後寄出。',
      hint_en: 'Reply that details are being confirmed before sending, then obtain approval from A-Wen and Team Lead A-Ming.'
    },
    {
      id: 'rapid_remediation',
      icon: '🚒',
      title: '黃金止血通報者',
      title_en: 'Golden Hour Responder',
      desc: '雖曾誤設公開連結分享整個資料夾，但第一時間停用連結並向阿明組長完整通報四要素。',
      desc_en: 'Accidentally created a public link, but promptly revoked it and reported all four incident elements to Team Lead A-Ming.',
      hint: '把整個資料夾設成公開連結寄出，觸發協力廠商轉傳詢問後，回電腦停權並找阿明組長完成通報。',
      hint_en: 'Send folder via public link, notice partner inquiry, revoke link at duty PC, and file complete report to A-Ming.'
    },
    {
      id: 'shutter_save',
      icon: '📸',
      title: '快門前的覺醒',
      title_en: 'Awareness Before the Shutter',
      desc: '在實驗區相機預覽中察覺機密入鏡，立刻暫停拍攝、整理現場或改回核准角度後重拍。',
      desc_en: 'Spotted sensitive data in camera preview, paused shooting immediately, cleared room/screen, or redirected to approved spot.',
      hint: '先陪同訪客進實驗區看取景預覽，發現未處理的敏感資訊時按暫停，整理完現場或改角度再拍。',
      hint_en: 'Accompany visitor, notice exposed data on screen/whiteboard in preview, pause, clear the room, and retake safely.'
    },
    {
      id: 'alarm_handover',
      icon: '⚠️',
      title: '交班警報響起',
      title_en: 'Duty Handover Alarm',
      desc: '下班交班時仍留下未處置的外洩風險——幸好這是遊戲，重來一次試試不同做法吧！',
      desc_en: 'Clocked out with unmitigated trade secret leakage risks—fortunately this is a simulation. Try again!',
      hint: '在誤分享未補救或未遮蔽機密資訊就拍照的情況下完成交班。',
      hint_en: 'Complete handover while links remain mis-shared without revocation, or visitor photos contain unshielded trade secrets.'
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
        rawLogTargetPath: '/Projects/StarSky/01_RawData/CS_2026_RawLog_Full.csv',
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
    optimization: '/TeamDrive/StarSky_Project/02_ConditionOpt/',
    patentDrafts: '/TeamDrive/StarSky_Project/01_PatentDrafts/',
    deviceTuning: '/TeamDrive/StarSky_Project/03_DeviceTuning/',
    generalLogs: '/TeamDrive/StarSky_Project/00_GeneralLogs/'
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

  const CH5_STORAGE_KEY = 'before_sending_ch5_endings_v1';

  function createChapter5State() {
    return {
      chapter: 5,
      started: false,
      timeMinutes: 16 * 60, // 16:00
      introShown: false,
      ch5: {
        currentDocIdx: 0,
        markingCompleted: false,
        verifiedWithQing: false,
        docs: [
          {
            id: 'poster',
            title: '文件一：可公開的活動海報',
            title_en: 'Doc 1: Public Event Poster',
            typeTag: '宣傳品 / 活動海報',
            typeTag_en: 'Promotional / Event Poster',
            source: '實驗室推廣小組',
            source_en: 'Lab Outreach Committee',
            content: '標題「星空計畫研發成果發表交流會」，內含活動時間、地點、議程、講者陣容與公開報名連結。無任何未公開之自研技術細節或機密參數。',
            content_en: 'Title "StarSky Project Presentation Symposium". Contains schedule, venue, agenda, speakers, and public registration link. No undisclosed technical know-how or secret parameters.',
            purpose: '預計張貼於 1F 大廳形象區宣傳，並透過公開社群廣發邀請外部產學界參加。',
            purpose_en: 'Scheduled to be posted in 1F lobby and shared publicly on social channels to invite industry and academic partners.',
            isConfidential: false,
            chosenMarking: null,
            feedback: '',
            isCorrect: false,
            placementHint: '維持乾淨宣傳版面，右下角標註一般／公開版',
            placementHint_en: 'Keep promotional layout clean; note General / Public in bottom corner',
            previewDetails: {
              heading: '星空計畫研發成果發表交流會',
              sub: '時間：11月30日 14:00 ｜ 地點：1F 演講廳',
              badge: '公開宣傳版',
              badgeCls: 'public',
              summary: '版面清爽完整，無機密浮水印，可自由印刷與對外發布。'
            },
            previewDetails_en: {
              heading: 'StarSky Project Presentation Symposium',
              sub: 'Date: Nov 30, 14:00 | Venue: 1F Auditorium',
              badge: 'Public Edition',
              badgeCls: 'public',
              summary: 'Clean promotional layout with no confidential watermarks, suitable for printing and public release.'
            }
          },
          {
            id: 'slides',
            title: '文件二：含未公開調校方法的電子簡報',
            title_en: 'Doc 2: Electronic Presentation with Undisclosed Tuning Methods',
            typeTag: '電子簡報（.pptx）',
            typeTag_en: 'Electronic Presentation (.pptx)',
            source: 'StarSky 研發團隊',
            source_en: 'StarSky R&D Team',
            content: '檔案名稱「StarSky_儀器調校與最佳化參數流程.pptx」，共 24 頁。詳細記載團隊摸索數月的調校參數、避坑經驗與最佳量測條件（屬未公開自研 know-how）。',
            content_en: 'File "StarSky_Instrument_Tuning_and_Parameters.pptx" (24 pages). Documents months of trial parameters, tuning know-how, and optimal measurement conditions (undisclosed know-how).',
            purpose: '供本週專案內部技術檢討會使用，僅限團隊內部成員與核准研究員討論。',
            purpose_en: 'For this week\'s internal technical review only; restricted to team members and approved researchers.',
            isConfidential: true,
            chosenMarking: null,
            feedback: '',
            isCorrect: false,
            placementHint: '簡報首頁封面右上角 ＆ 每頁投影片頁腳（Footer）顯著標記',
            placementHint_en: 'Top-right corner of title slide & conspicuous footer on every slide',
            previewDetails: {
              heading: 'StarSky 儀器調校與最佳化參數流程',
              sub: '報告人：研發團隊 ｜ 專案內部研討',
              badge: '機密 CONFIDENTIAL',
              badgeCls: 'confidential',
              footer: '機密文件 · 限專案內部使用 · 未經授權禁止翻拍轉傳',
              summary: '封面顯著載明機密標籤，每頁頁腳皆有防漏標記，投影或閱讀時皆能明確警示。'
            },
            previewDetails_en: {
              heading: 'StarSky Instrument Tuning & Parameter Optimization Flow',
              sub: 'Presenter: R&D Team | Internal Project Review',
              badge: 'CONFIDENTIAL',
              badgeCls: 'confidential',
              footer: 'Confidential Document · Internal Project Use Only · Unauthorized Reproduction Prohibited',
              summary: 'Conspicuous Confidentiality Label on title cover and leak-prevention footer on each slide for clear warning during presentation or reading.'
            }
          },
          {
            id: 'paper',
            title: '文件三：含未公開量測結果的紙本研究紀錄',
            title_en: 'Doc 3: Paper Research Log with Undisclosed Measurement Results',
            typeTag: '裝訂紙本實驗紀錄簿',
            typeTag_en: 'Bound Paper Lab Notebook',
            source: '阿文實驗紀錄本手稿',
            source_en: 'A-Wen\'s Lab Notebook Manuscript',
            content: '裝訂紙本手稿，封面手寫「樣品 A-04 至 C-12 關鍵低溫量測原始曲線與數據聯」，內含尚未發表之第一手量測數據與異常標記。',
            content_en: 'Bound paper manuscript marked "Key Cryogenic Measurement Raw Curves & Data for Samples A-04 to C-12". Contains unpublished first-hand measurement data and anomaly notes.',
            purpose: '作為實驗室原始研發紀錄留存，供接手人小晴驗證數據並歸檔入 2F 防火公文櫃。',
            purpose_en: 'Archived as original lab research record for successor Xiao-Qing to verify data and store in 2F fireproof cabinet.',
            isConfidential: true,
            chosenMarking: null,
            feedback: '',
            isCorrect: false,
            placementHint: '紙本封面與首頁正上方顯著加蓋機密紅印章與管制編號',
            placementHint_en: 'Prominent red Confidentiality stamp & control number on front cover and first page',
            previewDetails: {
              heading: '樣品 A-04 至 C-12 關鍵低溫量測原始曲線手稿',
              sub: '實驗者：阿文 ｜ 存放位置：2F 公文櫃',
              badge: '【 機 密 】CONFIDENTIAL',
              badgeCls: 'confidential',
              stamp: '【 機 密 】CONFIDENTIAL · 管制編號：CS-DOC-2026-03',
              summary: '首頁加蓋醒目紅色機密印戳與管制編號，放置於桌面能第一時間辨識並落實桌面淨空。'
            },
            previewDetails_en: {
              heading: 'Sample A-04 to C-12 Cryogenic Measurement Raw Curves Manuscript',
              sub: 'Researcher: A-Wen | Storage: 2F Filing Cabinet',
              badge: '【 CONFIDENTIAL 】',
              badgeCls: 'confidential',
              stamp: '【 CONFIDENTIAL 】Control No: CS-DOC-2026-03',
              summary: 'Prominent red Confidentiality stamp with control number on first page, immediately identifiable on desks to maintain clean-desk policy.'
            }
          }
        ]
      },
      handoverDone: false
    };
  }

  function createStateForChapter(chapter) {
    if (chapter === 2) return createChapter2State();
    if (chapter === 3) return createChapter3State();
    if (chapter === 4) return createChapter4State();
    if (chapter === 5) return createChapter5State();
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
    if (state.chapter === 5) {
      const c = state.ch5;
      return c.markingCompleted || c.verifiedWithQing;
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

  function isCh5FullyComplete(state) {
    if (state.chapter !== 5 || !state.ch5) return false;
    const c = state.ch5;
    return c.markingCompleted && c.verifiedWithQing;
  }

  // ===== Dynamic In-Game Chapter Progress Calculator =====
  function getChapterProgress(state) {
    if (!state) return null;
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';

    // Chapter 1: 寄出之前 (internal 1)
    if (state.chapter === 1) {
      const c = state.clues || {};
      const e = state.email || {};
      const v = state.visitor || {};
      const emailTouched = Boolean(e.status && e.status !== 'unread' && e.status !== 'read' && e.status !== 'holding');
      const visitorResolved = Boolean(v && (
        v.status === 'done_entrance' ||
        v.status === 'done_lab_clean' ||
        v.status === 'done_lab_leaked'
      ));

      let done = 0;
      if (c.ndaScope || c.ndaCheckedInSystem || e.usedHoldingReply) done++;
      if (c.meetingVersion) done++;
      if (visitorResolved) done++;
      if (emailTouched) done++;

      const isAllDone = done === 4;
      let nextHint = '';
      let nextHintAlert = false;

      if (e.misshared && !e.linkRevoked) {
        nextHint = isEn ? '🚨 Public link active! Revoke access at 2F PC immediately!' : '🚨 誤設公開連結！立即回 2F 電腦停用分享連結！';
        nextHintAlert = true;
      } else if (e.misshared && !e.reportedToLead) {
        nextHint = isEn ? '🚨 Report mis-share incident to Lead A-Ming on 2F!' : '🚨 找 2F 辦公區阿明組長通報誤分享事件（人、事、時、地、物）！';
        nextHintAlert = true;
      } else if (isAllDone) {
        nextHint = isEn ? '✨ All tasks complete! Clock out at 2F Duty Desk (green checkmark)' : '✨ 任務全數達成！請到 2F 辦公區值班桌（綠勾）填寫紀錄並完成交班';
      } else if (e.status === 'unread') {
        nextHint = isEn ? 'Check partner urgent email at 2F Office Duty PC' : '到 2F 辦公區電腦查看星海科技合作方的緊急來信';
      } else if (!c.ndaScope && !c.ndaCheckedInSystem && !e.usedHoldingReply) {
        nextHint = isEn ? 'Verify NDA list at 2F PC or consult Lead A-Ming in Office' : '在 2F 電腦查核 NDA 簽署清單，或詢問辦公室阿明組長';
      } else if (!c.meetingVersion) {
        nextHint = isEn ? 'Ask A-Wen at 2F Lab for approved meeting charts' : '到 2F 實驗區找阿文確認會議用圖版本（勿傳未核准原始資料夾）';
      } else if (!visitorResolved) {
        const exposed = (state.labItems && (!state.labItems.whiteboard || !state.labItems.monitor || !state.labItems.samples));
        if (exposed && v.status === 'waiting') {
          nextHint = isEn ? 'Inspect 2F Lab (whiteboard, monitor, samples), then escort 1F visitor' : '巡視 2F 實驗區收妥白板／螢幕／樣品，再下樓至 1F 接待訪客陳先生';
        } else if (v.status === 'waiting') {
          nextHint = isEn ? 'Take stairs to 1F reception to escort visitor Mr. Chen for photos' : '走左側樓梯至 1F 大門接待處，引導預約訪客陳先生拍照';
        } else {
          nextHint = isEn ? 'Escort Mr. Chen to complete photos (ensure lab data is shielded)' : '引導訪客陳先生拍照（確認白板與螢幕敏感數據已遮蔽）';
        }
      } else if (!emailTouched) {
        nextHint = isEn ? 'Send 2 approved charts with 7-day read-only link at 2F PC' : '回 2F 電腦選擇「僅會議用兩張圖」並設定 7 天唯讀權限寄出';
      } else {
        nextHint = isEn ? 'Proceed to 2F Duty Desk to complete handover' : '請前往 2F 辦公區值班桌完成交班';
      }

      return {
        icon: isAllDone ? '🌟' : '🛡️',
        title: isEn ? 'Trade Secret Checklist' : '營業秘密防護查核',
        done,
        total: 4,
        unit: isEn ? 'Items' : '項',
        isAllDone,
        nextHint,
        nextHintAlert
      };
    }

    // Chapter 2: 投稿前一晚 (internal 2)
    if (state.chapter === 2) {
      const c = state.ch2 || {};
      const clues = c.clues || {};
      let done = 0;
      if (c.openedPoster) done++;
      if (clues.wenExplainedFig2) done++;
      if (clues.mingExplainedRules) done++;
      if (c.outcome && c.outcome !== 'in_progress') done++;

      const isAllDone = done === 4;
      let nextHint = '';
      let nextHintAlert = false;

      if (c.misuploaded && (!c.contactedOrganizer || !c.reportedToLead)) {
        nextHint = isEn ? '🚨 Unconfirmed version uploaded! Contact host from PC & report to Lead A-Ming!' : '🚨 誤傳未確認版本！請回電腦聯絡主辦方並向阿明組長回報通報！';
        nextHintAlert = true;
      } else if (isAllDone) {
        nextHint = isEn ? '✨ Decision finalized! Clock out at 2F Duty Desk (green checkmark)' : '✨ 審查決策已完成！請到 2F 辦公區值班桌填寫紀錄並完成交班';
      } else if (!c.openedPoster) {
        nextHint = isEn ? 'Open & inspect symposium poster draft at 2F Office PC' : '至 2F 辦公區電腦開啟並檢視研討會海報草稿';
      } else if (!clues.wenExplainedFig2) {
        nextHint = isEn ? 'Ask A-Wen in 2F Lab about Fig 2 origin and unlock replacement figure' : '到 2F 實驗區找阿文詢問圖二來源，並取得自研替代圖';
      } else if (!clues.mingExplainedRules) {
        nextHint = isEn ? 'Consult Team Lead A-Ming in Office regarding Fig 2 consent & Fig 3 patent' : '向辦公區阿明組長確認圖二公開授權與圖三專利公開時點';
      } else if (c.outcome === 'in_progress') {
        const versions = c.versions || [];
        const hasApproved = versions.some((v) => v.status === 'approved');
        const hasPending = versions.some((v) => v.status === 'pending_review');
        const workingVer = versions.find((v) => v.id === c.workingVersionId) || versions[versions.length - 1];
        const figuresFixed = workingVer && workingVer.slots && workingVer.slots.fig2 === 'alt' && workingVer.slots.fig3 === 'removed';

        if (hasApproved) {
          nextHint = isEn ? 'Return to 2F Office PC, switch to Submission tab and submit approved file' : '回 2F 辦公區電腦切換至「提交投稿」分頁，提交已核准檔案';
        } else if (hasPending) {
          nextHint = isEn ? 'Talk to Team Lead A-Ming in Office to obtain final approval for the poster' : '到辦公區找阿明組長對話，取得海報核准';
        } else if (!figuresFixed) {
          nextHint = isEn ? 'On Office PC: replace Fig 2 with alternative chart and remove Fig 3' : '至辦公區電腦將圖二替換為替代圖、並移除圖三';
        } else {
          nextHint = isEn ? 'On Office PC: submit current version to Team Lead A-Ming for review' : '在辦公區電腦點選「送交阿明組長確認」送出審核';
        }
      } else {
        nextHint = isEn ? 'Proceed to 2F Duty Desk to complete handover' : '請前往 2F 辦公區值班桌完成交班';
      }

      return {
        icon: isAllDone ? '🌟' : '📑',
        title: isEn ? 'Poster Review Progress' : '海報公開審查進度',
        done,
        total: 4,
        unit: isEn ? 'Items' : '項',
        isAllDone,
        nextHint,
        nextHintAlert
      };
    }

    // Chapter 3: 這份文件要怎麼標？ (internal 5)
    if (state.chapter === 5) {
      const c = state.ch5 || {};
      const docs = c.docs || [];
      let done = 0;
      if (docs[0] && (docs[0].chosenMarking || docs[0].isCorrect)) done++;
      if (docs[1] && (docs[1].chosenMarking || docs[1].isCorrect)) done++;
      if (docs[2] && (docs[2].chosenMarking || docs[2].isCorrect)) done++;

      const isAllDone = done === 3 && Boolean(c.verifiedWithQing);
      let nextHint = '';

      if (isAllDone) {
        nextHint = isEn ? '✨ All labeled & verified! Complete handover at Duty Desk or with Xiao-Qing' : '✨ 標示與交接核對完成！向小晴或回 2F 值班桌完成交班';
      } else if (done < 3) {
        nextHint = isEn ? `Review & label all 3 documents at 2F Office PC (${done}/3 labeled)` : `至 2F 辦公區值班電腦，檢視三份文件並完成機密標示（已完成 ${done}/3 份）`;
      } else if (!c.verifiedWithQing) {
        nextHint = isEn ? 'Find colleague Xiao-Qing in 2F Office to hand over labeled documents' : '找 2F 辦公區同事小晴接手文件，確認保管方式與分享原則';
      } else {
        nextHint = isEn ? 'Proceed to 2F Duty Desk to complete handover' : '請前往 2F 辦公區值班桌完成交班';
      }

      return {
        icon: isAllDone ? '🌟' : '🏷️',
        title: isEn ? 'Document Labeling' : '文件機密標示',
        done,
        total: 3,
        unit: isEn ? 'Docs' : '份',
        isAllDone,
        nextHint,
        nextHintAlert: false
      };
    }

    // Chapter 4: 這批資料要列入清單嗎？ (internal 4)
    if (state.chapter === 4) {
      const c = state.ch4 || {};
      const cards = c.cards || {};
      let done = 0;
      if (cards.card1 && cards.card1.choice !== null) done++;
      if (cards.card2 && cards.card2.choice !== null) done++;
      if (cards.card3 && cards.card3.choice !== null) done++;

      const isAllDone = done === 3 && Boolean(c.verifiedWithQing);
      let nextHint = '';

      if (isAllDone) {
        nextHint = isEn ? '✨ Inventory verified! Complete handover at Duty Desk or with Xiao-Qing' : '✨ 清單核對已完成！向小晴或回 2F 值班桌完成交班';
      } else if (done < 3) {
        nextHint = isEn ? `Take stairs to 2F Lab to review 3 data cards with A-Wen (${done}/3)` : `走樓梯至 2F 量測實驗區找同事阿文，辨識三組研發成果資料卡（已完成 ${done}/3）`;
      } else if (!c.draftSaved) {
        nextHint = isEn ? 'Review 5-field inventory draft at 2F Office PC' : '至 2F 辦公區值班電腦，確認五欄位研發成果清單草稿';
      } else if (!c.updatedSaved) {
        nextHint = isEn ? 'Check Team Lead notice at 2F PC and update patent publication status' : '收到阿明組長專利公開通知，請在 2F 電腦更新裝置公開狀態';
      } else if (!c.verifiedWithQing) {
        nextHint = isEn ? 'Find colleague Xiao-Qing in 2F Office to verify inventory list' : '找 2F 辦公區同事小晴核對清單並確認欄位紀錄';
      } else {
        nextHint = isEn ? 'Proceed to 2F Duty Desk to complete handover' : '請前往 2F 辦公區值班桌完成交班';
      }

      return {
        icon: isAllDone ? '🌟' : '📋',
        title: isEn ? 'R&D Inventory Audit' : '成果清單盤點辨識',
        done,
        total: 3,
        unit: isEn ? 'Sets' : '組',
        isAllDone,
        nextHint,
        nextHintAlert: false
      };
    }

    // Chapter 5: 阿文的最後一天 (internal 3)
    if (state.chapter === 3) {
      const c = state.ch3 || {};
      let done = 0;
      if (c.rawLogLocation === 'project') done++;
      if (c.ndaRemindedToAwen) done++;
      if (c.badgeReturned) done++;
      if (c.awenOrigAccess === 'revoked') done++;
      if (c.qingConfirmedOpen) done++;

      const isAllDone = done === 5;
      let nextHint = '';
      let nextHintAlert = false;

      if (c.interruptedByEarlyRevoke && c.rawLogLocation !== 'project') {
        nextHint = isEn ? '🚨 Revoked early! Ask Lead A-Ming on 1F for admin transfer assistance' : '🚨 提前停權！請下樓找 1F 阿明組長安排管理員單獨移交紀錄！';
        nextHintAlert = true;
      } else if (isAllDone) {
        nextHint = isEn ? '✨ All 5 handover items done! Clock out at Duty Desk or with Xiao-Qing' : '✨ 5 項交接全數完成！向小晴或回 2F 值班桌完成交班';
      } else if (c.rawLogLocation !== 'project') {
        nextHint = isEn ? 'Ask A-Wen in 2F Lab to transfer raw measurements to project folder' : '至 2F 實驗區找阿文，將原始紀錄移交至專案指定位置';
      } else if (!c.qingHasProjectAccess) {
        nextHint = isEn ? 'Grant Xiao-Qing project folder access at 2F Duty PC' : '至 2F 值班電腦開通小晴的專案資料夾存取權限';
      } else if (!c.qingConfirmedOpen) {
        nextHint = isEn ? 'Ask Xiao-Qing in 2F Lab to test opening transferred records' : '至 2F 實驗區找小晴實測開啟原始紀錄，確認接收無誤';
      } else if (!c.ndaRemindedToAwen) {
        nextHint = isEn ? 'Remind A-Wen in 2F Lab of post-employment trade secret obligations' : '向 2F 實驗區阿文提醒離職保密義務，確認個人設備無留存機密';
      } else if (!c.badgeReturned) {
        if (!c.awenGaveBadge) {
          nextHint = isEn ? 'Ask A-Wen for his physical badge, then return it at 1F Reception' : '向 2F 阿文索取實體門禁卡，並下樓至 1F 大門接待處登記收回';
        } else {
          nextHint = isEn ? 'Take stairs to 1F Main Reception Desk to register badge return' : '走樓梯至 1F 大門接待櫃台，完成阿文門禁卡收回與註銷登記';
        }
      } else if (c.awenOrigAccess !== 'revoked') {
        nextHint = isEn ? 'Revoke A-Wen original access at 2F Duty PC & set 30-day paper grant' : '回 2F 值班電腦終止阿文原專案權限，並核定兩張圖限期授權';
      } else {
        nextHint = isEn ? 'Proceed to 2F Duty Desk to complete handover' : '請前往 2F 辦公區值班桌完成交班';
      }

      return {
        icon: isAllDone ? '🌟' : '🪪',
        title: isEn ? 'Departure Handover' : '離職保密交接清單',
        done,
        total: 5,
        unit: isEn ? 'Items' : '項',
        isAllDone,
        nextHint,
        nextHintAlert
      };
    }

    return null;
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
    if (state.chapter === 5) {
      return evaluateChapter5Handover(state);
    }

    const e = state.email;
    const v = state.visitor;
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';

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
    const endingRaw = ENDINGS_CATALOG.find((x) => x.id === endingId) || ENDINGS_CATALOG[0];
    const ending = {
      ...endingRaw,
      title: isEn && endingRaw.title_en ? endingRaw.title_en : endingRaw.title,
      desc: isEn && endingRaw.desc_en ? endingRaw.desc_en : endingRaw.desc
    };

    let emailBadge = isEn ? { text: 'Properly Completed', cls: 'ok' } : { text: '妥善完成', cls: 'ok' };
    let emailDetail = '';
    let emailReminder = isEn
      ? '“Before sending, verify from the recipient’s perspective who can open the link and which files are included.”'
      : '「寄出前，用收件人的角度確認連結誰能開啟、包含哪些檔案。」';

    if (e.misshared) {
      if (e.linkRevoked && e.reportedToLead) {
        emailBadge = isEn ? { text: 'Mis-share Remediated & Reported', cls: 'warn' } : { text: '誤分享已止血並通報', cls: 'warn' };
        emailDetail = isEn
          ? `Entire StarSky_TestData folder (including raw measurements and process notes) was originally set to public access and sent to Ms. Su at Starlight Tech. Upon receiving inquiry about forwarding to subcontractors, the public link was immediately revoked and reported to Team Lead A-Ming (with discovery time ${e.misshareTimeStr || '15:50'}, files involved, system, and actions taken).` + (e.sentSafeAfterFix ? ' The approved 2 meeting figures were subsequently resent.' : '')
          : `原本將整個 StarSky_TestData 資料夾（含原始量測數據與製程筆記）設為「持連結者皆可存取」寄給星海科技蘇小姐。發現對方詢問是否轉傳協力廠商後，已於電腦停用公開連結，並向阿明組長完成通報（含發現時間 ${e.misshareTimeStr || '15:50'}、涉及檔案、雲端連結系統與目前處置）。` + (e.sentSafeAfterFix ? ' 後續亦已改寄核准的會議用兩張圖。' : '');
        emailReminder = isEn
          ? '“When discovering a misconfigured public link, revoke access immediately to stop exposure, then report the 4 essential elements to Team Lead A-Ming: time, data, system, and current status.”'
          : '「發現誤設公開權限時，第一時間先停權止血，再清楚向阿明組長通報四要素：時間、資料、系統與現況。」';
      } else {
        emailBadge = isEn ? { text: 'Leakage Risk Unresolved', cls: 'danger' } : { text: '外洩風險未完成處置', cls: 'danger' };
        emailDetail = isEn
          ? `Test folder shared with inappropriate permissions, and partner asked about forwarding to subcontractors. Currently ${e.linkRevoked ? 'link revoked, but not yet reported to Team Lead A-Ming' : 'public link remains active and unreported'}.`
          : `將測試資料夾設為不當權限寄給合作方，且收到對方詢問是否能轉傳協力廠商。目前` + `${e.linkRevoked ? '已停用連結，但尚未向阿明組長通報' : '公開連結仍未停用，且尚未完成通報'}。`;
        emailReminder = isEn
          ? '“Once a public link is sent, anyone who receives it can access or forward it; immediately revoke access and report upon noticing an anomaly.”'
          : '「公開連結一旦發出，任何收到連結的人都可能開啟或轉傳；發現異常務必立即撤銷權限並通報。」';
      }
    } else if (e.status === 'sent_safe') {
      const expText = e.sentPermission === 'restricted_7d'
        ? (isEn ? 'Designated recipient read-only, 7-day expiration' : '指定收件人唯讀、7 天效期')
        : (isEn ? 'Designated recipient read-only (expiration recommended)' : '指定收件人唯讀（建議加設效期）');
      emailBadge = isEn ? { text: 'Verified NDA & Compliant Share', cls: 'ok' } : { text: '已確認NDA並合規分享', cls: 'ok' };
      emailDetail = isEn
        ? `Verified that Starlight Tech has an active Non-Disclosure Agreement (NDA-CS-2026, currently valid), matched approved version (Figs A & B only), and restricted access to Ms. Su (${expText}) without raw data or process notes.` + (e.usedHoldingReply ? ' Sent a holding reply earlier to avoid hasty sending.' : '')
        : `寄出前已確認星海科技已簽署有效保密協議（NDA-CS-2026，仍在效期內），並核對核准版本（僅圖A、圖B），限定分享給星海科技蘇小姐（權限：${expText}），未夾帶原始量測數據或製程筆記。` + (e.usedHoldingReply ? ' 期間並先回覆確認中，避免倉促寄出。' : '');
      emailReminder = e.sentPermission === 'restricted_7d'
        ? (isEn ? '“Before sharing data with external partners, first verify active NDA and scope, then grant minimum necessary files with expiration—the safest safeguard.”' : '「與廠商交流資料前，第一步先確認是否已簽署有效 NDA 與涵蓋範圍，再僅給最小必要檔案並設效期，就是最穩妥的防護。」')
        : (isEn ? '“Verifying NDA and designating recipients is great! Adding an expiration date prevents links from lingering indefinitely.”' : '「已先確認 NDA 簽署並指定收件人很好！若能順手加上分享期限，就能避免會議結束後連結長期有效。」');
    } else {
      emailBadge = isEn ? { text: 'Unverified NDA Status', cls: 'warn' } : { text: '未確認NDA簽署', cls: 'warn' };
      emailDetail = isEn
        ? 'Shared 2 meeting figures with Ms. Su (no raw data included), but did not verify whether Starlight Tech has an active NDA (Non-Disclosure Agreement) and its covered scope before sending.'
        : `僅分享了會議用兩張圖給蘇小姐（未夾帶原始數據），但寄出前尚未確認星海科技是否已簽署有效 NDA（保密協議）及其涵蓋對象與用途。`;
      emailReminder = isEn
        ? '“Before sharing research data with partners, always verify if an active NDA exists, remains in effect, and covers the specific files and recipients!”'
        : '「與廠商交流研究資料前，務必先確認對方是否已簽署有效 NDA、仍在效期內，且涵蓋這次提供的資料與對象！」';
    }

    let visitorBadge = isEn ? { text: 'Compliantly Completed', cls: 'ok' } : { text: '合規完成', cls: 'ok' };
    let visitorDetail = '';
    let visitorReminder = isEn
      ? '“Before taking photos, look not only at the framing, but also scan background whiteboards, screens, and sample labels.”'
      : '「拍照前不只看構圖，更要掃視背景的白板、螢幕與樣品標籤。」';

    if (v.status === 'done_entrance') {
      visitorBadge = isEn ? { text: 'Approved Scope Photo', cls: 'ok' } : { text: '核准範圍拍攝', cls: 'ok' };
      visitorDetail = isEn
        ? 'Guided Mr. Chen to take a commemorative photo at the designated entrance logo wall per registration, completely isolating restricted research data.' + (v.pausedAndFixed ? ' (Spotted risk in lab earlier and switched back to entrance angle.)' : '')
        : `依接待登記核准範圍，引導陳先生在訪客入口指定角度拍攝形象牆合照，完全未揭露實驗區內研究資訊。` + (v.pausedAndFixed ? '（途中先在實驗區預覽發現入鏡風險，果斷改回核准角度拍攝。）' : '');
      visitorReminder = isEn
        ? '“The designated entrance angle satisfies guest souvenir photos while naturally shielding sensitive lab information.”'
        : '「入口指定角度既能滿足參訪留念，又能自然隔絕實驗區內的敏感資訊。」';
    } else if (v.status === 'done_lab_clean') {
      visitorBadge = isEn ? { text: 'Escorted & Area Cleared', cls: 'ok' } : { text: '陪同並完成清場', cls: 'ok' };
      visitorDetail = isEn
        ? 'Accompanied Mr. Chen into lab area after erasing whiteboard parameters, locking screens, and storing sample batch labels—clean viewfinder with zero leakage risk.' + (v.pausedAndFixed ? ' (Paused during preview to tidy up and prevented leakage!)' : '')
        : `全程陪同陳先生進入實驗區，拍攝前已將白板研究參數、實驗螢幕畫面與樣品代碼標籤全數擦拭／鎖定／收妥，取景畫面乾淨無外洩風險。` + (v.pausedAndFixed ? '（在預覽時即時喊卡整理現場，成功避免外洩！）' : '');
      visitorReminder = isEn
        ? '“Always escort visitors in lab areas and check whiteboards, screens, and sample labels before clicking the shutter.”'
        : '「訪客進實驗區務必全程陪同，按下快門前逐一檢查白板、螢幕與樣品標籤。」';
    } else {
      visitorBadge = isEn ? { text: 'Sensitive Data in Frame', cls: 'danger' } : { text: '敏感資訊入鏡', cls: 'danger' };
      visitorDetail = isEn
        ? `Accompanied photo captured unshielded sensitive data: ${v.leakedItems.join(', ')}. Visitor noted photo will be published in public visit report—leakage risk exists.`
        : `陪同陳先生在實驗區拍照時，畫面拍入了未遮蔽的敏感資訊：${v.leakedItems.join('、')}。訪客表示照片將用於對外參訪報告，存在外洩風險。`;
      visitorReminder = isEn
        ? '“When research data or labels appear in frame, politely pause and shield them first—the best protection for both parties.”'
        : '「發現鏡頭內有研究數據或標籤時，禮貌暫停拍攝並先收妥遮蔽，才是對雙方最好的保護。」';
    }

    let trackBadge = isEn ? { text: 'No Pending Anomalies', cls: 'ok' } : { text: '無待追蹤異常', cls: 'ok' };
    let trackItems = [];
    let trackReminder = isEn
      ? '“Preserve records of actual version, recipients, and actions taken to maintain an accountable paper trail for future reference.”'
      : '「留下實際提供的版本、對象與處置紀錄，未來需要追溯時就能有憑有據。」';

    if (e.misshared) {
      if (e.linkRevoked && e.reportedToLead) {
        trackBadge = isEn ? { text: 'Follow-up Items Logged', cls: 'warn' } : { text: '有待追蹤事項（已立案）', cls: 'warn' };
        trackItems.push(isEn ? '[Mis-share Tracking] Team Lead A-Ming to follow up with Starlight Tech on whether subcontractors accessed or downloaded files.' : '【誤分享追蹤】協力廠商是否已取得或下載原始檔案，待阿明組長與星海科技窗口進一步確認。');
        trackItems.push(isEn ? '[Record Preserved] Logged original share scope (public link), revocation time, and 4 report elements.' : '【紀錄留存】已記錄原始分享範圍（公開連結）、停權時間與通報四要素。');
      } else {
        trackBadge = isEn ? { text: 'Critical Anomaly Unresolved', cls: 'danger' } : { text: '緊急異常未處理', cls: 'danger' };
        if (!e.linkRevoked) trackItems.push(isEn ? '[URGENT] Public share link remains active—must revoke immediately!' : '【緊急】公開分享連結仍處於啟用狀態，須立即停用！');
        if (!e.reportedToLead) trackItems.push(isEn ? '[URGENT] Have not reported mis-share incident to Team Lead A-Ming.' : '【緊急】尚未向負責人阿明組長通報誤分享事件。');
        trackItems.push(isEn ? '[Risk] Partner inquired about subcontractor forwarding; verify exposure scope promptly.' : '【風險】合作方已詢問是否可轉傳協力廠商，須儘速確認擴散範圍。');
      }
      trackReminder = isEn
        ? '“When suspected leakage happens, do not quietly delete and ignore it; report early and document to control impact.”'
        : '「發生疑似外洩時不要自行默默刪掉就算了；及早通報並留存紀錄，才能真正控制影響範圍。」';
    }

    if (v.status === 'done_lab_leaked') {
      trackBadge = isEn ? { text: 'Photo Anomaly Needs Follow-up', cls: 'danger' } : { text: '異常照片需追蹤', cls: 'danger' };
      trackItems.push(isEn ? `[Photo Leakage] Visitor photo captured "${v.leakedItems.join(', ')}". Must notify Lead immediately and coordinate photo deletion.` : `【拍攝外洩】訪客照片拍入「${v.leakedItems.join('、')}」，須立刻向阿明組長通報並協調訪客刪除原檔。`);
    }

    if (trackItems.length === 0) {
      trackItems.push(isEn ? 'Both tasks completed compliantly today. Preserved version/recipient/expiration logs and visitor log. No anomalies to track.' : '今日兩項任務皆依規範完成，已留存分享版本／對象／效期紀錄與訪客接待紀錄，無異常事件須追蹤。');
      if (e.status === 'sent_safe' && e.sentPermission === 'restricted_7d') {
        trackItems.push(isEn ? '[Routine Note] Link automatically expires in 7 days; review project folder access list then.' : '【例行提醒】7 天後分享連結將自動失效，屆時可再確認專案資料夾授權名單。');
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
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const submittedVer = c.submittedVersionId ? getVersionById(state, c.submittedVersionId) : null;
    const approvedVers = c.versions.filter((v) => v.status === 'approved');

    let banner = {
      icon: '✅',
      title: isEn ? 'Submission Completed Post-Approval' : '核准後提交完成',
      desc: isEn ? 'Organized poster, obtained Team Lead A-Ming\'s approval, and accurately verified filename before submitting approved version.' : '已整理海報、取得阿明組長確認，並正確核對檔名後提交核准版本。'
    };
    let routeBadge = isEn ? { text: 'Submitted Approved Version', cls: 'ok' } : { text: '已提交核准版', cls: 'ok' };
    let routeDetail = '';
    let routeReminder = isEn
      ? '“This figure was previously used in a partner meeting. Before putting it on a public poster, verify that partnership agreements permit public release, and double-check the final uploaded file.”'
      : '「這張圖上次用於合作會議。放進公開海報前，要確認合作約定是否涵蓋公開用途，也要核對最後上傳的版本。」';

    let versionBadge = isEn ? { text: 'Complete Version Trail', cls: 'ok' } : { text: '版本紀錄完整', cls: 'ok' };
    let versionLines = c.versions.map((v) => {
      const m = getVersionStatusMeta(v.status);
      const mText = isEn ? (v.status === 'approved' ? 'Approved' : v.status === 'draft' ? 'Draft' : v.status === 'pending_review' ? 'Under Review' : 'Needs Re-approval') : m.text;
      const vSummary = isEn
        ? (v.id === 'v1' ? 'Original draft: Fig 2 partner data, Fig 3 patent data included.' : v.slots.fig3 === 'removed' && v.slots.fig2 === 'alt' ? 'Alternative Fig 2, Fig 3 removed. Safe version.' : 'Edited version.')
        : v.summary;
      return `${v.filename} (${mText}) — ${vSummary}`;
    });

    let followBadge = isEn ? { text: 'No Pending Anomalies', cls: 'ok' } : { text: '無待處理異常', cls: 'ok' };
    let followItems = [];
    let followReminder = isEn
      ? '“Retain the approved version and confirmation record before public release; any subsequent modifications must be treated as a new version requiring re-approval.”'
      : '「對外發表前保留核准版本與確認紀錄，核准後若再修改，就必須視為新版本重新確認。」';

    if (c.outcome === 'submitted_approved' && submittedVer) {
      banner = {
        icon: '🏅',
        title: isEn ? 'Prudently Submitted After Approval' : '核准後穩妥提交',
        desc: isEn ? 'Obtained alternative figure from A-Wen, removed patent-pending Fig 3, and submitted approved poster upon Team Lead A-Ming\'s approval.' : '找阿文取得替代圖、移除專利待確認的圖三，經阿明組長核准後正確上傳核准版海報。'
      };
      routeBadge = isEn ? { text: 'Submitted After Approval', cls: 'ok' } : { text: '核准後提交', cls: 'ok' };
      routeDetail = isEn
        ? `Actual File Submitted: ${submittedVer.filename} (Submission time: ${c.submittedTimeStr || '18:20'}). Approval: Approved by Team Lead A-Ming at ${submittedVer.approvedAt || '18:15'}. Summary: Alternative Fig 2, Fig 3 removed.`
        : `實際提交檔案：${submittedVer.filename}（提交時間：${c.submittedTimeStr || '18:20'}）。核准狀態：已由${submittedVer.approvedBy || '阿明組長'}於 ${submittedVer.approvedAt || '18:15'} 確認核准。內容：${submittedVer.summary}。`;
      followItems.push(isEn ? 'Archived final approved poster and Team Lead A-Ming confirmation record for audit.' : '已留存最終核准版海報與阿明組長確認紀錄，可直接備查。');
      followItems.push(isEn ? 'Fig 3 “Test Conditions & Results”: To be evaluated for public timing after patent filing arrangements are finalized.' : '圖三「測試條件與結果摘要」待日後專利申請安排確定後，再評估後續公開時機。');
    } else if (c.outcome === 'deferred') {
      banner = {
        icon: '⏸️',
        title: isEn ? 'Prudently Deferred Submission' : '審慎暫緩投稿',
        desc: isEn ? 'Identified unconfirmed partner data and pending patent arrangements; prudently chose to defer submission to prevent unauthorized disclosure.' : '發現合作資料公開用途或專利申請安排尚待確認，選擇先暫緩上傳，避免未核准資訊對外公開。'
      };
      routeBadge = isEn ? { text: 'Submission Deferred', cls: 'warn' } : { text: '暫緩提交', cls: 'warn' };
      const reasons = isEn
        ? ['Fig 2 "Partner Data" (unconfirmed whether partner agreement permits public release)', 'Fig 3 "Test Conditions" (patent filing arrangements and public timing unconfirmed)']
        : (c.deferredReasons.length > 0 ? c.deferredReasons : ['圖二「合作方量測圖」（合作會議用途是否涵蓋公開海報尚待確認）', '圖三「測試條件與結果摘要」（專利申請安排與公開時點尚待確認）']);
      routeDetail = isEn ? `Poster not uploaded. Reasons for deferral: ${reasons.join('; ')}.` : `本次尚未上傳海報。暫緩原因：${reasons.join('；')}。`;
      routeReminder = isEn
        ? '“Rushing to submit before the deadline carries the greatest risk; when authorization or patent arrangements cannot be confirmed, deferring and documenting next steps is the safest practice.”'
        : '「趕在截止前草率上傳反而風險最大；確認不到公開授權或專利安排時，暫緩提交並記下下一步才是穩妥做法。」';
      followBadge = isEn ? { text: 'Pending Follow-up', cls: 'warn' } : { text: '待後續確認', cls: 'warn' };
      followItems.push(isEn ? `[Pending Figures] ${reasons.join('; ')}` : `【待確認圖片】${reasons.join('；')}`);
      followItems.push(isEn ? '[Next Action] Request A-Wen to prepare alternative figures, verify partner contract terms and patent timeline with Team Lead A-Ming, then resubmit.' : `【下一步行動】${c.deferredNextStep || '請阿文準備公開替代圖、並與阿明組長確認合作契約公開條款及專利申請時程後，再重新送審。'}`);
    } else if (c.outcome === 'misuploaded') {
      const fullyRemediated = c.contactedOrganizer && c.reportedToLead;
      if (fullyRemediated) {
        banner = {
          icon: '🚒',
          title: isEn ? 'Prompt Remediation After Mis-upload' : '誤傳舊版後即時補救',
          desc: isEn ? 'Upon discovering mis-upload of an unconfirmed version, immediately contacted organizer for retraction, reported to Team Lead A-Ming, and tracked public exposure.' : '發現誤傳未確認版本後，已聯絡主辦方提出撤換請求並向阿明組長回報，持續追蹤公開狀態。'
        };
        routeBadge = isEn ? { text: 'Remediation Initiated', cls: 'warn' } : { text: '誤傳已啟動補救', cls: 'warn' };
        followBadge = isEn ? { text: 'Public Status Pending', cls: 'warn' } : { text: '公開狀態待確認', cls: 'warn' };
      } else {
        banner = {
          icon: '⚠️',
          title: isEn ? 'Mis-uploaded Poster Awaiting Remediation' : '誤傳海報尚待補救',
          desc: isEn ? 'Uploaded an unconfirmed version, and critical remediation steps remain incomplete at shift handover!' : '已上傳未確認可公開的版本，且交班時仍有補救步驟尚未完成！'
        };
        routeBadge = isEn ? { text: 'Remediation Incomplete', cls: 'danger' } : { text: '誤傳未完成補救', cls: 'danger' };
        followBadge = isEn ? { text: 'Urgent Matters Unresolved', cls: 'danger' } : { text: '緊急事項未處理', cls: 'danger' };
      }

      const subMeta = submittedVer ? getVersionStatusMeta(submittedVer.status).text : '未確認可公開';
      const issues = submittedVer ? getVersionIssues(submittedVer, c.clues) : [];
      routeDetail = isEn
        ? `Mis-uploaded File: ${c.submittedFilename || 'Poster_v1_Draft.pdf'} (Status: ${subMeta}, Uploaded at: ${c.misuploadTimeStr || '18:15'}).` +
          (issues.length > 0 ? ` Contains unconfirmed data: ${issues.join('; ')}.` : ' This version was edited after approval or unconfirmed.')
        : `誤傳檔案：${c.submittedFilename || 'Poster_v1_原始草稿.pdf'}（狀態：${subMeta}，上傳時間：${c.misuploadTimeStr || '18:15'}）。` +
          (issues.length > 0 ? `內含未確認內容：${issues.join('；')}。` : '該版本為核准後重新編輯或尚未取得阿明組長確認之版本。') +
          (approvedVers.length > 0 ? `（註：當時電腦中已有核准版 ${approvedVers[approvedVers.length - 1].filename}，因選錯檔案而誤傳。）` : '');

      if (c.contactedOrganizer) {
        followItems.push(isEn ? `[Contacted Organizer] Contacted organizer at ${c.contactedOrganizerTimeStr || '18:18'}—status: "Retraction requested, public status pending confirmation".` : `【已聯絡主辦方】於 ${c.contactedOrganizerTimeStr || '18:18'} 透過投稿系統聯繫主辦方——目前狀態：「已提出撤換請求，公開狀態待確認」。`);
      } else {
        followItems.push(isEn ? '[PENDING - URGENT] Have not contacted symposium organizer via PC to request retraction/takedown! File remains uploaded.' : '【尚待處理－緊急】尚未透過辦公區電腦聯絡研討會主辦方申請撤換或下架！目前該檔案仍處於已上傳狀態。');
      }

      if (c.reportedToLead) {
        followItems.push(isEn ? '[Reported to Lead] Reported mis-uploaded version and affected figures to Team Lead A-Ming; Lead will track organizer response.' : '【已回報負責人】已向阿明組長回報誤傳版本與涉及圖片，後續由阿明組長協助追蹤主辦方回覆與合作方／專利影響。');
      } else {
        followItems.push(isEn ? '[PENDING - URGENT] Have not reported mis-upload incident to Team Lead A-Ming!' : '【尚待處理－緊急】尚未向辦公區負責人阿明組長回報誤傳事件！');
      }

      followItems.push(isEn ? '[Retraction & Public Status] Until organizer formally confirms takedown or replacement, keep status marked as "Public status pending confirmation".' : '【撤換與公開狀態】在主辦方正式確認下架或完成檔案替換前，公開狀態仍須標記為「公開狀態待確認」並持續追蹤。');
      followReminder = isEn
        ? '“Even with an approved version ready, selecting the wrong filename at the moment of upload causes leakage. Immediately contact the organizer to retract and report to your lead.”'
        : '「即使已經取得核准版，上傳瞬間選錯檔名仍會造成外洩。誤傳後務必立刻聯繫主辦方撤換並向負責人回報，且持續追蹤直到確認未公開。」';
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
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const c = state.ch3;
    const origOpen = c.awenOrigAccess !== 'revoked';

    if (role === 'awen') {
      return [
        {
          title: isEn
            ? `1. Raw Measurement Log (${c.rawLogName})`
            : `1. 原始量測紀錄（${c.rawLogName}）`,
          canOpen: origOpen,
          cls: origOpen ? 'warn' : 'ok',
          badge: origOpen
            ? (isEn ? '⚠ Accessible (Original Access Not Revoked)' : '⚠ 可開啟（原權限未關閉）')
            : (isEn ? '🔒 Inaccessible (Original Access Terminated)' : '🔒 無法開啟（原權限已終止）'),
          detail: origOpen
            ? (isEn
                ? 'A-Wen can still open full raw measurement records via unrevoked original project / personal workspace access.'
                : '阿文仍可透過尚未終止的原專案／個人工作區權限開啟完整原始量測紀錄。')
            : (isEn
                ? 'Original project & workspace permissions revoked; A-Wen can no longer access raw measurement records.'
                : '原專案與個人工作區權限已終止，阿文已無法存取原始量測紀錄。')
        },
        {
          title: isEn
            ? '2. Two Conference Figures Needed for Manuscript (StarSky_Conference_Summary_Fig_v2)'
            : '2. 後續論文需要的兩張會議用圖（StarSky_會議用摘要圖_v2）',
          canOpen: c.awenPaperGrant || origOpen,
          cls: c.awenPaperGrant && !origOpen ? 'ok' : origOpen ? 'warn' : 'warn',
          badge:
            c.awenPaperGrant && !origOpen
              ? (isEn ? `✅ View-Only Access (Duration: ${c.awenPaperDuration})` : `✅ 可唯讀檢視（限期：${c.awenPaperDuration}）`)
              : c.awenPaperGrant && origOpen
              ? (isEn ? '⚠ Accessible (Time-limited set, but original access still active)' : '⚠ 可存取（已設限期，但原專案權限仍未終止）')
              : origOpen
              ? (isEn ? '⚠ Accessible (Via Overly Broad Original Permissions)' : '⚠ 可存取（透過過廣的原專案權限）')
              : (isEn ? '🔒 Inaccessible (Time-limited grant for 2 figures not yet configured)' : '🔒 無法開啟（尚未設定兩張圖的限期授權）'),
          detail: c.awenPaperGrant
            ? (isEn
                ? `Independent time-limited grant configured per Team Lead A-Ming: Figures A & B only, restricted to manuscript revisions, expires automatically in ${c.awenPaperDuration}.`
                : `已依阿明組長核定範圍設定獨立限期授權：僅含圖A、圖B，限論文修訂使用，${c.awenPaperDuration}自動到期。`)
            : origOpen
            ? (isEn
                ? 'Currently accessible through full original project folder access rather than an independent grant scoped strictly to these two figures.'
                : '目前是透過整個原專案資料夾權限開啟，而非限縮於這兩張圖的獨立授權。')
            : (isEn
                ? 'Time-limited grant for the two approved figures needed for manuscript revision has not yet been granted to A-Wen.'
                : '尚未為阿文開通論文修訂所需的兩張核准圖限期授權。')
        },
        {
          title: isEn
            ? '3. Other Project Data Unrelated to Manuscript (Process Notes, Other Lab Folders)'
            : '3. 與後續論文無關的其他專案資料（製程筆記、其他實驗資料夾）',
          canOpen: origOpen,
          cls: origOpen ? 'danger' : 'ok',
          badge: origOpen
            ? (isEn ? '🚨 Accessible! (Overly Broad Authorization Risk)' : '🚨 仍可存取！（授權過廣風險）')
            : (isEn ? '✅ Inaccessible (Properly Segregated)' : '✅ 無法存取（已妥善隔離）'),
          detail: origOpen
            ? (isEn
                ? 'WARNING: Retaining A-Wen\'s original project permissions allows continued access after departure to proprietary process notes and other project files unrelated to the manuscript!'
                : '警告：因保留阿文原本的專案資料夾權限，離開後仍能開啟與論文修訂無關的機密製程筆記與其他專案檔案！')
            : (isEn
                ? 'Original project permissions terminated; A-Wen has no access to other laboratory records unrelated to the subsequent paper.'
                : '已終止原專案權限，阿文完全無法存取與後續論文無關的其他實驗室資料。')
        }
      ];
    }

    // role === 'qing'
    const transferred = c.rawLogLocation === 'project';
    return [
      {
        title: isEn
          ? `1. Raw Measurement Log (${c.rawLogName})`
          : `1. 原始量測紀錄（${c.rawLogName}）`,
        canOpen: transferred && c.qingHasProjectAccess,
        cls: !transferred ? 'danger' : !c.qingHasProjectAccess ? 'warn' : c.qingConfirmedOpen ? 'ok' : 'warn',
        badge: !transferred
          ? (isEn ? '❌ File Not Found (Handover Incomplete)' : '❌ 找不到檔案（尚未移交）')
          : !c.qingHasProjectAccess
          ? (isEn ? '⚠ File Transferred, Successor Lacks Access' : '⚠ 檔案已移交，接手人仍無法開啟')
          : c.qingConfirmedOpen
          ? (isEn ? '✅ Accessible (Xiao-Qing Personally Verified Reception)' : '✅ 可正常開啟（小晴已親自確認接收）')
          : (isEn ? '🟡 Accessible (Please have Xiao-Qing test open at 2F Lab)' : '🟡 可開啟（請找 2F 實驗區小晴親自確認接收）'),
        detail: !transferred
          ? (isEn
              ? `Designated project location (${c.rawLogTargetPath}) does not contain this file; it remains in A-Wen's personal workspace.${c.awenOrigAccess === 'revoked' ? ' As A-Wen\'s original access is revoked, ask 1F Team Lead A-Ming for admin transfer assistance!' : ' Please visit 2F Lab area to ask A-Wen to transfer it.'}`
              : `專案指定位置（${c.rawLogTargetPath}）目前沒有此檔案，檔案仍在阿文個人工作區。${c.awenOrigAccess === 'revoked' ? ' 因阿文原權限已終止，請找 1F 阿明組長請管理員協助移交！' : ' 請到 2F 實驗區請阿文移交。'}`)
          : !c.qingHasProjectAccess
          ? (isEn
              ? `File transferred to ${c.rawLogTargetPath}, but Xiao-Qing's account has not been granted access to this folder. Opening it prompts "Permission Denied"!`
              : `檔案已移交至 ${c.rawLogTargetPath}，但小晴帳號尚未開通此資料夾存取權限，點開會顯示「權限不足」！`)
          : c.qingConfirmedOpen
          ? (isEn
              ? `File safely stored in ${c.rawLogTargetPath}; Xiao-Qing tested opening it successfully and completed confirmation.`
              : `檔案已妥善存放於 ${c.rawLogTargetPath}，且小晴已親自測試開啟無誤並完成接收確認。`)
          : (isEn
              ? `File transferred and Xiao-Qing's access activated! Please visit 2F Lab to have Xiao-Qing test opening it so the checklist checks "Confirmed by Successor".`
              : `檔案已移交且小晴權限已開通！請到 2F 實驗區請小晴親自測試開啟，交接清單才會勾選「接收人已確認」。`)
      },
      {
        title: isEn
          ? '2. Two Conference Figures Needed for Manuscript (StarSky_Conference_Summary_Fig_v2)'
          : '2. 後續論文需要的兩張會議用圖（StarSky_會議用摘要圖_v2）',
        canOpen: c.qingHasProjectAccess,
        cls: c.qingHasProjectAccess ? 'ok' : 'warn',
        badge: c.qingHasProjectAccess
          ? (isEn ? '✅ Accessible (Project Folder)' : '✅ 可存取（專案資料夾）')
          : (isEn ? '⚠ Project Access Unconfirmed' : '⚠ 尚未確認專案權限'),
        detail: c.qingHasProjectAccess
          ? (isEn
              ? 'Xiao-Qing has project folder access to StarSky Project and can cross-check figures with A-Wen for manuscript revision at any time.'
              : '小晴已具備星空計畫專案資料夾權限，可隨時對照會議用兩張圖與阿文合作修改論文。')
          : (isEn
              ? 'Can view after confirming Xiao-Qing\'s required access permissions for StarSky Project.'
              : '為小晴確認星空計畫工作所需存取權限後即可檢視。')
      },
      {
        title: isEn
          ? '3. Other Lab Project Records Unrelated to StarSky Project'
          : '3. 與星空計畫無關的其他實驗室專案資料',
        canOpen: false,
        cls: 'ok',
        badge: isEn ? '🔒 Inaccessible (Principle of Least Privilege)' : '🔒 無法存取（符合最小權限原則）',
        detail: isEn
          ? 'Per operational need, granted access to StarSky Project only; no access to unrelated lab project folders.'
          : '依工作需要僅開放星空計畫存取權限，不開放無關專案資料夾。'
      }
    ];
  }

  function getCh3PendingItems(state) {
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const c = state.ch3;
    const pending = [];
    if (c.rawLogLocation !== 'project') {
      if (isEn) {
        pending.push(
          c.awenOrigAccess === 'revoked'
            ? 'Raw measurement log not yet transferred (original access revoked; consult 1F Team Lead A-Ming for admin transfer assistance).'
            : 'Raw measurement log still in A-Wen\'s personal workspace, not yet transferred to designated project folder.'
        );
      } else {
        pending.push(
          c.awenOrigAccess === 'revoked'
            ? '原始量測紀錄尚未移交（因已終止阿文原權限，須找 1F 阿明組長請管理員協助移交指定檔案）'
            : '原始量測紀錄仍在阿文個人工作區，尚未移交至專案指定位置'
        );
      }
    }
    if (!c.qingHasProjectAccess) {
      pending.push(isEn ? 'Project folder access permissions not yet confirmed for successor Xiao-Qing.' : '尚未為接手人小晴確認專案資料夾存取權限');
    }
    if (!c.qingConfirmedOpen) {
      pending.push(isEn ? 'Record not yet personally tested and reception confirmed by Xiao-Qing at 2F Lab.' : '尚未由 2F 實驗區的小晴親自測試開啟紀錄並確認接收');
    }
    if (c.awenOrigAccess !== 'revoked') {
      pending.push(isEn ? 'A-Wen\'s original project folder permissions remain open (can access raw logs and unrelated project data; must terminate original access).' : '阿文的原專案資料夾權限仍開放中（可存取原始紀錄與無關專案資料，須終止原權限）');
    }
    if (!c.awenPaperGrant) {
      pending.push(isEn ? 'Time-limited grant for the 2 approved conference figures (30 days post-departure) not yet configured for A-Wen per Team Lead approval.' : '尚未依阿明組長核定範圍，為阿文設定僅含兩張會議圖的限期授權（離開後 30 天）');
    }
    if (!c.badgeReturned) {
      pending.push(isEn ? 'A-Wen\'s physical access badge not yet collected and logged at 1F Main Reception Desk.' : '尚未於 1F 大門接待櫃台收回阿文的實體門禁卡並完成登記');
    }
    if (!c.ndaRemindedToAwen) {
      pending.push(isEn ? 'Ongoing post-departure confidentiality obligations and data removal restrictions not yet reminded to A-Wen in handover dialogue.' : '尚未透過交接對話提醒阿文離開後仍須遵守的保密義務與資料攜出限制');
    }
    return pending;
  }

  function evaluateChapter3Handover(state) {
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const c = state.ch3;
    const pending = getCh3PendingItems(state);
    const complete = pending.length === 0;
    const origOpen = c.awenOrigAccess !== 'revoked';

    let ch3EndingId = 'ch3_complete';
    let banner = {
      icon: '🏅',
      title: isEn ? 'Flawless Offboarding Handover & Scoped Grant' : '完美離職交接與限期授權',
      desc: isEn
        ? 'Data fully transferred and confirmed by Xiao-Qing; original permissions revoked and replaced with a 30-day grant for 2 figures; badge collected and confidentiality obligations reminded.'
        : '資料完整移交並由小晴確認開啟，終止原專案權限、改設兩張圖 30 天限期授權，並完成 1F 門禁卡收回與保密提醒。'
    };

    if (!complete) {
      ch3EndingId = origOpen ? 'ch3_overbroad_risk' : 'ch3_incomplete';
      banner = origOpen
        ? {
            icon: '⚠️',
            title: isEn ? 'Handover Alert: Original Permissions Still Open' : '交班警報：原專案權限仍開放',
            desc: isEn
              ? 'Retaining original project permissions allows departing personnel continuous access to confidential data unrelated to the manuscript! Handover notes list risks and pending tasks.'
              : '保留原專案權限會讓離任人員持續存取與後續論文無關的機密資料！交班清單已列出風險與待辦事項。'
          }
        : {
            icon: '⚠️',
            title: isEn ? 'Offboarding Handover Has Pending Tasks' : '離職交接尚有未完成待辦',
            desc: isEn
              ? 'Handing over with unresolved tasks; the handover notes identify remaining items. It is recommended to replay to complete the full procedure.'
              : '本次帶著未完成事項交班，交班清單已明確標出剩餘待辦項目，建議重玩補齊完整流程。'
          };
    } else if (c.interruptedByEarlyRevoke && c.adminTransferCompleted) {
      ch3EndingId = 'ch3_admin_remediated';
      banner = {
        icon: '🚒',
        title: isEn ? 'Successful Remediation After Interruption' : '交接中斷後成功補救',
        desc: isEn
          ? 'Although early revocation interrupted handover, original full access was not restored; Team Lead A-Ming utilized administrator privileges to transfer designated files, and Xiao-Qing verified opening!'
          : '雖曾太早終止原權限導致交接中斷，但未恢復阿文整包權限，而是透過阿明組長以管理員協助移交指定檔案並由小晴確認開啟！'
      };
    }

    unlockCh3Ending(ch3EndingId);

    // Section 1: 資料交接與小晴接收確認
    let transferBadge = { text: isEn ? 'Transferred & Confirmed' : '已移交並確認接收', cls: 'ok' };
    if (c.rawLogLocation !== 'project' || !c.qingConfirmedOpen) {
      transferBadge = { text: isEn ? 'Handover Incomplete' : '交接未完成', cls: 'danger' };
    } else if (c.interruptedByEarlyRevoke) {
      transferBadge = { text: isEn ? 'Remediated via Admin' : '中斷後管理員補救完成', cls: 'warn' };
    }

    const transferDetail = isEn
      ? `Successor: Xiao-Qing | File: ${c.rawLogName} | Designated Storage: ${c.rawLogTargetPath}. ` +
        (c.interruptedByEarlyRevoke
          ? `[Handover Interrupted] Pre-mature revocation prevented Xiao-Qing from retrieving the file; ${
              c.adminTransferCompleted
                ? 'Remediated by 1F Team Lead A-Ming via admin privileges transferring only designated records (without restoring full original access).'
                : 'Team Lead A-Ming has not yet initiated admin transfer assistance!'
            }`
          : c.rawLogLocation === 'project'
          ? 'A-Wen transferred the raw log from personal workspace to designated project location.'
          : 'File remains in A-Wen\'s personal workspace, not yet transferred.') +
        ` Successor Status: ${c.qingConfirmedOpen ? '✅ Xiao-Qing tested opening and confirmed reception at 2F Lab.' : c.qingHasProjectAccess ? '⚠ Access active, but Xiao-Qing has not personally tested opening.' : '❌ Xiao-Qing does not have access or cannot open.'}`
      : `接手人：小晴｜檔案：${c.rawLogName}｜指定存放位置：${c.rawLogTargetPath}。` +
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

    const transferReminder = isEn
      ? (c.interruptedByEarlyRevoke
          ? '“Smooth handovers verify file transfer and successor testing before revoking original access; if revoked early, request admin transfer for designated files instead of restoring broad access.”'
          : '“Offboarding handover is more than dropping files in a folder; ensure storage in designated project locations and have successors test opening them personally.”')
      : (c.interruptedByEarlyRevoke
          ? '「先確認檔案已移交並由接手人實測開啟，再終止原權限最順暢；若不慎提早關閉權限，應請管理員單獨移交指定檔案，切勿重新打開整包原權限。」'
          : '「離職交接不是把檔案丟進資料夾就好，必須確認存放於專案指定位置，並讓接手同事親自打開確認無誤。」');

    // Section 2: 權限終止與兩張圖限期授權
    let accessBadge = { text: isEn ? 'Revoked + Time-Limited Grant' : '原權限已終止＋限期授權', cls: 'ok' };
    if (origOpen) {
      accessBadge = { text: isEn ? 'Original Access Active (Overbroad)' : '原權限仍開放（過廣）', cls: 'danger' };
    } else if (!c.awenPaperGrant) {
      accessBadge = { text: isEn ? 'Revoked (No Collab Grant)' : '已停權（未設合作授權）', cls: 'warn' };
    }

    const accessDetail = isEn
      ? `Original Project Access: ${origOpen ? '🚨 Still active! A-Wen can still access Raw Measurement Logs, Two Conference Figures, and Unrelated Lab Secrets.' : '✅ Revoked; A-Wen can no longer access raw records or unrelated project data.'} ` +
        `Manuscript Collab Grant: ${
          c.awenPaperGrant
            ? `✅ Independent time-limited grant configured — Scope: ${c.awenPaperPurpose}; Duration: ${c.awenPaperDuration}.`
            : '⬜ Time-limited grant for 2 conference figures not yet configured.'
        }`
      : `原專案權限：${origOpen ? '🚨 仍開放中！阿文目前仍可存取「原始量測紀錄」、「兩張會議圖」以及「與後續論文無關的其他專案機密資料」。' : '✅ 已終止，阿文已無法存取原始紀錄與無關專案資料。'}` +
        ` 後續論文合作授權：${
          c.awenPaperGrant
            ? `✅ 已設定獨立限期授權——範圍：${c.awenPaperPurpose}；期限：${c.awenPaperDuration}。`
            : '⬜ 尚未設定僅含兩張會議圖的限期授權。'
        }`;

    const accessReminder = isEn
      ? '“Original project permissions must be revoked on the employee’s last day; if ongoing manuscript collaboration is needed, issue an independent grant with minimum scope, clear purpose, and explicit duration.”'
      : '「人員離職當日應立即取消原專案權限；若仍有論文修訂等合作需求，應另行核定最小範圍、用途與明確期限的獨立授權。」';

    // Section 3: 實體門禁、保密提醒與待辦追蹤
    let complianceBadge = complete
      ? { text: isEn ? 'All Complete' : '全數完成', cls: 'ok' }
      : { text: isEn ? `${pending.length} Pending Items` : `尚有 ${pending.length} 項待辦`, cls: origOpen ? 'danger' : 'warn' };

    const complianceItems = isEn
      ? [
          `[1F Physical Access Badge] ${c.badgeReturned ? '✅ Collected and recorded at 1F Main Reception Desk (governed separately from electronic access).' : '❌ Physical access badge not yet collected and recorded at 1F Main Reception Desk!'}`,
          `[Offboarding Confidentiality Reminder] ${c.ndaRemindedToAwen ? '✅ Reminded A-Wen via handover dialogue of ongoing post-employment confidentiality obligations and research data removal restrictions.' : '❌ Ongoing confidentiality obligations not yet confirmed with A-Wen!'}`
        ]
      : [
          `【1F 實體門禁卡】${c.badgeReturned ? '✅ 已於 1F 大門接待櫃台收回阿文的門禁卡並完成登記（與電子權限分開管制）。' : '❌ 尚未於 1F 大門接待櫃台收回並登記門禁卡！'}`,
          `【離職保密義務提醒】${c.ndaRemindedToAwen ? '✅ 已透過交接對話向阿文再次提醒離職後仍適用之保密約定與研究資料攜出限制。' : '❌ 尚未向阿文確認保密約定並提醒離職後保密義務！'}`
        ];

    if (pending.length > 0) {
      pending.forEach((p) => complianceItems.push(isEn ? `[Pending] ${p}` : `【待辦事項】${p}`));
    } else {
      complianceItems.push(
        isEn
          ? `[Routine Follow-up] In ${c.awenPaperDuration}, the system will automatically revoke A-Wen's view-only access to the 2 conference figures. Permissions may be reviewed then.`
          : `【例行追蹤】${c.awenPaperDuration}後系統將自動撤銷阿文的兩張會議圖唯讀授權，屆時可再確認權限清單。`
      );
    }

    const complianceReminder = isEn
      ? '“Physical credential return, electronic access revocation, data reception verification, and confidentiality reminders: all four are indispensable and must be verified and logged individually.”'
      : '「實體門禁憑證回收、電子存取權限終止、資料實測交接與保密義務提醒四者缺一不可，須分項確認並留下紀錄。」';

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
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const c = state.ch4;
    const isPerfect = c.cardsCompleted && c.draftSaved && c.updatedSaved && c.verifiedWithQing;
    const endingId = isPerfect ? 'ch4_perfect_list' : 'ch4_incomplete_list';
    unlockCh4Ending(endingId);

    const banner = isPerfect
      ? {
          icon: '🏅',
          title: isEn ? 'R&D Records Inventory Paradigm' : '研發成果清單盤點典範',
          desc: isEn
            ? 'Accurately distinguished proprietary know-how and patent filings, implemented all 5 mandatory fields, and updated publication statuses in a timely manner!'
            : '精準分辨自研 know-how 與專利資料，落實清單五欄位，並在專利公開時及時精確更新！'
        }
      : {
          icon: '⚠️',
          title: isEn ? 'R&D Inventory Incomplete' : '研發成果清單尚有待補強項目',
          desc: isEn
            ? 'Inventory draft is incomplete or unverified with Xiao-Qing. Handover notes list items requiring attention!'
            : '清單草稿尚未完整更新或尚未向小晴確認盤點。交班紀錄已列出補強方向！'
        };

    // Section 1: 資料辨識與群組整理
    const cardBadge = c.cardsCompleted
      ? { text: isEn ? 'Accurately Classified' : '精準分類', cls: 'ok' }
      : { text: isEn ? 'Pending Identification' : '尚未完成辨識', cls: 'warn' };
    const cardDetail = isEn
      ? 'Distinguished routine public tutorial replication (routine lab log) from proprietary know-how (measurement conditions & tuning) and patent filings; organized by data cluster without copying secret parameters into the catalog.'
      : '成功分辨公開教學重現（留作一般紀錄）、自研 know-how（量測條件優化與調校紀錄）與專利申請資料；以群組建立清單，機密參數與檔案明細留在受控資料夾。';
    const cardReminder = isEn
      ? '“The inventory is a management catalog to let colleagues know where to look and whom to consult; trade secret details remain in controlled folders.”'
      : '「清單是管理與查找目錄，讓同事知道去哪裡找、找誰問；機密技術細節應留在受控位置。」';

    // Section 2: 清單五欄位落實
    const fieldBadge = c.draftSaved
      ? { text: isEn ? 'All 5 Fields Complete' : '五欄位齊備', cls: 'ok' }
      : { text: isEn ? 'Incomplete Draft' : '清單未完整儲存', cls: 'warn' };
    const fieldDetail = isEn
      ? 'Every entry clearly records the 5 mandatory fields: Record Name or Scope, Record Type, Reason for Protection, Storage Location, Person Responsible.'
      : '每筆資料皆清楚載明五項必要欄位：資料名稱或範圍、資料類型、保護原因、存放位置、負責人，資訊完整明確。';
    const fieldReminder = isEn
      ? '“Implementing the 5 required fields enables successors to conduct smooth inventories without verbal explanations.”'
      : '「落實五個必要欄位，接手同事才能在無口頭交接下順暢盤點。」';

    // Section 3: 動態更新與公開界線
    const updateBadge = c.updatedSaved
      ? { text: isEn ? 'Updated Accurately' : '精確更新留痕', cls: 'ok' }
      : { text: isEn ? 'Pending Update' : '公開狀態未更新', cls: 'warn' };
    const updateDetail = c.updatedSaved
      ? (isEn
          ? 'Upon patent publication, updated original application entry (no duplicates created), while maintaining controlled protection for undisclosed tuning and optimization know-how.'
          : '專利公開時，精準更新申請資料原有項目（不建重複紀錄），並清楚保留未納入申請之調校紀錄與自研優化紀錄的未公開保護狀態。')
      : (isEn
          ? 'When a patent application publishes, verify the scope of published documents and update only disclosed portions; keep remaining know-how protected.'
          : '專利申請公開時，應核對公開文件範圍，僅更新涵蓋部分，其餘未公開 know-how 應繼續受控保護。');
    const updateReminder = isEn
      ? '“When an application publishes, verify the actual scope disclosed; undisclosed know-how must remain strictly protected.”'
      : '「申請案公開時，應核對實際公開範圍，僅更新涵蓋部分，未公開的 know-how 仍應繼續受控保護。」';

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

  // ===== Chapter 3 (Internal 5): Document Marking Validation & Handover =====
  function setCh5DocMarking(state, docIdx, markingChoice) {
    const c = state.ch5;
    const doc = c.docs[docIdx];
    if (!doc) return null;

    doc.chosenMarking = markingChoice;

    if (doc.id === 'poster') {
      if (markingChoice === 'confidential') {
        doc.isCorrect = false;
        doc.feedback = '⚠️ 這是要對外張貼宣傳的公開活動海報，若誤標機密會導致無法公開宣傳張貼；內容無未公開技術，確認為公開資訊即可不標機密。';
        doc.feedback_en = '⚠️ This is a public event poster. Marking it confidential prevents public outreach. Since it contains no undisclosed know-how, keep it as public edition.';
      } else {
        doc.isCorrect = true;
        doc.feedback = '✅ 判定正確！活動海報用途是對外公開宣傳，內容亦無未公開自研技術，維持公開版面即可。';
        doc.feedback_en = '✅ Correct! The poster is for public promotion and has no undisclosed technical know-how. Maintain public layout.';
      }
    } else if (doc.id === 'slides') {
      if (markingChoice === 'public') {
        doc.isCorrect = false;
        doc.feedback = '⚠️ 這份簡報包含團隊未公開的調校方法 know-how，若未標示機密，接手人或他人很容易誤以為是一般技術分享而轉發外流！';
        doc.feedback_en = '⚠️ This deck contains undisclosed tuning know-how. Without a Confidentiality Label, others might assume it is general material and re-share it externally!';
      } else {
        doc.isCorrect = true;
        doc.feedback = '✅ 判定正確！簡報包含自研 know-how，必須在封面與每頁頁腳標註機密與授權範圍，防止未授權轉發。';
        doc.feedback_en = '✅ Correct! Contains proprietary know-how. Prominent Confidentiality Labels on title slide and footers prevent unauthorized re-distribution.';
      }
    } else if (doc.id === 'paper') {
      if (markingChoice === 'public') {
        doc.isCorrect = false;
        doc.feedback = '⚠️ 紙本紀錄一旦放在桌面或被他人翻閱，若無首頁顯著機密標示，他人無法第一時間辨識並依機密規範鎖入公文櫃！';
        doc.feedback_en = '⚠️ If paper records sit on desks, lacking a prominent Confidentiality stamp prevents colleagues from identifying and locking them into the filing cabinet!';
      } else {
        doc.isCorrect = true;
        doc.feedback = '✅ 判定正確！紙本原始紀錄必須在首頁顯著蓋上機密紅章與管制編號，確保實體保管與桌面淨空。';
        doc.feedback_en = '✅ Correct! Original paper research records must have a prominent Confidentiality stamp & control number on the cover to ensure physical security and clean-desk policy.';
      }
    }

    c.markingCompleted = c.docs.every((d) => d.isCorrect);
    return {
      doc,
      isCorrect: doc.isCorrect,
      feedback: doc.feedback,
      allCompleted: c.markingCompleted
    };
  }

  function unlockCh5Ending(id) {
    try {
      const raw = localStorage.getItem(CH5_STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(arr) ? arr : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(CH5_STORAGE_KEY, JSON.stringify(list));
      }
      return list;
    } catch {
      return [id];
    }
  }

  function evaluateChapter5Handover(state) {
    const isEn = window.BS && window.BS.I18n && window.BS.I18n.getLang() === 'en';
    const c = state.ch5;
    const isPerfect = c.markingCompleted && c.verifiedWithQing;
    const endingId = isPerfect ? 'ch5_perfect_marking' : 'ch5_incomplete_marking';
    unlockCh5Ending(endingId);

    const banner = isPerfect
      ? {
          icon: '🏷️',
          title: isEn ? 'Document Labeling & Custody Paradigm' : '文件標示與防護交接典範',
          desc: isEn
            ? 'Accurately classified public promotional posters vs undisclosed technical documents, placed prominent Confidentiality Labels on cover, footers & paper cover, and verified custody with successor!'
            : '精準判定公開海報與未公開技術文件，落實封面、頁腳與紙本首頁顯著機密標示，並向接手人完整交接！'
        }
      : {
          icon: '⚠️',
          title: isEn ? 'Document Labeling Incomplete' : '文件標示尚有未完成項目',
          desc: isEn
            ? 'Not all three documents have been properly labeled, or custody has not been verified with Xiao-Qing.'
            : '尚未完成全部三份文件的機密標示或尚未交由小晴確認。交班紀錄已列出待辦事項！'
        };

    const docBadge = c.markingCompleted
      ? { text: isEn ? 'Accurately Labeled' : '精準標示', cls: 'ok' }
      : { text: isEn ? 'Incomplete' : '尚未完成標示', cls: 'warn' };
    const docDetail = isEn
      ? 'Correctly identified public event poster (maintained public layout), electronic presentation with undisclosed tuning know-how (marked confidential with scope), and paper log with key sample measurements (stamped confidential on cover).'
      : '正確分辨可公開活動海報（維持公開版面）、含未公開調校參數之電子簡報（標註機密與授權範圍），以及含關鍵樣品量測結果之紙本手稿（首頁加蓋機密紅章）。';
    const docReminder = isEn
      ? '“Marking allows the successor and anyone seeing the document to immediately recognize its confidentiality level and custody rules.”'
      : '「標示是讓接手人與看見這份文件的人，第一時間知道它的機密等級與保管規範。」';

    const visualBadge = c.markingCompleted
      ? { text: isEn ? 'Conspicuous Placement' : '位置明確', cls: 'ok' }
      : { text: isEn ? 'Pending Preview' : '尚未預覽效果', cls: 'warn' };
    const visualDetail = isEn
      ? 'Electronic presentation labeled prominently on cover and footers with anti-forwarding warnings; paper manuscript prominently stamped with red confidential box and control number.'
      : '電子簡報於封面顯著者標註機密並於每頁頁腳標記防轉傳警語；紙本紀錄於封面與首頁顯著加蓋機密方框印章及管制編號，視覺警示清晰。';
    const visualReminder = isEn
      ? '“Labels should be placed in the most conspicuous locations (cover, header/footer, physical stamp) to avoid being overlooked.”'
      : '「標示要放在最顯眼的位置（封面、頁首頁尾、紙本印記），避免夾在內文而被忽略。」';

    const handoverBadge = c.verifiedWithQing
      ? { text: isEn ? 'Handover Completed' : '交接落實', cls: 'ok' }
      : { text: isEn ? 'Pending Handover' : '尚未與小晴交接', cls: 'warn' };
    const handoverDetail = isEn
      ? 'Xiao-Qing adopted proper custody per markings (poster for public display, slides in encrypted folder with access checks, paper locked in filing cabinet), and established the core principle: "Marking guides the handler on proper custody; before sharing, always verify recipient and authorization."'
      : '小晴依標示採取對應保管作為（海報公開張貼、簡報加密資料夾與權限確認、紙本鎖入公文櫃），並確立核心原則：「標示讓接手人知道怎麼處理，分享前仍要確認對象及權限」。';
    const handoverReminder = isEn
      ? '“Marking guides the handler on proper custody; before sharing, always verify recipient and authorization.”'
      : '「標示讓接手人知道怎麼處理，分享前仍要確認對象及權限。」';

    return {
      chapter: 5,
      complete: isPerfect,
      hasRisk: !isPerfect,
      banner,
      sections: {
        doc: { badge: docBadge, detail: docDetail, reminder: docReminder },
        visual: { badge: visualBadge, detail: visualDetail, reminder: visualReminder },
        handover: { badge: handoverBadge, detail: handoverDetail, reminder: handoverReminder }
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
    isCh5FullyComplete,
    getChapterProgress,
    getCh3AccessPreview,
    getCh3PendingItems,
    setCh5DocMarking,
    unlockCh5Ending,
    evaluateCh4Lookup,
    evaluateHandover,
    evaluateChapter2Handover,
    evaluateChapter3Handover,
    evaluateChapter4Handover,
    evaluateChapter5Handover
  };
})();
