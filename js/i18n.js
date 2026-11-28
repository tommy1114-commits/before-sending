(function () {
  window.BS = window.BS || {};

  const LANG_STORAGE_KEY = 'before_sending_language';
  let currentLang = 'zh';

  function initLang() {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') {
      currentLang = saved;
    } else {
      currentLang = 'zh';
    }
  }

  initLang();

  const DICTIONARY = {
    zh: {
      pageTitle: '寄出之前｜中研院RCCI實驗室營業秘密情境小遊戲',
      kicker: '中研院 RCCI 實驗室 · 營業秘密情境 RPG',
      gameTitle: '寄出之前',
      gameTitleSub: 'BEFORE SENDING',
      langChoiceTitle: '請選擇遊戲語言 / Please Select Language',
      langChoiceSub: '本遊戲支援完整繁體中文與英文雙語版本，日後可隨時在首頁切換',
      langBtnZh: '繁體中文',
      langBtnEn: 'English',
      langToggleText: '語言 / Language: 繁體中文',
      ch1Title: '第一章　寄出之前',
      ch2Title: '第二章　投稿前一晚',
      ch3Title: '第三章　這份文件要怎麼標？',
      ch4Title: '第四章　這批資料要列入清單嗎？',
      ch5Title: '第五章　阿文的最後一天',
      timeTag: '時間',
      timeCh1: '約 4 分鐘',
      timeCh2: '約 5 分鐘',
      timeCh3: '約 3 分鐘',
      timeCh4: '約 5 分鐘',
      timeCh5: '約 6 分鐘',
      charactersTitle: '👥 登場人物介紹',
      charactersCount: '全 6 位',
      charactersTag: '圖鑑',
      titleFooter: '↑↓ 移動游標 · A / Enter 確認 · 五章皆可直接進入',
      feedbackHeading: '遊戲意見回饋',
      feedbackInvitation: '有任何遊戲建議或問題，歡迎寄信給林哲宇。',
      feedbackCopy: '複製信箱',
      feedbackCopied: '已複製信箱',
      feedbackCopyFailed: '無法自動複製，請選取上方信箱手動複製。',
      bgmAutoplayHint: '🔊 點擊畫面任意處或按鍵立即播放首頁音樂 🎵',
      titleNavHint: '↑↓ 移動游標選擇章節 · 按 A / START / Enter 進入',
      defaultNearbyHint: '走近物件或同事查看提示 · START 選單 · SELECT 筆記',
      dialogueNextHint: '▼ 按 A / 空白鍵 / 點擊繼續',
      controlsDpad: '方向鍵',
      controlsUp: '上',
      controlsLeft: '左',
      controlsRight: '右',
      controlsDown: '下',
      controlsSelect: 'SELECT 筆記',
      controlsSelectPill: 'SELECT<small>筆記</small>',
      controlsStart: 'START 選單',
      controlsStartPill: 'START<small>暫停選單</small>',
      controlsBtnB: 'B<span>返回</span>',
      controlsBtnA: 'A<span>互動</span>',
      keyMove: '移動',
      keyActionA: 'A鍵',
      keySelect: 'SELECT',
      keyStart: 'START',
      landscapeText: '請將手機轉回直向繼續遊玩',
      landscapeSub: '本遊戲專為直向畫面設計，以獲得最佳視野與操作體驗',
      pauseTitle: '⏸ PAUSE — 遊戲暫停',
      pauseResume: '繼續遊戲',
      pauseNotes: '📋 值班筆記與任務進度（SELECT）',
      pauseMuteOn: '🔇 音效：關閉（按確認開啟）',
      pauseMuteOff: '🔊 音效：開啟（按確認靜音）',
      pauseRestart: '🔄 重新開始本章',
      pauseReturnMenu: '🏠 返回首頁選單',
      pauseSwitchLang: '🌐 切換語言 / Switch Language'
    },
    en: {
      pageTitle: 'Before Sending | Academia Sinica RCCI Lab Trade Secret RPG',
      kicker: 'Academia Sinica RCCI Lab · Trade Secret RPG',
      gameTitle: 'Before Sending',
      gameTitleSub: 'TRADE SECRET TRAINING RPG',
      langChoiceTitle: 'Please Select Language / 請選擇語言',
      langChoiceSub: 'Full Traditional Chinese & English bilingual support. You can switch languages anytime from the title screen.',
      langBtnZh: '繁體中文 (Traditional Chinese)',
      langBtnEn: 'English',
      langToggleText: 'Language: English (切換為繁體中文)',
      ch1Title: 'Chapter 1: Before Sending',
      ch2Title: 'Chapter 2: The Night Before Submission',
      ch3Title: 'Chapter 3: How to Label This Document?',
      ch4Title: 'Chapter 4: Should These Records Be Inventoried?',
      ch5Title: 'Chapter 5: A-Wen\'s Last Day',
      timeTag: 'Time',
      timeCh1: 'Est. 4 mins',
      timeCh2: 'Est. 5 mins',
      timeCh3: 'Est. 3 mins',
      timeCh4: 'Est. 5 mins',
      timeCh5: 'Est. 6 mins',
      charactersTitle: '👥 Character Profiles',
      charactersCount: '6 Characters',
      charactersTag: 'Profiles',
      titleFooter: '↑↓ Move Cursor · A / Enter Confirm · All Chapters Open',
      feedbackHeading: 'Game Feedback',
      feedbackInvitation: 'Questions or suggestions? Email 林哲宇.',
      feedbackCopy: 'Copy email address',
      feedbackCopied: 'Email address copied.',
      feedbackCopyFailed: 'Automatic copying failed. Select the email address above to copy it manually.',
      bgmAutoplayHint: '🔊 Click anywhere or press any key to play music 🎵',
      titleNavHint: '↑↓ Move cursor to select chapter · Press A / START / Enter',
      defaultNearbyHint: 'Approach objects or colleagues · START Menu · SELECT Notes',
      dialogueNextHint: '▼ Press A / Space / Click to continue',
      controlsDpad: 'D-Pad',
      controlsUp: 'Up',
      controlsLeft: 'Left',
      controlsRight: 'Right',
      controlsDown: 'Down',
      controlsSelect: 'SELECT Notes',
      controlsSelectPill: 'SELECT<small>Notes</small>',
      controlsStart: 'START Menu',
      controlsStartPill: 'START<small>Menu</small>',
      controlsBtnB: 'B<span>Back</span>',
      controlsBtnA: 'A<span>Action</span>',
      keyMove: 'Move',
      keyActionA: 'A Key',
      keySelect: 'SELECT',
      keyStart: 'START',
      landscapeText: 'Please rotate your phone back to portrait mode',
      landscapeSub: 'Designed for portrait orientation for the best map view and controls',
      pauseTitle: '⏸ PAUSE — Game Paused',
      pauseResume: 'Resume Game',
      pauseNotes: '📋 Duty Notes & Progress (SELECT)',
      pauseMuteOn: '🔇 Sound: Muted (Press to Unmute)',
      pauseMuteOff: '🔊 Sound: On (Press to Mute)',
      pauseRestart: '🔄 Restart Current Chapter',
      pauseReturnMenu: '🏠 Return to Title Menu',
      pauseSwitchLang: '🌐 Switch to 繁體中文'
    }
  };

  const SPEAKERS_MAP = {
  "1F 大門接待櫃台": "1F Main Reception Desk",
  "1F 大門接待櫃台（門禁憑證登記）": "1F Main Reception Desk (Badge Registry)",
  "1F 大門接待櫃台（登記簿）": "1F Main Reception Desk (Logbook)",
  "1F 大廳形象牆": "1F Lobby Logo Wall",
  "1F 演講與會議廳": "1F Conference Hall",
  "1F 管制實驗區觀測窗": "1F Cleanroom Observation Window",
  "2F 值班桌（交班紀錄簿）": "2F Duty Desk (Handover Logbook)",
  "2F 值班桌（第三章交班）": "2F Duty Desk (Ch3 Handover)",
  "2F 值班桌（第三章交班紀錄）": "2F Duty Desk (Ch3 Handover Log)",
  "2F 值班桌（第四章交班）": "2F Duty Desk (Ch4 Handover)",
  "2F 值班電腦": "2F Duty PC",
  "2F 值班電腦（研發成果清單）": "2F Duty PC (R&D Records Inventory)",
  "2F 實驗紀錄電腦（交接檔案對照）": "2F Lab Record PC (Access Diff)",
  "2F 營業秘密宣導布告欄": "2F Trade Secret Notice Board",
  "小安": "Xiao-An",
  "小安（值班研究助理）": "Xiao-An (Duty Research Assistant)",
  "同事 阿文": "Colleague: A-Wen",
  "同事 阿文（1F 實驗區）": "Colleague: A-Wen (1F Lab)",
  "盤點同事 小晴（1F 大廳）": "Colleague: Xiao-Qing (1F Lobby)",
  "同事 阿文（2F 實驗區）": "Colleague: A-Wen (2F Lab)",
  "同事 阿文（2F 辦公區旁）": "Colleague: A-Wen (2F Office)",
  "同事 阿文（辦公區門口）": "Colleague: A-Wen (Office Entrance)",
  "阿文（同事）": "A-Wen (Colleague)",
  "研討會投稿系統（上傳回執）": "Symposium Submission System (Receipt)",
  "研討會投稿系統（模擬）": "Symposium Submission System (Sim)",
  "負責人 阿明組長": "Lead: Team Lead A-Ming",
  "負責人 阿明組長（1F 大廳）": "Team Lead A-Ming (1F Lobby)",
  "負責人 阿明組長（2F 辦公區）": "Team Lead A-Ming (2F Office)",
  "值班桌（交班紀錄簿）": "Duty Desk (Handover Logbook)",
  "值班備忘錄（2F 辦公區）": "Duty Memo (2F Office)",
  "值班電腦": "Duty PC",
  "值班電腦（新郵件提醒！）": "Duty PC (New Email Alert!)",
  "接手同事 小晴": "Successor: Xiao-Qing",
  "接手同事 小晴（2F 實驗區）": "Successor: Xiao-Qing (2F Lab)",
  "訪客 陳先生": "Visitor: Mr. Chen",
  "訪客 陳先生（1F 大門櫃台）": "Visitor: Mr. Chen (1F Reception)",
  "訪客接待處": "Visitor Reception Desk",
  "實驗白板": "Lab Whiteboard",
  "實驗室螢幕": "Lab Monitor",
  "樣品保管箱": "Sample Storage Box",
  "樣品架與標籤": "Sample Rack & Labels",
  "盤點同事 小晴（2F 辦公區）": "Colleague: Xiao-Qing (2F Office)",
  "辦公區電腦": "Office PC"
};
  const CHOICES_MAP = {
  "✍ 現在完成第三章交班": "✍ Complete Chapter 3 Handover Now",
  "✍ 填寫交班紀錄並完成第三章": "✍ Complete Handover Notes & Finish Chapter 3",
  "✍ 填寫第三章交班紀錄並完成本章": "✍ Complete Ch3 Handover Notes & Finish Chapter",
  "✍ 填寫第四章交班紀錄並完成本章": "✍ Complete Ch4 Handover Notes & Finish Chapter",
  "🏆 重新檢視通關畫面與交班紀錄": "🏆 Review Clear Screen & Handover Notes",
  "🏆 填寫第三章交班紀錄並完成本章": "🏆 Complete Ch3 Handover Notes & Finish Chapter",
  "🏆 填寫第四章交班紀錄並完成本章": "🏆 Complete Ch4 Handover Notes & Finish Chapter",
  "🏠 返回首頁選單": "🏠 Return to Title Menu",
  "🏠 返回章節選單": "🏠 Return to Chapter Menu",
  "🏷️ 打開文件標示與版面預覽工作台": "🏷️ Open Confidentiality Label & Layout Preview",
  "🏷️ 進入文件標示與版面預覽工作台": "🏷️ Enter Document Marking Workbench",
  "💻 好，我這就回 2F 值班電腦更新清單": "💻 Understood, returning to 2F PC to update inventory",
  "🔄 再玩一次第一章（挑戰其他結局）": "🔄 Replay Chapter 1 (Try other endings)",
  "🔄 再玩一次第二章": "🔄 Replay Chapter 2",
  "🔄 再玩一次第三章": "🔄 Replay Chapter 3",
  "🔄 再玩一次第五章": "🔄 Replay Chapter 5",
  "🗂️ 查看三張資料卡並完成判斷": "🗂️ Review 3 Data Cards and Classify",
  "🪪 辦理阿文門禁卡收回與註銷登記": "🪪 Process A-Wen's Badge Return & Revocation",
  "引導在「1F 大廳形象牆指定角度」拍照（核准範圍）": "Guide to photo at 1F Lobby Logo Wall (Approved spot)",
  "只說「剛剛好像傳錯連結，但我已經關掉了應該沒事」": "Just say: \"Sent wrong link earlier, but it is closed now, should be fine\"",
  "未簽署或已到期就先不能提供機密資料，須先確認有效 NDA、效期與涵蓋範圍": "Cannot share trade secrets if unsigned or expired. Verify active NDA, duration, and scope first.",
  "先不交班": "Not now",
  "先不操作": "Cancel",
  "先回電腦處理海報": "Return to PC to handle poster first",
  "先忙別的事": "Do other tasks first",
  "先忙其他項目": "Handle other items first",
  "先取消": "Cancel",
  "先放著不管": "Leave it for now",
  "先保持原樣": "Keep as is",
  "先問清楚拍照用途與預計公開範圍": "Inquire photography purpose and intended public scope first",
  "先處理其他交接項目": "Handle other handover items first",
  "先稍候": "Wait for now",
  "先等一下": "Wait a moment",
  "再次確認星海科技 NDA-CS-2026 的重點": "Review key points of Starlight Tech NDA-CS-2026",
  "再給我一分鐘整理現場": "Give me one minute to clear sensitive data from the room",
  "回 2F 值班桌交班": "Return to 2F Duty Desk for handover",
  "回報：剛才訪客在實驗區拍照時拍進了敏感資訊": "Report: Visitor captured sensitive lab data in photo earlier",
  "完整交代四要素：發現時間、涉及檔案範圍、使用的雲端系統與已停權現況（含轉傳待確認）": "Report all 4 incident elements: Time discovered, scope of files, cloud system used, and revocation status (including resharing risk)",
  "我再看一下周圍": "Look around a bit more",
  "改帶陳先生回 1F 大門形象牆指定角度拍攝": "Redirect Mr. Chen to approved photo angle at 1F Logo Wall",
  "查看實驗區相機取景預覽": "Check camera framing preview in 2F lab",
  "將樣品收妥至不透明樣品盒／遮蔽標籤": "Store samples in opaque box / shield labels",
  "現在哪張圖能用？": "Which figure is safe to use right now?",
  "陪同上「2F 實驗區」查看取景畫面並拍攝": "Escort to 2F Lab, inspect camera framing preview and shoot",
  "等一下再看": "Check later",
  "等一下再登記": "Register later",
  "開會比較急，先寄檔案過去，NDA 下週再補簽就好": "Meeting is urgent; send files first and sign NDA next week",
  "詢問訪客拍照的注意事項": "Inquire about visitor photography precautions",
  "確認阿文已留存紀錄後，擦拭／遮蔽白板上的機密參數": "Verify A-Wen saved data, then erase/shield secret parameters on whiteboard",
  "確認保密約定，並提醒阿文離開後的保密義務與資料攜出限制": "Confirm NDA and remind A-Wen of post-employment trade secret obligations & zero data removal",
  "確認星海科技是否已簽署有效 NDA（保密協議）與提供範圍": "Confirm if Starlight Tech has signed an active Non-Disclosure Agreement (NDA) and scope",
  "確認這兩層樓還有哪些交接步驟": "Review remaining handover steps across both floors",
  "請阿文先交出實驗室實體門禁卡（準備拿到 1F 櫃台收回登記）": "Ask A-Wen to hand over physical access badge (for 1F reception return)",
  "請陳先生在一樓櫃台稍等（先看登記簿或上樓巡視）": "Ask Mr. Chen to wait at 1F reception (check logbook / inspect upstairs)",
  "整理好之後怎麼確認版本？": "How do we verify versions after revisions?",
  "鎖定電腦螢幕（Win+L / 切換待機畫面）": "Lock computer screen (Win+L / standby)",
  "離開電腦": "Step away from computer"
};
  const DIALOGUES_MAP = {
  "照片拍得很清楚，連後面螢幕跟白板都很有實驗室氣氛！謝謝你的招待，我準備回去整理報告了。": "The photo came out so sharp—the background screens and whiteboards add great lab atmosphere! Thank you, I am heading back to compile my report.",
  "剛剛那張照片構圖很棒，謝謝你這麼細心引導！不打擾你們下班，我先離開囉。": "The photo framing earlier was fantastic, thank you for guiding me so thoughtfully! I will not hold you up from clocking out—heading out now.",
  "照片會放進公開參訪報告裡。請問我們要在一樓大廳形象牆拍，還是可以上二樓實驗區拍一張呢？": "The photo will be included in a public visit report. Should we shoot at the 1F Lobby Logo Wall, or may we take one upstairs in the 2F lab?",
  "你好！我是預約三點半參訪的陳先生，剛在一樓大門櫃台報到，想拍一張實驗室的照片當參訪紀錄，請問可以上二樓實驗區拍嗎？": "Hello! I am Mr. Chen, scheduled for a 3:30 PM visit. I just checked in at 1F reception and would like a photo for our visit record. May we go to the 2F lab to take one?",
  "【實驗室營業秘密三提醒】\\n① 對外給廠商資料：先確認有效 NDA、最小範圍與連結效期。\\n② 訪客接待與拍照：一樓登記、全程陪同、拍前巡視白板螢幕樣品。\\n③ 論文與海報公開：確認合作授權與專利安排，核准綁定版本。": "【Three Lab Trade Secret Reminders】\\n① Sharing data with vendors: verify active NDA, minimal scope, and link expiry.\\n② Visitor escort & photos: 1F sign-in, continuous escort, inspect whiteboards & screens before shooting.\\n③ Papers & posters: verify partner consent and patent status; bind approval to exact version.",
  "下午 3:40，下班前還有兩件事要處理：\\n① 2F 辦公區電腦有合作方急著要會議資料的來信。\\n② 1F 大門櫃台有預約來賓陳先生等候拍照（可由左側樓梯／電梯下樓）。": "3:40 PM. Two tasks before clocking out:\\n① An urgent email from partner requesting meeting slides on 2F duty PC.\\n② Scheduled visitor Mr. Chen waiting at 1F reception for photography (take stairs/elevator on left).",
  "蘇小姐回覆「收到了，圖表很清楚，感謝！」\\n我也把實際提供的版本、收件對象和權限順手記下來，交班時才好追溯。": "Ms. Su replied: \"Received! The charts are very clear, thank you!\"\\nI also recorded the version sent, recipient, and permissions so they can be traced during handover.",
  "連結先鎖住了，但還不能就此算了——不知道對方或協力廠商剛剛有沒有先下載。\\n馬上找辦公區的負責人阿明組長完成異常通報！": "The link is locked down, but we cannot stop here—we do not know if the partner or subcontractors downloaded it already.\\nI must report the incident to Team Lead A-Ming in the office immediately!",
  "問得好！跟外部廠商交流研究資料前，第一步一定要先確認「對方到底有沒有簽署有效的 NDA」。\\n先考考你：如果今天來要測試資料的廠商「還沒簽 NDA」或「NDA 已經到期」，我們該怎麼做？": "Great question! Before sharing research data with external partners, the first step is always verifying whether they have signed an active Non-Disclosure Agreement (NDA).\\nLet me quiz you: If a partner requesting test data hasn\\",
  "完全正確！沒簽有效 NDA 就把機密交出去，事後很難主張合理保密措施。\\n我幫你查過了：星海科技已簽署「NDA-CS-2026」（效期 2026/01/01～2027/12/31），目前在效期內。": "Spot on! Disclosing confidential data without an active NDA makes it very difficult to assert reasonable secrecy safeguards later.\\nI checked for you: Starlight Tech has signed \"NDA-CS-2026\" (valid 2026/01/01–2027/12/31), currently active.",
  "【今日預約登記】\\n來訪人員：陳先生（外校參訪來賓）｜時間：15:30\\n核准活動範圍：1F 大門大廳形象牆拍照留念；若須上 2F 實驗區參觀拍照，須由值班人員全程陪同，且拍攝前須確認畫面無未遮蔽之研究資訊。": "[Today\\",
  "小安，太好了你還沒走！我正在趕明天研討會要用的海報。\\n「我把上次合作會議的圖放進海報了。今晚要交，你可以幫我看一下嗎？」": "Xiao-An, so glad you are still here! I am rushing tomorrow\\",
  "糟了！！不小心選成還沒核准的版本上傳給主辦方了！\\n現在馬上回電腦聯絡研討會主辦方提出撤換請求，並且立刻找辦公區的阿明組長回報！": "Oh no!! I mistakenly picked an unapproved version to upload to the organizer!\\nI must immediately return to the PC to submit a retraction request, and report to Team Lead A-Ming in the office!",
  "我逐張跟你說明喔：\\n① 圖一「設備配置示意」：已經確認可以公開，直接保留沒問題。\\n② 圖二「合作方量測圖」：那上次是合作會議用的，還沒確認合作約定是否涵蓋公開海報，不能直接放上去！你可以找實驗區的阿文拿可送審的替代圖。": "Let me explain each figure:\\n① Figure 1 \"Equipment Layout\": Confirmed safe for public release; keeping it as-is is fine.\\n② Figure 2 \"Partner Measurement Chart\": Used in a previous partner meeting; we have not confirmed if the agreement allows public symposium use, so it cannot be published directly! Ask A-Wen in the lab for an alternative chart.",
  "研討會海報尚未完成核准送審與提交喔！\\n請先到辦公區電腦檢視海報草稿，並向實驗區阿文與阿明組長確認後完成送審與提交。": "The symposium poster has not been approved and submitted yet!\\nPlease inspect the draft at the PC, verify with A-Wen and Lead A-Ming, and submit the approved version.",
  "下午五點了，今天就是我在實驗室的最後一天。\\n「上次那批資料已經有清冊，我們從那裡找。我把交接清單放在電腦裡了。對了，下個月改論文還要用之前開會那兩張圖。我原本的資料夾權限可以先留著嗎？」": "5:00 PM. Today is my last day in the lab.\\n\"The previous records are already inventoried; we can check there. I left the handover checklist on the PC. By the way, I need 2 figures to revise my thesis next month. Can I keep my folder access?\"",
  "小晴在 1F 大廳拿著研發成果清單筆記，對小安說：\\n「小安！明天我要進行星空計畫的研發成果清單盤點。阿文在 2F 量測實驗區手上有三組資料卡，但他不確定哪些要列入清單受控、哪些只要留作一般紀錄。\\n你能不能先走樓梯上 2F 實驗室找阿文，幫忙確認一下這三組資料卡？我等等也上去 2F 辦公室準備資料，確認好後再到 2F 電腦彙整清單喔！」": "Xiao-Qing holds an inventory notepad in the 1F Lobby and says to Xiao-An:\\n\"Xiao-An! Tomorrow I need to conduct the R&D Records Inventory for Project StarSky. A-Wen is in the 2F Lab with three data sets, but he is unsure which should be inventoried for controlled protection. Could you take the stairs to the 2F Lab to help him review the three data cards? I will head up to the 2F Office as well—once checked, let's compile the inventory at the 2F PC!\"",
  "電腦畫面上顯示星空計畫研發成果清單草稿。\\n※ 請先在 2F 量測實驗區找同事阿文查看三組資料卡，完成辨識後再來確認清單！": "The screen displays the Project StarSky R&D Records Inventory draft.\\n* Please visit colleague A-Wen in 2F Lab first to examine the three data cards before reviewing the inventory!",
  "小安，文件標示是營業秘密合理保密措施非常關鍵的一環！\\n\\n": "Xiao-An, document labeling is a crucial cornerstone of Reasonable Confidentiality Measures for trade secrets!\\n\\n",
  "總結來說：\\n「標示讓接手人知道怎麼處理，分享前仍要確認對象及權限。」": "In summary:\\n\"Labels inform handlers how to treat materials; always verify recipient and permissions before sharing.\"",
  "中研院RCCI實驗室一樓大廳形象牆。這裡是訪客核准拍照區，構圖專業且完全不會拍到管制實驗區內部資訊。": "Academia Sinica RCCI Lab 1F Lobby Logo Wall. This is the designated visitor photo spot—framed safely so no restricted lab information is visible.",
  "透過大面玻璃觀測窗可看到一樓管制實驗區的機台運作。門禁告示寫著：「未經授權人員禁止入內，訪客參觀須事前申請並全程陪同。」": "Equipment operates behind the glass window. Notice: \"Authorized personnel only. Visitors require prior registration and continuous escort.\"",
  "【實驗室營業秘密三提醒】\\n① 對外給廠商資料：先確認有效 NDA、最小範圍與連結效期。\\n② 訪客接待與拍照：一樓登記、全程陪同、拍前巡視白板螢幕樣品。\\n③ 論文與海報公開：確認合作授權與專利安排，核准綁定版本。": "【Three Lab Trade Secret Reminders】\\n① Sharing data with vendors: verify active NDA, minimal scope, and link expiry.\\n② Visitor escort & photos: 1F sign-in, continuous escort, inspect whiteboards & screens before shooting.\\n③ Papers & posters: verify partner consent and patent status; bind approval to exact version.",
  "下午 3:40，下班前還有兩件事要處理：\\n① 辦公區值班電腦有合作方急著要會議資料的來信。\\n② 1F 大門接待處有預約來賓陳先生等候拍照（可由左側樓梯下樓）。": "3:40 PM. Two tasks before clocking out:\\n① An urgent email from partner requesting meeting slides on Duty PC.\\n② Scheduled visitor Mr. Chen waiting at 1F reception for photography (take stairs on left).",
  "順序可以自己安排。跟外部廠商交流資料前，記得先確認對方是否已簽署有效 NDA！有不確定的地方，就查電腦合約清單，或問實驗區的阿文與組長辦公室的阿明組長吧！": "I can tackle them in any order. Before sharing data with external partners, ensure a valid Non-Disclosure Agreement (NDA) is signed! If unsure, check NDA records on PC or consult A-Wen in the lab and Team Lead A-Ming!",
  "下午 3:40，下班前還有兩件事要處理：\\n① 2F 辦公區電腦有合作方急著要會議資料的來信。\\n② 1F 大門櫃台有預約來賓陳先生等候拍照（可由左側樓梯／電梯下樓）。": "3:40 PM. Two tasks before clocking out:\\n① An urgent email from partner requesting meeting slides on 2F duty PC.\\n② Scheduled visitor Mr. Chen waiting at 1F reception for photography (take stairs/elevator on left).",
  "順序可以自己安排。跟外部廠商交流資料前，記得先確認對方是否已簽署有效 NDA！有不確定的地方，就查電腦合約清單，或問 2F 實驗區的阿文與組長辦公室的阿明組長吧！": "I can tackle them in any order. Before sharing data with external partners, ensure a valid Non-Disclosure Agreement (NDA) is signed! If unsure, check NDA records on PC or consult A-Wen in 2F lab and Team Lead A-Ming!",
  "已回覆蘇小姐：「收到！正在確認會議用核准版本與保密約定範圍，核對完馬上提供給您。」": "Replied to Ms. Su: \"Received! Verifying the approved meeting version and Non-Disclosure Agreement scope. Will provide right after checking.\"",
  "先讓對方知道進度，就不用倉促寄出。接下來去問問實驗區的阿文（確認版本）和阿明組長（確認保密約定）吧！": "Keeping the partner informed avoids rushed mistakes. Next, I will check with A-Wen in 2F lab (for versions) and Team Lead A-Ming (for NDA scope)!",
  "蘇小姐回覆「收到了，圖表很清楚，感謝！」\\n我也把實際提供的版本、收件對象和權限順手記下來，交班時才好追溯。": "Ms. Su replied: \"Received, charts look very clear, thank you!\"\\nI logged the version, recipient, and permissions in my notes for accountability.",
  "已寄出會議用兩張圖（限定蘇小姐唯讀）。不過寄出前還沒向阿明組長確認 NDA 涵蓋範圍，交班時最好註記一下。": "Sent the 2 meeting charts (restricted read-only to Ms. Su). However, NDA scope was not verified with Team Lead A-Ming beforehand; will note during handover.",
  "🔒 已立即停用原公開連結！同時回覆蘇小姐說明誤傳了非會議用檔案，請勿轉傳給協力廠商並協助刪除快取。": "🔒 Immediately revoked the public link! Replied to Ms. Su explaining non-meeting files were mistakenly sent, requesting no forwarding to subcontractors and cache deletion.",
  "連結先鎖住了，但還不能就此算了——不知道對方或協力廠商剛剛有沒有先下載。\\n馬上找辦公區的負責人阿明組長完成異常通報！": "The link is revoked, but the incident is not over—we do not know if subcontractors downloaded copies.\\nI must report the incident to Team Lead A-Ming immediately!",
  "已補寄核准的「StarSky_會議用摘要圖_v2（僅圖A、圖B）」，限定星海科技蘇小姐唯讀且 7 天自動到期。": "Resent the approved \"StarSky_MeetingSummary_v2 (Fig A & B only)\", restricted read-only to Ms. Su (Starlight Tech) with 7-day automatic expiration.",
  "小安，看你神色很緊張，發生什麼事了？": "Xiao-An, you look anxious. What happened?",
  "組長，我剛才不小心把星空計畫的測試資料設成公開連結寄給合作方，對方還問能不能轉給協力廠商……": "Team Lead, I accidentally shared StarSky test data via a public link to our partner, and they asked if they could forward it to their subcontractors...",
  "你第一時間來講是對的！先別慌——請立刻回電腦把那個公開連結停用／改為限制存取，止血後再馬上回來跟我做正式通報！": "You did the right thing reporting immediately! Do not panic—go back to your PC right now, revoke the public link to stop the bleeding, and return for an incident report!",
  "小安，你剛才說已經把公開連結停用了。很好，我們現在立刻做異常通報紀錄。通報時要把關鍵資訊講清楚，你打算怎麼說明？": "Xiao-An, you revoked the public link. Good. Now let us file the incident report. We must articulate all critical facts clearly. How do you describe it?",
  "非常好，資訊很完整，我馬上同步知會資訊／資安窗口並聯絡星海科技主管確認是否留存或轉傳。": "Excellent, very thorough information. I will immediately notify IT/Security and contact Starlight Tech management to verify whether files were downloaded or forwarded.",
  "另外提醒你，NDA-CS-2026 只涵蓋「會議用兩張摘要圖」給星海科技專案窗口開會使用。若待會要補寄，記得先跟阿文確認核准版再設定限定對象寄出。": "Also remember: NDA-CS-2026 only covers \"2 approved summary charts\" for Starlight Tech project contacts. Before resending, verify the version with A-Wen and restrict recipients.",
  "等等，只說「關掉了」不夠喔！如果不記錄「發現時間、涉及哪些資料、透過哪個系統分享、目前處置與轉傳風險」，後續資安窗口和合作方都沒辦法精準追蹤。再重新跟我完整回報一次吧！": "Wait, just saying \"it is closed\" is not enough! Without recording time discovered, files involved, sharing system used, remediation, and forwarding risks, security cannot track it. Report again thoroughly!",
  "問得好！跟外部廠商交流研究資料前，第一步一定要先確認「對方到底有沒有簽署有效的 NDA」。\\n先考考你：如果今天來要測試資料的廠商「還沒簽 NDA」或「NDA 已經到期」，我們該怎麼做？": "Great question! Before exchanging data with external vendors, step one is always verifying whether an active Non-Disclosure Agreement (NDA) exists.\\nQuick quiz: If a vendor has no NDA or an expired NDA, what should we do?",
  "完全正確！沒簽有效 NDA 就把機密交出去，事後很難主張合理保密措施。\\n我幫你查過了：星海科技已簽署「NDA-CS-2026」（效期 2026/01/01～2027/12/31），目前在效期內。": "Exactly right! Sharing confidential data without a valid NDA severely undermines reasonable trade secret protection.\\nI checked: Starlight Tech signed NDA-CS-2026 (active through 2027/12/31).",
  "不過這份 NDA 只涵蓋「階段進度會議用的兩張核准摘要圖」，接收對象限星海科技專案團隊（蘇小姐），不包含原始量測數據和製程筆記，也未授權轉傳給協力廠商。": "However, this NDA only covers the 2 approved meeting charts for Starlight Tech project team (Ms. Su). It excludes raw measurement data and fabrication notes, and prohibits subcontract forwarding.",
  "分享連結時記得設成「指定收件人唯讀」並加上到期日（例如 7 天）。你也可以在電腦的「NDA 合約清單」複習各廠商狀態；若要確認核准版圖檔在哪，記得去實驗區問阿文！": "When sharing links, always restrict access to specified recipients as read-only with expiration (e.g. 7 days). You can review NDA statuses on the PC, or ask A-Wen in the lab for approved files!",
  "千萬不行喔！資料一旦先送出去，在沒有事前簽署 NDA 的情況下就容易喪失營業秘密的保護基礎。就算開會再趕，確認不到有效 NDA 前也只能先回覆確認中、絕不能先寄機密資料！再想一次看看？": "Absolutely not! Once trade secrets are disclosed without a pre-existing NDA, legal trade secret protection is jeopardized. Even in a rush, reply that details are being verified—never send unshielded secrets!",
  "陳先生今天預約參訪，接待處有登記簿。最單純的方式是在訪客入口指定角度拍形象牆；若真的要陪同進實驗區拍照，千萬要先巡過白板、螢幕跟樣品架標籤！": "Mr. Chen has an appointment today; sign-in log is at reception. The safest way is photographing the 1F Logo Wall. If taking him to 2F lab, thoroughly inspect whiteboards, monitors, and sample labels first!",
  "嗨小安！你是在找星海科技四點開會要用的圖嗎？": "Hi Xiao-An! Are you looking for the charts for Starlight Tech's 4 PM meeting?",
  "幸好你有先來問！原本的 StarSky_TestData 資料夾裡還塞著原始量測數據（RAW）和我寫到一半的製程筆記草稿，千萬別整個資料夾直接丟出去！": "Good thing you asked first! The raw StarSky_TestData folder contains RAW logs and unapproved process notes. Never share the whole folder directly!",
  "我剛剛已經把核准可以對外給的兩張圖獨立整理成「StarSky_會議用摘要圖_v2」放在系統裡了。你回電腦重看就會看到這個選項！": "I isolated the 2 approved charts into \"StarSky_MeetingSummary_v2\" in the system. Check the PC again and you will see it!",
  "對了，如果等一下有訪客要進實驗區拍照，白板上我剛寫的配方參數跟那台量測螢幕都還沒關，記得先處理一下喔！": "By the way, if visitors come upstairs to photograph the lab, my formula parameters on the whiteboard and the measurement monitor are still active—take care of them!",
  "白板已經擦拭乾淨並確認重要參數已另存於電子實驗紀錄，就算拍照也不會外洩機密。": "Whiteboard cleaned and key parameters saved to electronic lab records. Photography will not expose trade secrets.",
  "白板上寫著星空計畫最新的「配方比例 14.2%、退火溫度 380°C/4h」和結構草圖。若訪客在實驗區拍照，這些資訊會清清楚楚入鏡。": "Whiteboard displays latest StarSky recipe \"Ratio 14.2%, Anneal 380°C/4h\" and schematics. Taking photos here would clearly expose them.",
  "跟阿文點頭確認數據都進紀錄簿了，我把白板擦乾淨。這樣就不怕被拍到了！": "Confirmed with A-Wen that data is logged, then wiped the whiteboard clean. Safe from prying lenses!",
  "螢幕已鎖定為保護畫面，看不到任何量測曲線與檔名。": "Monitor locked to screensaver. No measurement curves or file paths visible.",
  "量測電腦的螢幕正開著未去識別化的「RAW_DATA.csv」原始量測曲線，視窗標題還顯示著計畫代號。": "Measurement monitor actively displays unredacted \"RAW_DATA.csv\" curve with project codenames in title bar.",
  "先把量測螢幕鎖定畫面，既不會中斷背景紀錄，也不怕鏡頭掃到原始數據。": "Locked the monitor screen. Background recording continues uninterrupted while camera lenses see nothing.",
  "樣品已經整齊收進不透明的防塵保管箱中，外部看不到任何配方代碼標籤。": "Samples neatly stored in opaque storage box. No formula codes visible from outside.",
  "實驗桌上排著三支未收妥的樣品管，白色標籤朝外清楚寫著批次與配方代號（CS-B4 / CS-B5 / CS-B6）。": "Three sample vials on bench with white labels facing out showing batch & formula codes (CS-B4 / CS-B5 / CS-B6).",
  "把樣品收進專屬的不透明保管盒蓋好。標籤細節最容易被忽略，幸好有檢查到！": "Stored samples in designated opaque box with lid closed. Label details are easily overlooked—good catch!",
  "【今日預約登記】\\n來訪人員：陳先生（外校參訪來賓）｜時間：15:30\\n核准活動範圍：1F 大門大廳形象牆拍照留念；若須上 2F 實驗區參觀拍照，須由值班人員全程陪同，且拍攝前須確認畫面無未遮蔽之研究資訊。": "【Today's Visitor Log】\\nVisitor: Mr. Chen (Academic Guest) | Time: 15:30\\nApproved Scope: 1F Lobby Logo Wall souvenir photo. If visiting 2F lab, must be accompanied continuously by duty staff with prior verification that no unshielded research data is in view.",
  "喔，這張照片是要放進我們單位這次的參訪紀錄報告，報告之後會貼在系上網頁公開分享喔！": "Oh, this photo will be featured in our department visit report, which will be published publicly on our university website!",
  "（會公開放在網頁上！那更不能讓 2F 實驗區裡還沒收好的研究資料入鏡。）": "(Published publicly on website! That means we definitely cannot let sensitive 2F lab data into the frame.)",
  "好的，請您跟我一起搭電梯上 2F、刷卡進入實驗區，並請先讓我確認一下相機的取景預覽畫面。": "Certainly! Please take the elevator to 2F with me. Let me inspect the camera framing preview before you shoot.",
  "陳先生不好意思，先暫停一下下！背景拍到正在進行中的研究資料，我先去把 2F 實驗區的白板、螢幕跟樣品標籤收妥，整理好馬上幫您拍！": "Apologies Mr. Chen, please pause for a moment! Ongoing research data is in the frame. Let me clear the whiteboard, monitor, and sample labels first!",
  "沒問題，保密最重要！我在 2F 實驗區門口這裡等您，整理好再叫我。": "No problem, confidentiality comes first! I will wait at the 2F lab door until you are ready.",
  "陳先生，2F 實驗區裡面目前還有未收妥的研究資料，我們改回 1F 大廳的形象牆指定角度拍，光線跟招牌也更好看喔！": "Mr. Chen, sensitive lab data is currently active on 2F. Let us take the photo at the 1F Lobby Logo Wall instead—better lighting and great branding!",
  "喀嚓！這張 1F 大廳形象牆拍起來很專業耶，完全符合我們的參訪紀錄需求，謝謝你！": "Click! The 1F Lobby Logo Wall photo looks very professional and fits our visit report perfectly, thank you!",
  "喀嚓！畫面既看得出實驗室環境，又完全保護了研究機密。謝謝你細心陪同，我先搭電梯回 1F 大廳準備離開囉！": "Click! It showcases the lab atmosphere while completely protecting trade secrets. Thank you for your careful escort!",
  "第一章已經完成交班！要重新檢視交班紀錄，還是再玩一次嘗試不同路線呢？": "Chapter 1 Handover Complete! Would you like to review the Handover Notes or replay to try different routes?",
  "小安，太好了你還沒走！我正在趕明天研討會要用的海報。\\n「我把上次合作會議的圖放進海報了。今晚要交，你可以幫我看一下嗎？」": "Xiao-An, so glad you are still here! I am rushing tomorrow's symposium poster.\\n\"I included charts from our last partner meeting. Deadline is tonight—could you review it with me?\"",
  "海報草稿我已經存到辦公區電腦裡了。我先回實驗區整理手邊的圖檔，如果有圖片需要確認來源或換圖，再過來實驗區找我！": "I saved the draft on the office PC. I will be in the lab organizing figures. If any figure needs source verification or replacement, come find me!",
  "晚上六點了，公開研討會海報可不能馬虎。先去辦公區電腦看看草稿有三張什麼圖，也可以找實驗區的阿文和辦公區的阿明組長確認！": "It's 6:00 PM. A public symposium poster must be handled rigorously. Check the 3 draft figures at the office PC, and consult A-Wen and Team Lead A-Ming!",
  "今晚的白板已經擦乾淨了。目前最重要的是確認辦公區電腦裡那份研討會海報草稿，別把不該公開的圖片交出去！": "Whiteboard is already clean tonight. Focus on checking the symposium poster draft on the office PC so no unauthorized figures leak out!",
  "實驗室的量測電腦處於待機鎖定狀態。海報草稿檔案放在辦公區的電腦上，阿文人也在實驗區旁邊。": "Lab measurement PC is locked on standby. Poster draft is on office PC, and A-Wen is nearby in the lab.",
  "樣品都已經收進不透明保管箱了。今晚的任務重點是審閱研討會海報草稿（辦公區電腦）、找阿文與阿明組長核對。": "Samples are safely stored in opaque boxes. Tonight's objective: review poster draft at office PC, consult A-Wen and Team Lead A-Ming.",
  "晚上六點已過訪客時段，今日沒有外部訪客。回辦公區與實驗區處理研討會海報投稿吧！": "Past 6:00 PM; visitor hours are over. Head to office and lab areas to finalize symposium poster submission!",
  "現在走過去找辦公區的阿明組長，請他正式確認核准這個版本吧！": "Head over to Team Lead A-Ming in the office to request formal approval for this version!",
  "在還沒確認清楚公開授權跟專利安排之前，先暫緩投稿比較穩妥。回值班桌把原因與下一步寫進交班紀錄吧！": "Before confirming public authorization and patent filing, deferring submission is safest. Return to duty desk to log handover notes!",
  "核對過檔名與核准狀態再按送出，心裡踏實多了！去值班桌填寫交班紀錄就能安心下班囉。": "Verified filename and approval status before submitting—much more reassuring! Head to duty desk to complete handover notes.",
  "糟了！！不小心選成還沒核准的版本上傳給主辦方了！\\n現在馬上回電腦聯絡研討會主辦方提出撤換請求，並且立刻找辦公區的阿明組長回報！": "Oh no!! Accidentally uploaded an unapproved version to the organizer!\\nReturn to the PC immediately to request an emergency retraction, and report to Team Lead A-Ming!",
  "小安，你看到海報草稿裡的圖二「合作方量測圖」了嗎？老實說，那張圖原本是上次跟星海科技開合作進度會議時用的比較圖。": "Xiao-An, did you see Figure 2 \"Partner Measurement Chart\"? Frankly, it was originally used for an internal collaboration review with Starlight Tech.",
  "我剛剛越想越不對勁——合作會議能看，不代表能直接放到對外公開的研討會海報上！": "The more I think about it, the more concerned I get—permission for a closed meeting does not grant rights for a public poster!",
  "所以我趕快另外畫了一張不含合作方數據的「自研校準趨勢示意圖（替代圖）」，已經同步放到辦公區電腦的圖庫裡了！你現在回電腦就能替換圖二。": "So I quickly drew a replacement \"Proprietary Calibration Trend Schematic\" without partner data. It is ready on the PC to swap into Figure 2!",
  "不過這張替代圖還是要連同整份海報一起給阿明組長確認喔！另外圖三「測試條件與結果摘要」好像牽涉到專利申請，建議你順便問一下辦公區的阿明組長！": "Remember to submit this replacement chart to Team Lead A-Ming with the poster! Also, Figure 3 involves patent filings—ask A-Ming about it!",
  "我逐張跟你說明喔：\\n① 圖一「設備配置示意」：已經確認可以公開，直接保留沒問題。\\n② 圖二「合作方量測圖」：那上次是合作會議用的，還沒確認合作約定是否涵蓋公開海報，不能直接放上去！你可以找實驗區的阿文拿可送審的替代圖。": "Let me walk you through each figure:\\n① Fig 1 \"Equipment Layout\": Approved for public release; safe to keep.\\n② Fig 2 \"Partner Measurement Chart\": Used in collaboration meeting; cannot be published without partner consent! Get replacement from A-Wen.",
  "③ 圖三「測試條件與結果摘要」：涉及尚待確認的專利申請安排，如果太早公開可能影響專利新穎性。今晚公開時點還沒辦法確定，請先把它從這次公開版本移除。": "③ Fig 3 \"Test Conditions & Results Summary\": Involves patent application arrangements. Premature disclosure destroys novelty! Remove it from this public release.",
  "你在辦公區電腦把圖二替換、圖三移除後，點「送交阿明組長確認」，再過來找我核准。": "After replacing Fig 2 and removing Fig 3 on the PC, click \"Submit for Team Lead Approval\", then come to me for approval.",
  "特別注意：我的核准只綁定當時送審的那個版本。核准後如果又改動海報，系統會產生「待重新確認」的新版本，必須重新送審。最後上傳檔案時，也要仔細核對檔名與核准狀態，別誤傳成原始草稿！": "Important: My approval binds strictly to the exact submitted version. Any subsequent edit generates a new unapproved draft that requires fresh review. Verify filenames carefully!",
  "第二章已經完成交班！要重新檢視交班紀錄，還是再試一次其他路線呢？": "Chapter 2 Handover Complete! Would you like to review the Handover Notes or replay to try different routes?",
  "研討會海報尚未完成核准送審與提交喔！\\n請先到辦公區電腦檢視海報草稿，並向實驗區阿文與阿明組長確認後完成送審與提交。": "No decision made on the poster yet!\\nCheck the draft at the PC, consult A-Wen and Team Lead A-Ming, and submit the approved version.",
  "下午五點了，今天就是我在實驗室的最後一天。\\n「上次那批資料已經有清冊，我們從那裡找。我把交接清單放在電腦裡了。對了，下個月改論文還要用之前開會那兩張圖。我原本的資料夾權限可以先留著嗎？」": "5:00 PM. Today is my last day in the lab.\\n\"The previous records are already inventoried; we can check there. I left the handover checklist on the PC. By the way, I need 2 figures to revise my thesis next month. Can I keep my folder access?\"",
  "我先回 2F 實驗區整理個人工作區。接手我研究的小晴也在 2F 實驗區，阿明組長跟門禁回收櫃台都在 1F 大廳喔！": "I will tidy my desk in 2F lab. Xiao-Qing (taking over my project) is also in 2F lab. Team Lead A-Ming and the badge desk are in 1F lobby!",
  "我先回實驗區整理個人工作區。接手我研究的小晴也在實驗區，阿明組長跟門禁回收櫃台都在 1F 大廳喔！": "I will tidy my desk in the lab area. Xiao-Qing (taking over my project) is also in the lab. Team Lead A-Ming and the badge desk are in 1F lobby!",
  "離職交接可不能漏掉任何一步！先看看值班電腦的交接清單與存取預覽，或是先問實驗區的阿文與小晴、下樓找 1F 阿明組長與大門櫃台都可以！": "Offboarding requires rigorous execution! Review the handover checklist and access preview on Duty PC, or consult A-Wen, Xiao-Qing, and Team Lead A-Ming!",
  "離職交接可不能漏掉任何一步！先看看 2F 值班電腦的交接清單與存取預覽，或是先問 2F 的阿文與小晴、下樓找 1F 阿明組長與大門櫃台都可以！": "Offboarding requires rigorous execution! Review the handover checklist and access preview on 2F PC, or consult A-Wen, Xiao-Qing, and Team Lead A-Ming!",
  "白板已經整理乾淨。今天重點是把阿文個人區裡的原始量測紀錄移交給小晴，並完成 1F 門禁收回與權限終止！": "Whiteboard is clean. Today's focus: transfer A-Wen's raw measurement records to Xiao-Qing, return 1F access badge, and terminate account permissions!",
  "阿文已經把實體樣品清點收進樣品盒交給小晴了。接下來要確認電子原始紀錄的移交、存取權限與 1F 門禁卡回收！": "A-Wen inventoried physical samples and handed them to Xiao-Qing. Next: electronic record transfer, access permissions, and 1F badge return!",
  "沒關係，千萬別把我的整包原權限重開！你下樓找 1F 的阿明組長，請他由管理員協助單獨移交這一份指定紀錄給小晴就好！": "No problem, but never reopen my entire project access! Go to 1F and ask Team Lead A-Ming to perform an admin transfer for this specific record to Xiao-Qing!",
  "記得在 2F 值班電腦確認小晴的存取權限，再請旁邊的小晴實際打開確認能不能讀取喔！": "Verify Xiao-Qing's project permissions on 2F PC, then have her test opening the files to verify readability!",
  "阿文，離職前跟你再次確認一下：我們簽署的保密約定在離開實驗室後依然有效，未經核准的研究資料、原始數據跟製程筆記都不能自行備份攜出；下個月改論文也只限在核准的兩張圖與期限內使用喔！": "A-Wen, verifying before you leave: the signed Non-Disclosure Agreement remains in effect post-employment. Unapproved data and notes cannot be removed; thesis revisions are strictly limited to the 2 approved charts and time limit!",
  "瞭解，我完全同意也會確實遵守！個人電腦跟隨身碟我都已經清查過、沒有留存實驗室機密檔案，交接清單可以放心幫我打勾。": "Understood, I agree and will comply! My personal laptop and flash drives are cleared of confidential lab files. Check me off on the list.",
  "給妳，這是我的門禁卡！麻煩拿到 1F 大門接待櫃台幫我辦理收回登記喔。": "Here is my physical access badge! Please take it to 1F reception to log its return and cancellation.",
  "剛剛聽阿文說他的原權限已經先被終止了，他自己也登不進去拿……快下樓找 1F 的阿明組長，請求由管理員協助單獨移交那一份紀錄吧！（不用恢復阿文整包權限喔！）": "A-Wen said his permissions were already terminated so he cannot log in... Go to 1F and ask Team Lead A-Ming for an admin transfer of that record! (Do not restore A-Wen's full access!)",
  "哎呀，系統跳出「權限不足，無法開啟」！檔案雖然移交過來了，但我的帳號還沒開通這個專案資料夾的存取權限。麻煩到 2F 值班電腦幫我開通並用「小晴視角」預覽確認，再來找我測開！": "Oops, system shows \"Permission Denied\"! The file is transferred, but my account lacks project access. Please grant access at 2F PC, preview via \"Xiao-Qing view\", then test with me!",
  "成功打開了！量測欄位、日期和原始波形全都完整無缺！我已經在交接清單勾選「接收人已確認（小晴）」了，你可以安心進行後續的權限終止和 1F 門禁收回囉！": "Successfully opened! Measurement fields, dates, and raw waveforms are intact! I checked \"Recipient Verified (Xiao-Qing)\". Proceed with permission termination and 1F badge return!",
  "了解！離職停權太早確實常讓交接中斷，但千萬不能因此把阿文原本整包專案權限又重新打開。": "Understood! Revoking access too early often disrupts handover, but we must never restore A-Wen's entire project permissions as a workaround.",
  "接下來你回 2F 確認小晴的存取權限，並請小晴親自打開確認無誤就行。這段中斷與管理員補救過程也會完整記在交班紀錄裡！": "Return to 2F, verify Xiao-Qing's access, and have her test open the file. This interruption and admin remedy will be documented in Handover Notes!",
  "阿文下個月改論文的部分我確認過了：原本整個專案資料夾權限**不能保留**，離職當日必須終止，避免他繼續看到與論文無關的機密資料！": "Regarding A-Wen's thesis revisions: his original project folder permissions **cannot be kept**; they must terminate on his last day to prevent access to unrelated secrets!",
  "我核准另行開立獨立的限期授權：\\n• 內容：僅限會議用兩張摘要圖（StarSky_會議用摘要圖_v2：圖A、圖B）\\n• 用途：後續論文修訂\\n• 期限：離開後 30 天自動到期": "I approve creating an isolated, expiring grant:\\n• Scope: 2 meeting summary charts only (StarSky_MeetingSummary_v2: Fig A & B)\\n• Purpose: Thesis revision\\n• Expiration: 30 days after offboarding",
  "你現在回 2F 值班電腦就能設定這份限期授權了。另外別忘了兩件事：① 到旁邊的 1F 大門接待櫃台把阿文的實體門禁卡收回登記；② 跟阿文親自提醒離職後仍須遵守的保密約定！": "Configure this expiring grant at 2F PC now. Remember two more items: ① Log A-Wen's badge return at 1F reception; ② Personally remind A-Wen of post-employment Non-Disclosure obligations!",
  "小安，我正在 1F 櫃台旁處理阿文的離職核簽。離職當日一定要把研究交接、電子權限終止跟 1F 門禁卡回收分頭確認清楚喔！": "Xiao-An, I am finalizing A-Wen's offboarding sign-off at 1F reception. Research handover, digital permission termination, and 1F badge return must all be verified!",
  "✅ 阿文的實體門禁卡已收回並完成註銷登記。\\n（提醒：實體門禁卡與電子檔案權限分開管制，電子權限請於 2F 值班電腦確認終止！）": "✅ A-Wen's physical access badge has been returned and revoked.\\n(Note: Physical access and digital file permissions are separate; verify digital termination at 2F PC!)",
  "已收回阿文的實驗室門禁卡並於系統登錄停用！門禁回收狀態已同步更新到交接清單。": "Retrieved A-Wen's lab access badge and logged its deactivation! Status updated on the handover checklist.",
  "第五章「阿文的最後一天」已經完成交班！要重新檢視通關畫面與交班紀錄，還是再挑戰其他路線呢？": "Chapter 5 \"A-Wen's Last Day\" Handover Complete! Review the clear screen & Handover Notes, or try another route?",
  "還沒開始處理阿文的離職交接喔！請先打開旁邊的 2F 值班電腦查看交接清單與存取預覽，或找 2F 的阿文與小晴、1F 的阿明組長與大門櫃台確認事項。": "Offboarding tasks not started yet! Open 2F PC to review checklist and access preview, or consult A-Wen, Xiao-Qing, and Team Lead A-Ming.",
  "小晴在 1F 大廳拿著研發成果清單筆記，對小安說：\\n「小安！明天我要進行星空計畫的研發成果清單盤點。阿文在 2F 量測實驗區手上有三組資料卡，但他不確定哪些要列入清單受控、哪些只要留作一般紀錄。\\n你能不能先走樓梯上 2F 實驗室找阿文，幫忙確認一下這三組資料卡？我等等也上去 2F 辦公室準備資料，確認好後再到 2F 電腦彙整清單喔！」": "Xiao-Qing holds an inventory notepad in the 1F Lobby and says to Xiao-An:\\n\"Xiao-An! Tomorrow I need to conduct the R&D Records Inventory for Project StarSky. A-Wen is in the 2F Lab with three data sets, but he is unsure which should be inventoried for controlled protection. Could you take the stairs to the 2F Lab to help him review the three data cards? I will head up to the 2F Office as well—once checked, let's compile the inventory at the 2F PC!\"",
  "好！同一計畫可能同時包含公開資訊、未公開 know-how 和專利申請資料。我們一起看這三張資料卡，確認各自該如何判斷！": "Great! A single project can encompass public information, undisclosed know-how, and patent filings. Let us examine the 3 data cards to classify each properly!",
  "透過觀測窗可看見星空計畫量測機台。機密技術參數與原始數據均保存在專案受控資料夾，不抄入清單中。": "StarSky measurement apparatus visible through window. Proprietary parameters and raw data stay in controlled folders—never copied into the inventory catalog.",
  "來，這是星空計畫的三張資料卡。我們逐張看看：哪些只要留作一般紀錄、哪些要以資料群組列入清單受控保護！": "Here are the 3 data cards for StarSky. Let us check: which belong in routine records, and which must be cataloged as controlled records by data cluster!",
  "太清楚了！同一研究計畫下，公開資訊、自研 know-how 跟專利申請資料的界線完全分明了。走吧，請走樓梯上 2F 辦公區的值班電腦，把這份清單確認並存檔！": "So clear! The boundaries between public information, proprietary know-how, and patent applications within one project are distinct. Let us head up to 2F PC to save the inventory!",
  "三組資料卡我們都已經辨識完畢囉！請到旁邊 2F 辦公區的值班電腦確認清單草稿並存檔。": "All 3 data cards classified! Head over to the Duty PC in the 2F Office area to review and save the draft inventory.",
  "電腦畫面上顯示星空計畫研發成果清單草稿。\\n※ 請先在 2F 量測實驗區找同事阿文查看三組資料卡，完成辨識後再來確認清單！": "Screen displays StarSky Project R&D Records Inventory draft.\\n※ Please review the 3 data cards with A-Wen in 2F Lab first before confirming the inventory!",
  "嗨小安！明天我要盤點星空計畫的研發成果資料。請先走樓梯上 2F 量測實驗區幫阿文看資料卡，確認好哪些要列入清單受控再來找我喔！": "Hi Xiao-An! Tomorrow I will inventory StarSky R&D records. Take the stairs to 2F Lab to help A-Wen check the data cards first, and come back once you've determined what to include!",
  "小安，這份清單上的「量測裝置申請資料」還是標註『尚未公開』耶？組長剛剛不是發通知說專利已經公開了嗎？請先回 2F 值班電腦更新狀態再來找我核對喔！": "Xiao-An, \"Measurement Device Application Data\" is still marked \"Not Yet Published\"? Team Lead A-Ming just notified us that the patent published today! Update it at 2F PC first!",
  "第三章「這批資料要列入清單嗎？」已經完成交班！要重新檢視通關畫面，還是再試試不同路線呢？": "Chapter 4 \"Should These Records Be Inventoried?\" Handover Complete! Review the clear screen or replay to try different routes?",
  "請先至 2F 值班電腦確認星空計畫研發成果清單，並依專利公開通知完成更新，再向小晴核對完成交班。": "Review the StarSky R&D Records Inventory at 2F PC, update it following the patent publication notice, and verify with Xiao-Qing before handover.",
  "清單已更新存檔！請先找 2F 辦公區的盤點同事小晴核對一次明天的盤點重點，即可完成交班。": "Inventory updated and saved! Review tomorrow's inventory focus with Xiao-Qing in 2F office to complete handover.",
  "研發成果清單已整理妥當，小晴也核對完畢！要現在完成第四章交班嗎？": "R&D Records Inventory organized and verified with Xiao-Qing! Complete Chapter 4 Handover now?",
  "下午 4:00，同事阿文拿著剛整理好的三份研究文件急匆匆走進 2F 辦公區，等一下小晴要接手盤點並準備會議資料。": "4:00 PM. Colleague A-Wen rushes into 2F office holding 3 research documents. Xiao-Qing will take over soon to prepare meeting materials.",
  "小安！這三份資料等一下要交接給小晴，但各份的內容和用途都不太一樣。我們得先逐份看清楚，決定要不要加上機密標示，並標在顯眼的位置（簡報封面與頁腳、紙本首頁蓋印），小晴接手才清楚怎麼處理！": "Xiao-An! These 3 files will be handed over to Xiao-Qing, but their contents and purposes differ. We must review each to decide whether to add a Confidentiality Label in prominent spots (slides cover/footer, paper cover stamp) so she knows how to handle them!",
  "沒問題！我們逐份查看內容和用途，確認哪些含有未公開的自研技術，加上正確標示並預覽版面效果後，再交給小晴！": "No problem! Let us check contents and purposes, identify undisclosed know-how, apply proper Confidentiality Labels, preview layouts, and hand them to Xiao-Qing!",
  "這三份文件分別是：成果發表會活動海報、量測調校方法內部簡報，以及關鍵樣品量測原始紙本手稿。我們打開工作台，逐份確認內容、用途與機密標示吧！": "The 3 documents: Symposium Event Poster, Internal Tuning Methods Slides, and Raw Measurement Paper Log. Let us open the workbench to evaluate each!",
  "三份文件的機密標示都標妥了！海報維持公開版面、簡報在封面和頁腳標密、紙本首頁蓋印，一目了然！趕快拿去交給 2F 辦公區的小晴接手吧！": "All 3 documents properly labeled! Poster stays public, presentation labeled on cover & footers, paper stamped on page 1. Clear at a glance! Take them to Xiao-Qing in 2F office!",
  "螢幕開啟「文件機密標示與版面預覽工作台」。可逐份檢視文件內容、用途與機密標示決策，並即時預覽簡報封面／頁腳或紙本首頁印記。": "Screen opens \"Document Marking & Layout Preview Workbench\". Review contents, purposes, labeling decisions, and preview slide cover/footers or paper stamps in real time.",
  "小安，文件標示是營業秘密合理保密措施非常關鍵的一環！\\n\\n": "Xiao-An, document labeling is a critical component of reasonable trade secret safeguards!\\n\\n",
  "小安，等阿文和你把三份文件的機密標示都確認好，再交給我喔！接手時我需要確認每一份的標示，才知道接下來要存放在哪裡、能不能對外分享。": "Xiao-An, once you and A-Wen finish labeling the 3 documents, hand them to me! When taking over, I need to check the labels to know where to store them and whether they can be shared.",
  "太好了，三份文件都標示完成了！讓我一份一份核對：": "Great, all 3 documents are labeled! Let me verify each one:",
  "①【活動海報】：標示為「公開／一般」，確認內容沒有未公開自研技術！我等一下會直接拿去 1F 大廳形象區公布欄張貼，並發布公開報名資訊。": "①【Event Poster】: Labeled \"General / Public\"—verified no undisclosed know-how! I will post it on the 1F Lobby notice board and publish registration links.",
  "②【調校方法內部簡報】：封面和每頁頁腳都清楚標註了「機密／限專案內部使用」！這份含有未公開最佳化參數，我會放入加密受控資料夾；日後若有外部合作廠商想要索取，我會先向阿明組長確認 NDA 與授權範圍，絕不私自轉發！": "②【Tuning Methods Slides】: Conspicuous \"Confidential / Internal Use Only\" on title and footers! Contains undisclosed parameters; I will store it in encrypted project folders and verify NDA scope with A-Ming before sharing!",
  "③【原始紙本手稿】：首頁蓋有醒目的「機密」紅章與管制編號！因為記載第一手量測數據，我今天核對完會立刻鎖進 2F 防火公文櫃，離開座位時落實桌面淨空；日後借閱皆需在清冊登記。": "③【Raw Paper Log】: Prominent red \"Confidential\" stamp and control number on page 1! Contains raw data; I will lock it in the 2F fireproof filing cabinet and enforce clean desk. Borrowing requires logbook sign-out.",
  "總結來說：\\n「標示讓接手人知道怎麼處理，分享前仍要確認對象及權限。」": "In summary:\\n\"Marking guides the handler on proper custody; before sharing, always verify recipient and authorization.\"",
  "文件交接核對完成！你可以直接向我完成交班，或是回 2F 值班桌填寫交班紀錄簿！": "Document handover verified! You can complete handover directly with me, or return to 2F duty desk to log handover notes!",
  "三份文件我都按照標示妥善安排了！記得核心守則：「標示讓接手人知道怎麼處理，分享前仍要確認對象及權限。」隨時可完成交班喔！": "I have arranged all 3 documents per their labels! Remember: \"Marking guides the handler on proper custody; before sharing, always verify recipient and authorization.\" Handover anytime!",
  "第三章「這份文件要怎麼標？」已經完成交班！要重新檢視交班紀錄，還是再挑戰一次呢？": "Chapter 3 \"How to Label This Document?\" Handover Complete! Review Handover Notes or try again?",
  "三份文件尚未完成標示喔！請先和 2F 的阿文或操作旁邊的 2F 值班電腦，逐份判定活動海報、調校簡報與紙本手稿的機密標示。": "The 3 documents are not fully labeled yet! Consult A-Wen or use the 2F PC to evaluate the poster, presentation slides, and paper log.",
  "三份文件的標示都完成了！請先找 2F 辦公區的接手同事小晴交接文件，確認保管方式與分享原則，即可完成交班。": "All 3 documents labeled! Hand them over to successor Xiao-Qing in 2F office to confirm custody and sharing principles, then complete handover.",
  "文件標示與版面預覽精準落實，小晴也已核對並清楚後續保管與分享規範！要現在完成第三章交班嗎？": "Document labeling & previews completed accurately; Xiao-Qing verified custody and sharing protocols! Complete Chapter 3 Handover now?"
};

  const listeners = [];

  function t(key, fallback) {
    const dict = DICTIONARY[currentLang] || DICTIONARY.zh;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    return fallback !== undefined ? fallback : key;
  }

  function _t(zhText, enText) {
    return currentLang === 'en' ? enText : zhText;
  }

  function getLang() {
    return currentLang;
  }

  function hasChosenLang() {
    return localStorage.getItem(LANG_STORAGE_KEY) !== null;
  }

  function setLang(lang) {
    if (lang !== 'zh' && lang !== 'en') lang = 'zh';
    currentLang = lang;
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
    document.title = t('pageTitle');

    listeners.forEach((fn) => {
      try {
        fn(currentLang);
      } catch (e) {
        console.error('i18n listener error:', e);
      }
    });
  }

  function onLangChange(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
    }
  }

  function translateSpeaker(speaker) {
    if (currentLang !== 'en') return speaker;
    if (!speaker) return '';
    return SPEAKERS_MAP[speaker] || speaker;
  }

  function translateChoice(label) {
    if (currentLang !== 'en') return label;
    if (!label) return '';
    return CHOICES_MAP[label] || label;
  }

  function translateDialogue(text) {
    if (currentLang !== 'en') return text;
    if (!text) return '';
    const trimmed = text.trim();
    if (DIALOGUES_MAP[trimmed]) return DIALOGUES_MAP[trimmed];
    if (DIALOGUES_MAP[text]) return DIALOGUES_MAP[text];

    const norm = trimmed.replace(/\r\n/g, '\n');
    if (DIALOGUES_MAP[norm]) return DIALOGUES_MAP[norm];

    // Try finding key with normalized newlines
    for (const key of Object.keys(DIALOGUES_MAP)) {
      if (key.trim().replace(/\r\n/g, '\n') === norm) {
        return DIALOGUES_MAP[key];
      }
    }

    // Generic fallback replacement for dynamic strings
    let res = text;
    res = res.replace(/小安/g, 'Xiao-An');
    res = res.replace(/阿文/g, 'A-Wen');
    res = res.replace(/阿明組長/g, 'Team Lead A-Ming');
    res = res.replace(/小晴/g, 'Xiao-Qing');
    res = res.replace(/陳先生/g, 'Mr. Chen');
    res = res.replace(/營業秘密/g, 'Trade Secret');
    res = res.replace(/機密標示/g, 'Confidentiality Label');
    res = res.replace(/保密協議/g, 'Non-Disclosure Agreement (NDA)');
    res = res.replace(/研發成果清單/g, 'R&D Records Inventory');
    res = res.replace(/未公開技術經驗/g, 'Undisclosed Know-how');
    res = res.replace(/專利已送件、尚未公開/g, 'Patent Application Filed, Not Yet Published');
    res = res.replace(/交班紀錄/g, 'Handover Notes');
    return res;
  }

  const TOASTS_MAP = {
    '✅ 已確認星海科技簽署有效 NDA-CS-2026（限蘇小姐・僅摘要圖）': '✅ Verified Starlight Tech active NDA-CS-2026 (Ms. Su only · Summary charts only)',
    '🚨 叮咚！合作方蘇小姐立刻回信了，請查看值班電腦！': '🚨 Ding! Partner Ms. Su replied immediately. Check duty PC!',
    '✅ 已解鎖新選項：電腦可選擇「僅會議用兩張圖（已核准版）」': '✅ Unlocked option: PC can select "2 Meeting Summary Charts Only (Approved)"',
    '📨 已向主辦方提出撤換請求，公開狀態待確認！': '📨 Replacement request sent to organizer; public status pending confirmation!',
    '✅ 已掌握圖二來源（合作會議用），並於電腦解鎖「替換替代圖」！': '✅ Fig 2 origin identified (meeting use only); unlocked "Replace with Alternative" on PC!',
    '⚠ 原始紀錄尚未移交就停權了！可找 2F 小晴確認，再下樓請 1F 阿明組長安排管理員移交！': '⚠ Access revoked before transfer! Check with Xiao-Qing on 2F, then ask Lead A-Ming on 1F for admin transfer!',
    '⚠ 已暫時保留阿文原權限！請看「阿文視角」確認是否授權過廣。': '⚠ A-Wen original permissions kept temporarily! Check "A-Wen View" to see if access is over-granted.',
    '✅ 阿文已將原始紀錄移交至專案指定位置！': '✅ A-Wen transferred raw records to designated project folder!',
    '✅ 已記錄：完成阿文離職保密義務提醒！': '✅ Logged: Post-employment Non-Disclosure reminder given to A-Wen!',
    '🪪 已取得阿文門禁卡！請下樓至 1F 大門接待櫃台完成收回登記。': '🪪 Obtained A-Wen\'s badge! Take it to 1F reception to log return.',
    '✅ 小晴已實測開啟原始紀錄並確認接收！交接清單已更新！': '✅ Xiao-Qing verified opening raw records and confirmed receipt! Checklist updated!',
    '🚒 管理員已單獨移交指定原始紀錄（未恢復阿文整包權限）！': '🚒 Admin transferred specific raw record (without restoring A-Wen\'s full access)!',
    '✅ 已由 1F 阿明組長核定：僅兩張圖・論文修訂・離開後 30 天！': '✅ Approved by Lead A-Ming: 2 charts only · thesis revisions · expires in 30 days!',
    '✅ 已於 1F 大門接待櫃台完成阿文門禁卡收回登記！': '✅ Completed A-Wen\'s badge return & cancellation at 1F reception!',
    '🎉 三份文件標示已完成！請找 2F 辦公區的小晴接手文件。': '🎉 All 3 documents labeled! Hand them over to Xiao-Qing in 2F office.',
    '🎉 文件標示與交接已核對完成！向小晴或回值班桌完成交班。': '🎉 Document labels verified! Hand over to Xiao-Qing or at desk.',
    '🎉 研發成果清單已核對完成！向小晴或回值班桌完成交班。': '🎉 Inventory verified! Hand over to Xiao-Qing or at desk.',
    '🎉 任務已處理完成！請回到 2F 辦公區值班桌（綠勾 ✓）完成交班與通關！': '🎉 Task completed! Return to 2F duty desk (✓) to finish!',
    '✅ 清單更新儲存完成！請找 2F 辦公區的盤點同事小晴核對。': '✅ Inventory update saved! Please verify with inventory colleague Xiao-Qing at 2F Office.'
  };

  function translateToast(msg) {
    if (currentLang !== 'en' || !msg) return msg;
    if (TOASTS_MAP[msg]) return TOASTS_MAP[msg];
    if (msg.includes('照片已拍入')) {
      let items = msg.replace(/^.*?「(.*?)」.*?$/, '$1');
      items = items.replace(/白板配方參數/g, 'Whiteboard Formula Parameters')
                   .replace(/螢幕原始數據/g, 'Screen Raw Measurements')
                   .replace(/樣品代碼標籤/g, 'Sample Batch Code Labels')
                   .replace(/、/g, ', ');
      return `⚠ Warning: Photo captured "${items}"!`;
    }
    if (msg.includes('已建立新版本')) {
      const fn = msg.replace(/^.*?新版本\s*(\S+)\s*（.*$/, '$1');
      return `⚠ Created new version ${fn} (pending re-verification); original approved record preserved!`;
    }
    if (msg.includes('誤傳了未核准檔案')) {
      const fn = msg.replace(/^.*?「(.*?)」.*?$/, '$1');
      return `🚨 Oh no! Mistakenly uploaded unapproved file "${fn}"! Remediate immediately!`;
    }
    return msg;
  }

  window.BS.I18n = {
    getLang,
    setLang,
    hasChosenLang,
    t,
    _t,
    onLangChange,
    translateSpeaker,
    translateChoice,
    translateDialogue,
    translateToast,
    DICTIONARY,
    SPEAKERS_MAP,
    CHOICES_MAP,
    DIALOGUES_MAP
  };
  window.BS._t = _t;
})();
