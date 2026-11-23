(function () {
  window.BS = window.BS || {};

  function createStoryController(ctx) {
    // ctx provides: getState(), getNPCs(), advanceTime(mins), refreshHUD(),
    //               restartChapter(), returnToMenu(), moveNpcTo(id, x, y, dir)

    function handleCommonScenery(state, targetId) {
      if (targetId === 'elevator_up') {
        ctx.transitionToFloor(2, 2, 4, 'down');
        return true;
      }
      if (targetId === 'elevator_down') {
        ctx.transitionToFloor(1, 2, 4, 'down');
        return true;
      }
      if (targetId === 'lobby_sign') {
        window.BS.UI.startDialogue([
          {
            speaker: '1F 大廳形象牆',
            speaker_en: '1F Logo Wall',
            portrait: 'reception',
            text: '中研院RCCI實驗室一樓大廳形象牆。這裡是訪客核准拍照區，構圖專業且完全不會拍到管制實驗區內部資訊。',
            text_en: 'Academia Sinica RCCI Lab 1F Logo Wall. This is the designated visitor photo spot—framed safely so no restricted lab information is visible.'
          }
        ]);
        return true;
      }
      if (targetId === 'cleanroom_window') {
        window.BS.UI.startDialogue([
          {
            speaker: '1F 管制實驗區觀測窗',
            speaker_en: '1F Cleanroom Window',
            portrait: 'monitor',
            text: '透過大面玻璃觀測窗可看到一樓管制實驗區的機台運作。門禁告示寫著：「未經授權人員禁止入內，訪客參觀須事前申請並全程陪同。」',
            text_en: 'Equipment operates behind the glass window. Notice: "Authorized personnel only. Visitors require prior registration and continuous escort."'
          }
        ]);
        return true;
      }
      if (targetId === 'conference_door') {
        window.BS.UI.startDialogue([
          {
            speaker: '1F 演講與會議廳',
            speaker_en: '1F Conference Hall',
            portrait: 'poster',
            text: state.chapter === 2
              ? '一樓演講與會議廳，明天研討會前夕燈光已暗。對外公開的海報與簡報，務必先確認授權與版本！'
              : '一樓大型演講與會議廳。舉辦外部交流活動時，來賓須先於大門櫃台登記並遵守拍攝規範。',
            text_en: state.chapter === 2
              ? '1F Conference Hall before tomorrow\'s symposium. Before public presentation, always verify partner authorization and final approved version!'
              : '1F Main Auditorium. For external events, visitors must register at reception and comply with photography policies.'
          }
        ]);
        return true;
      }
      if (targetId === 'notice_board') {
        window.BS.UI.startDialogue([
          {
            speaker: '2F 營業秘密宣導布告欄',
            speaker_en: '2F Trade Secret Notice Board',
            portrait: 'desk',
            text: '【實驗室營業秘密三提醒】\n① 對外給廠商資料：先確認有效 NDA、最小範圍與連結效期。\n② 訪客接待與拍照：一樓登記、全程陪同、拍前巡視白板螢幕樣品。\n③ 論文與海報公開：確認合作授權與專利安排，核准綁定版本。',
            text_en: '【Three Lab Trade Secret Reminders】\n① Sharing data with vendors: verify active NDA, minimal scope, and link expiry.\n② Visitor escort & photos: 1F sign-in, continuous escort, inspect whiteboards & screens before shooting.\n③ Papers & posters: verify partner consent and patent status; bind approval to exact version.'
          }
        ]);
        return true;
      }
      return false;
    }

    function interact(target) {
      if (!target) return;
      const state = ctx.getState();

      if (handleCommonScenery(state, target.id)) return;

      if (state.chapter === 5) {
        interactCh5(state, target);
      } else if (state.chapter === 4) {
        interactCh4(state, target);
      } else if (state.chapter === 3) {
        interactCh3(state, target);
      } else if (state.chapter === 2) {
        interactCh2(state, target);
      } else {
        interactCh1(state, target);
      }
    }

    function playIntro() {
      const state = ctx.getState();
      if (state.introShown) return;
      state.introShown = true;

      if (state.chapter === 5) {
        playCh5Intro();
      } else if (state.chapter === 4) {
        playCh4Intro();
      } else if (state.chapter === 3) {
        playCh3Intro();
      } else if (state.chapter === 2) {
        playCh2Intro();
      } else {
        playCh1Intro();
      }
    }

    // =========================================================================
    // CHAPTER 1: 寄出之前
    // =========================================================================
    function playCh1Intro() {
      window.BS.UI.startDialogue([
        {
          speaker: '值班備忘錄（2F 辦公區）',
          speaker_en: 'Duty Memo (2F Office)',
          portrait: 'desk',
          text: '下午 3:40，下班前還有兩件事要處理：\n① 2F 辦公區電腦有合作方急著要會議資料的來信。\n② 1F 大門櫃台有預約來賓陳先生等候拍照（可由左側樓梯／電梯下樓）。',
          text_en: '3:40 PM. Two tasks before clocking out:\n① An urgent email from partner requesting meeting slides on 2F duty PC.\n② Scheduled visitor Mr. Chen waiting at 1F reception for photography (take stairs/elevator on left).'
        },
        {
          speaker: '小安（值班研究助理）',
          speaker_en: 'Xiao-An (Duty Research Assistant)',
          portrait: 'player',
          text: '順序可以自己安排。跟外部廠商交流資料前，記得先確認對方是否已簽署有效 NDA！有不確定的地方，就查電腦合約清單，或問 2F 實驗區的阿文與組長辦公室的阿明組長吧！',
          text_en: 'I can tackle them in any order. Before sharing data with external partners, ensure a valid Non-Disclosure Agreement (NDA) is signed! If unsure, check NDA records on PC or consult A-Wen in 2F lab and Team Lead A-Ming!'
        }
      ]);
    }

    function interactCh1(state, target) {
      switch (target.id) {
        case 'pc':
          handleCh1Computer(state);
          break;
        case 'duty_desk':
          handleCh1DutyDesk(state);
          break;
        case 'npc_lead':
          handleCh1Lead(state);
          break;
        case 'npc_colleague':
          handleCh1Colleague(state);
          break;
        case 'whiteboard':
          handleCh1Whiteboard(state);
          break;
        case 'monitor':
          handleCh1Monitor(state);
          break;
        case 'samples':
          handleCh1Samples(state);
          break;
        case 'reception':
          handleCh1Reception(state);
          break;
        case 'npc_visitor':
          handleCh1Visitor(state);
          break;
      }
    }

    function handleCh1Computer(state) {
      if (state.email.status === 'unread') {
        state.email.status = 'read';
        ctx.advanceTime(2);
        ctx.refreshHUD();
      }

      window.BS.UI.openComputerModal(state, {
        onVerifyNda() {
          state.clues.ndaCheckedInSystem = true;
          state.clues.ndaScope = true;
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.UI.showToast('✅ 已確認星海科技簽署有效 NDA-CS-2026（限蘇小姐・僅摘要圖）', false, 3800);
        },

        onHoldingReply() {
          state.email.usedHoldingReply = true;
          state.email.status = 'holding';
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.Audio.success();
          window.BS.UI.startDialogue([
            {
              speaker: '值班電腦',
              portrait: 'pc',
              text: '已回覆蘇小姐：「收到！正在確認會議用核准版本與保密約定範圍，核對完馬上提供給您。」'
            },
            {
              speaker: '小安',
              portrait: 'player',
              text: '先讓對方知道進度，就不用倉促寄出。接下來去問問實驗區的阿文（確認版本）和阿明組長（確認保密約定）吧！'
            }
          ]);
        },

        onSend({ payload, permission }) {
          ctx.advanceTime(4);
          state.email.sentPayload = payload;
          state.email.sentPermission = permission;
          state.email.sentWithNdaCheck = state.clues.ndaScope;

          if (permission === 'public_link' || payload === 'full_folder') {
            state.email.misshared = true;
            state.email.status = 'misshared_active';
            state.email.followupArrived = true;
            state.email.misshareTimeStr = window.BS.State.formatClock(state.timeMinutes);
            ctx.refreshHUD();
            window.BS.Audio.alert();
            window.BS.UI.showToast('🚨 叮咚！合作方蘇小姐立刻回信了，請查看值班電腦！', true, 5000);
            window.BS.UI.startDialogue([
              {
                speaker: '值班電腦（新郵件提醒！）',
                portrait: 'alert',
                text: payload === 'full_folder'
                  ? '剛寄出沒兩分鐘，蘇小姐立刻回信了：\n「小安您好，我點開連結發現裡面還有原始量測數據和製程筆記！我們等等有外部協力廠商會加入，請問這個連結可以直接轉給他們一起看嗎？」'
                  : '剛寄出沒兩分鐘，蘇小姐立刻回信了：\n「小安您好，這個連結免登入誰都能開好方便！我們等等有外部協力廠商會加入，我就直接把連結轉給他們一起看囉？」'
              },
              {
                speaker: '小安',
                portrait: 'player',
                text: payload === 'full_folder'
                  ? '糟了！！裡面夾帶了未核准對外的資料，而且合作方還想轉傳給協力廠商！\n得趕快回電腦限制／停用連結存取，再找阿明組長通報才行！'
                  : '糟了！！設成「持連結者皆可存取」，對方隨時可能轉傳給不在保密約定內的協力廠商！\n得趕快回電腦停用公開連結，再找阿明組長通報才行！'
              }
            ]);
            return;
          }

          if (state.clues.ndaScope) {
            state.email.status = 'sent_safe';
            ctx.refreshHUD();
            window.BS.Audio.success();
            window.BS.UI.startDialogue([
              {
                speaker: '值班電腦',
                portrait: 'pc',
                text: `已寄出「StarSky_會議用摘要圖_v2（僅圖A、圖B）」給星海科技蘇小姐。\n權限：指定收件人唯讀${permission === 'restricted_7d' ? '、7 天後自動到期' : '（未設定到期日）'}。`,
                text_en: `Sent "StarSky_Meeting_Summary_Figs_v2 (Fig A & Fig B only)" to Ms. Su of Starlight Tech.\nPermission: Designated recipient read-only${permission === 'restricted_7d' ? ', expires automatically in 7 days' : ' (no expiration set)'}.`
              },
              {
                speaker: '小安',
                portrait: 'player',
                text: '蘇小姐回覆「收到了，圖表很清楚，感謝！」\n我也把實際提供的版本、收件對象和權限順手記下來，交班時才好追溯。',
                text_en: 'Ms. Su replied: "Received! The charts are very clear, thank you!"\nI also recorded the version sent, recipient, and permissions so they can be traced during handover.'
              }
            ]);
          } else {
            state.email.status = 'sent_unverified';
            ctx.refreshHUD();
            window.BS.Audio.confirm();
            window.BS.UI.startDialogue([
              {
                speaker: '值班電腦',
                portrait: 'pc',
                text: '已寄出會議用兩張圖（限定蘇小姐唯讀）。不過寄出前還沒向阿明組長確認 NDA 涵蓋範圍，交班時最好註記一下。',
                text_en: 'Sent 2 meeting figures (designated recipient Ms. Su read-only). However, NDA scope was unverified with Team Lead A-Ming prior to sending; make a note in the handover.'
              }
            ]);
          }
        },

        onRevokeLink() {
          state.email.linkRevoked = true;
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.Audio.success();
          window.BS.UI.startDialogue([
            {
              speaker: '值班電腦',
              portrait: 'pc',
              text: '🔒 已立即停用原公開連結！同時回覆蘇小姐說明誤傳了非會議用檔案，請勿轉傳給協力廠商並協助刪除快取。',
              text_en: '🔒 The original public link has been revoked immediately! Also replied to Ms. Su explaining non-meeting files were mistakenly sent, requesting no forwarding to subcontractors and deletion of cached copies.'
            },
            {
              speaker: '小安',
              portrait: 'player',
              text: '連結先鎖住了，但還不能就此算了——不知道對方或協力廠商剛剛有沒有先下載。\n馬上找辦公區的負責人阿明組長完成異常通報！',
              text_en: 'The link is locked down, but we cannot stop here—we do not know if the partner or subcontractors downloaded it already.\nI must report the incident to Team Lead A-Ming in the office immediately!'
            }
          ]);
        },

        onResendSafeAfterFix() {
          state.email.sentSafeAfterFix = true;
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.UI.startDialogue([
            {
              speaker: '值班電腦',
              portrait: 'pc',
              text: '已補寄核准的「StarSky_會議用摘要圖_v2（僅圖A、圖B）」，限定星海科技蘇小姐唯讀且 7 天自動到期。',
              text_en: 'Resent the approved "StarSky_Meeting_Summary_Figs_v2 (Fig A & Fig B only)", restricted to Ms. Su of Starlight Tech with a 7-day automatic expiration.'
            }
          ]);
        }
      });
    }

    function handleCh1Lead(state) {
      const e = state.email;

      if (e.misshared && !e.reportedToLead) {
        if (!e.linkRevoked) {
          window.BS.UI.startDialogue([
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '小安，看你神色很緊張，發生什麼事了？',
              text_en: 'Xiao-An, you look very nervous. What happened?'
            },
            {
              speaker: '小安',
              portrait: 'player',
              text: '組長，我剛才不小心把星空計畫的測試資料設成公開連結寄給合作方，對方還問能不能轉給協力廠商……',
              text_en: 'Team Lead, I accidentally sent StarSky test data as a public link to the partner, and they just asked if they can forward it to subcontractors...'
            },
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '你第一時間來講是對的！先別慌——請立刻回電腦把那個公開連結停用／改為限制存取，止血後再馬上回來跟我做正式通報！',
              text_en: 'Coming to me immediately was the right move! Don\'t panic—go to the PC right now and revoke/restrict that public link. Stop the leak first, then come back immediately to make a formal incident report!'
            }
          ]);
          return;
        }

        window.BS.UI.startDialogue([
          {
            speaker: '負責人 阿明組長',
            portrait: 'lead',
            text: '小安，你剛才說已經把公開連結停用了。很好，我們現在立刻做異常通報紀錄。通報時要把關鍵資訊講清楚，你打算怎麼說明？',
            text_en: 'Xiao-An, you mentioned you revoked the public link. Good. We will document the incident report right now. Key details must be clear—how do you plan to report it?',
            choices: [
              {
                label: '完整交代四要素：發現時間、涉及檔案範圍、使用的雲端系統與已停權現況（含轉傳待確認）',
                label_en: 'Report all 4 essentials: discovery time, file scope, cloud system used, and current status (including pending subcontractor checks)',
                onSelect: () => {
                  e.reportedToLead = true;
                  e.reportComplete = true;
                  e.status = 'misshared_remediated';
                  state.clues.ndaScope = true;
                  ctx.advanceTime(4);
                  ctx.refreshHUD();
                  window.BS.Audio.success();
                  window.BS.UI.startDialogue([
                    {
                      speaker: '小安',
                      portrait: 'player',
                      text: `阿明組長，我整理好了：\n① 發現時間：約 ${e.misshareTimeStr || '15:46'} 收到蘇小姐回信時發現。\n② 涉及資料：StarSky_TestData 內含原始量測數據與未審製程筆記。\n③ 使用系統：實驗室雲端分享連結（原誤設為持連結者皆可存取）。\n④ 目前情況：已停用公開連結並請對方勿轉傳，但協力廠商是否已取得檔案仍待追蹤確認。`,
                      text_en: `Team Lead A-Ming, I have assembled the report:\n① Discovery Time: Around ${e.misshareTimeStr || '15:46'} upon receiving Ms. Su's reply.\n② Data Involved: StarSky_TestData contains raw measurement data and unreviewed process notes.\n③ System Used: Lab Cloud Share Link (initially misconfigured as Anyone with Link).\n④ Current Status: Public link revoked and recipient asked not to forward; following up on whether subcontractors retrieved files.`
                    },
                    {
                      speaker: '負責人 阿明組長',
                      portrait: 'lead',
                      text: '非常好，資訊很完整，我馬上同步知會資訊／資安窗口並聯絡星海科技主管確認是否留存或轉傳。',
                      text_en: 'Excellent, the information is complete. I will immediately notify IT/security and contact Starlight Tech management to confirm whether files were retained or forwarded.'
                    },
                    {
                      speaker: '負責人 阿明組長',
                      portrait: 'lead',
                      text: '另外提醒你，NDA-CS-2026 只涵蓋「會議用兩張摘要圖」給星海科技專案窗口開會使用。若待會要補寄，記得先跟阿文確認核准版再設定限定對象寄出。',
                      text_en: 'Also a reminder: NDA-CS-2026 only covers the "2 meeting summary figures" for the Starlight Tech project contact. If resending later, verify the approved version with A-Wen and restrict the recipient.'
                    }
                  ]);
                }
              },
              {
                label: '只說「剛剛好像傳錯連結，但我已經關掉了應該沒事」',
                label_en: 'Only say "I might have shared the wrong link earlier, but I turned it off so it should be fine"',
                onSelect: () => {
                  window.BS.UI.startDialogue([
                    {
                      speaker: '負責人 阿明組長',
                      portrait: 'lead',
                      text: '等等，只說「關掉了」不夠喔！如果不記錄「發現時間、涉及哪些資料、透過哪個系統分享、目前處置與轉傳風險」，後續資安窗口和合作方都沒辦法精準追蹤。再重新跟我完整回報一次吧！',
                      text_en: 'Hold on, just saying "I turned it off" isn\'t enough! Without recording "discovery time, data involved, sharing system, current remediation, and forwarding risk", neither security nor the partner can track the impact. Please report again completely!'
                    }
                  ], () => handleCh1Lead(state));
                }
              }
            ]
          }
        ]);
        return;
      }

      const choices = [];
      if (!state.clues.ndaScope) {
        choices.push({
          label: '確認星海科技是否已簽署有效 NDA（保密協議）與提供範圍',
          label_en: 'Verify if Starlight Tech has an active NDA and its authorized scope',
          onSelect: () => {
            window.BS.UI.startDialogue([
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: '問得好！跟外部廠商交流研究資料前，第一步一定要先確認「對方到底有沒有簽署有效的 NDA」。\n先考考你：如果今天來要測試資料的廠商「還沒簽 NDA」或「NDA 已經到期」，我們該怎麼做？',
                text_en: 'Great question! Before sharing research data with external partners, the first step is always verifying whether they have signed an active Non-Disclosure Agreement (NDA).\nLet me quiz you: If a partner requesting test data hasn\'t signed an NDA or their NDA has expired, what must we do?',
                choices: [
                  {
                    label: '未簽署或已到期就先不能提供機密資料，須先確認有效 NDA、效期與涵蓋範圍',
                    label_en: 'If unsigned or expired, no confidential data may be provided; verify active NDA, validity, and scope first',
                    onSelect: () => {
                      state.clues.ndaScope = true;
                      ctx.advanceTime(3);
                      ctx.refreshHUD();
                      window.BS.Audio.success();
                      window.BS.UI.startDialogue([
                        {
                          speaker: '負責人 阿明組長',
                          portrait: 'lead',
                          text: '完全正確！沒簽有效 NDA 就把機密交出去，事後很難主張合理保密措施。\n我幫你查過了：星海科技已簽署「NDA-CS-2026」（效期 2026/01/01～2027/12/31），目前在效期內。',
                          text_en: 'Spot on! Disclosing confidential data without an active NDA makes it very difficult to assert reasonable secrecy safeguards later.\nI checked for you: Starlight Tech has signed "NDA-CS-2026" (valid 2026/01/01–2027/12/31), currently active.'
                        },
                        {
                          speaker: '負責人 阿明組長',
                          portrait: 'lead',
                          text: '不過這份 NDA 只涵蓋「階段進度會議用的兩張核准摘要圖」，接收對象限星海科技專案團隊（蘇小姐），不包含原始量測數據和製程筆記，也未授權轉傳給協力廠商。',
                          text_en: 'However, this NDA only covers "2 approved meeting summary figures" for the Starlight Tech project team (Ms. Su). It excludes raw measurements and process notes, and does not authorize forwarding to subcontractors.'
                        },
                        {
                          speaker: '負責人 阿明組長',
                          portrait: 'lead',
                          text: '分享連結時記得設成「指定收件人唯讀」並加上到期日（例如 7 天）。你也可以在電腦的「NDA 合約清單」複習各廠商狀態；若要確認核准版圖檔在哪，記得去實驗區問阿文！',
                          text_en: 'When sharing links, remember to set "Designated Recipient Read-only" with an expiration date (e.g. 7 days). You can also review partner statuses in the PC NDA Registry; to locate the approved figures, ask A-Wen in the lab!'
                        }
                      ]);
                    }
                  },
                  {
                    label: '開會比較急，先寄檔案過去，NDA 下週再補簽就好',
                    label_en: 'The meeting is urgent, send files first and sign the NDA next week',
                    onSelect: () => {
                      window.BS.Audio.alert();
                      window.BS.UI.startDialogue([
                        {
                          speaker: '負責人 阿明組長',
                          portrait: 'lead',
                          text: '千萬不行喔！資料一旦先送出去，在沒有事前簽署 NDA 的情況下就容易喪失營業秘密的保護基礎。就算開會再趕，確認不到有效 NDA 前也只能先回覆確認中、絕不能先寄機密資料！再想一次看看？',
                          text_en: 'Absolutely not! Once data is disclosed without a prior NDA, the legal foundation for trade secret protection is easily lost. No matter how urgent, until an active NDA is verified, only reply "verifying"—never send confidential data! Think again.'
                        }
                      ], () => handleCh1Lead(state));
                    }
                  }
                ]
              }
            ]);
          }
        });
      } else {
        choices.push({
          label: '再次確認星海科技 NDA-CS-2026 的重點',
          label_en: 'Re-confirm key points of Starlight Tech NDA-CS-2026',
          onSelect: () => {
            window.BS.UI.startDialogue([
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: state.clues.ndaCheckedInSystem
                  ? '聽說你已經先在電腦查核過 NDA 合約清單了，很棒！重點再記一次：確認已簽署且在效期內、只給會議所需的兩張核准圖、限蘇小姐檢視並設定分享期限。'
                  : '重點三個：確認已簽署有效 NDA（NDA-CS-2026 效期至 2027 年底）、只給會議所需的兩張核准圖、限星海科技蘇小姐檢視並設定分享期限。',
                text_en: state.clues.ndaCheckedInSystem
                  ? 'I heard you checked the NDA Registry on the PC already, great! Remember the 3 keys: verify active within validity, share only 2 approved meeting figures, and restrict to Ms. Su with an expiration date.'
                  : 'Three key rules: verify active NDA signed (NDA-CS-2026 valid until end of 2027), provide only 2 approved meeting figures, and restrict to Ms. Su with an expiration date.'
              }
            ]);
          }
        });
      }

      choices.push({
        label: '詢問訪客拍照的注意事項',
        label_en: 'Inquire about precautions for visitor photography',
        onSelect: () => {
          window.BS.UI.startDialogue([
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '陳先生今天預約參訪，接待處有登記簿。最單純的方式是在訪客入口指定角度拍形象牆；若真的要陪同進實驗區拍照，千萬要先巡過白板、螢幕跟樣品架標籤！',
              text_en: 'Mr. Chen booked a tour today, registered at reception. The cleanest approach is photographing the logo wall at the approved entrance angle. If escorting into the lab to shoot, make sure to inspect whiteboard, screens, and sample labels first!'
            }
          ]);
        }
      });

      if (state.visitor.status === 'done_lab_leaked') {
        choices.push({
          label: '回報：剛才訪客在實驗區拍照時拍進了敏感資訊…',
          label_en: 'Report: The visitor captured sensitive information while taking photos in the lab...',
          onSelect: () => {
            window.BS.UI.startDialogue([
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: `感謝你主動告知！拍進「${state.visitor.leakedItems.join('、')}」確實有外洩疑慮，我會立刻聯絡陳先生說明並請對方協助刪除原圖。記得把這件事寫進交班紀錄喔。`,
                text_en: `Thank you for taking the initiative to report! Capturing "${state.visitor.leakedItems.map(item => item === '白板配方參數' ? 'Whiteboard Formula Parameters' : item === '螢幕原始數據' ? 'Screen Raw Measurements' : item === '樣品代碼標籤' ? 'Sample Batch Code Labels' : item).join(', ')}" indeed poses leak risks. I will contact Mr. Chen right away to explain and request deleting the original photo. Be sure to note this in the handover notes.`
              }
            ]);
          }
        });
      }

      choices.push({ label: '先忙別的事', label_en: 'Attend to other tasks for now', onSelect: () => {} });

      window.BS.UI.startDialogue([
        {
          speaker: '負責人 阿明組長',
          portrait: 'lead',
          text: e.reportedToLead
            ? '異常通報我已經立案追蹤了。辛苦你及早回報，其他值班任務處理完就可以交班囉。'
            : '小安，快四點了，合作方的信和入口的訪客都還順利嗎？有要確認的隨時問我。',
          text_en: e.reportedToLead
            ? 'The incident report is formally logged for tracking. Thank you for reporting promptly; once remaining duty tasks are done, you may hand over.'
            : 'Xiao-An, it\'s almost 4:00 PM. How are the partner email and entrance visitor coming along? Feel free to ask if you need to confirm anything.',
          choices
        }
      ]);
    }

    function handleCh1Colleague(state) {
      if (!state.clues.meetingVersion) {
        window.BS.UI.startDialogue([
          {
            speaker: '同事 阿文',
            portrait: 'colleague',
            text: '嗨小安！你是在找星海科技四點開會要用的圖嗎？'
          },
          {
            speaker: '同事 阿文',
            portrait: 'colleague',
            text: '幸好你有先來問！原本的 StarSky_TestData 資料夾裡還塞著原始量測數據（RAW）和我寫到一半的製程筆記草稿，千萬別整個資料夾直接丟出去！'
          },
          {
            speaker: '同事 阿文',
            portrait: 'colleague',
            text: '我剛剛已經把核准可以對外給的兩張圖獨立整理成「StarSky_會議用摘要圖_v2」放在系統裡了。你回電腦重看就會看到這個選項！'
          },
          {
            speaker: '同事 阿文',
            portrait: 'colleague',
            text: '對了，如果等一下有訪客要進實驗區拍照，白板上我剛寫的配方參數跟那台量測螢幕都還沒關，記得先處理一下喔！'
          }
        ], () => {
          state.clues.meetingVersion = true;
          ctx.advanceTime(3);
          ctx.refreshHUD();
          window.BS.Audio.success();
          window.BS.UI.showToast('✅ 已解鎖新選項：電腦可選擇「僅會議用兩張圖（已核准版）」', false, 3600);
        });
      } else {
        const exposed = window.BS.State.getExposedLabItems(state);
        window.BS.UI.startDialogue([
          {
            speaker: '同事 阿文',
            portrait: 'colleague',
            text: exposed.length > 0
              ? `會議用兩張圖已經放好在電腦裡了（StarSky_會議用摘要圖_v2）。對了，實驗區裡還有「${exposed.join('、')}」露在外面，有訪客進來拍照記得先遮蔽或收妥！`
              : '會議用兩張圖已經放好在電腦裡了，實驗區的白板、螢幕和樣品也都收得很乾淨，專業喔！'
          }
        ]);
      }
    }

    function handleCh1Whiteboard(state) {
      if (state.labItems.whiteboard) {
        window.BS.UI.startDialogue([
          {
            speaker: '實驗白板',
            portrait: 'whiteboard',
            text: '白板已經擦拭乾淨並確認重要參數已另存於電子實驗紀錄，就算拍照也不會外洩機密。'
          }
        ]);
        return;
      }

      window.BS.UI.startDialogue([
        {
          speaker: '實驗白板',
          portrait: 'whiteboard',
          text: '白板上寫著星空計畫最新的「配方比例 14.2%、退火溫度 380°C/4h」和結構草圖。若訪客在實驗區拍照，這些資訊會清清楚楚入鏡。',
          choices: [
            {
              label: '確認阿文已留存紀錄後，擦拭／遮蔽白板上的機密參數',
              onSelect: () => {
                state.labItems.whiteboard = true;
                ctx.advanceTime(1);
                ctx.refreshHUD();
                window.BS.Audio.success();
                window.BS.UI.startDialogue([
                  {
                    speaker: '小安',
                    portrait: 'player',
                    text: '跟阿文點頭確認數據都進紀錄簿了，我把白板擦乾淨。這樣就不怕被拍到了！'
                  }
                ]);
              }
            },
            { label: '先保持原樣', onSelect: () => {} }
          ]
        }
      ]);
    }

    function handleCh1Monitor(state) {
      if (state.labItems.monitor) {
        window.BS.UI.startDialogue([
          {
            speaker: '實驗室螢幕',
            portrait: 'monitor',
            text: '螢幕已鎖定為保護畫面，看不到任何量測曲線與檔名。'
          }
        ]);
        return;
      }

      window.BS.UI.startDialogue([
        {
          speaker: '實驗室螢幕',
          portrait: 'monitor',
          text: '量測電腦的螢幕正開著未去識別化的「RAW_DATA.csv」原始量測曲線，視窗標題還顯示著計畫代號。',
          choices: [
            {
              label: '鎖定電腦螢幕（Win+L / 切換待機畫面）',
              onSelect: () => {
                state.labItems.monitor = true;
                ctx.advanceTime(1);
                ctx.refreshHUD();
                window.BS.Audio.success();
                window.BS.UI.startDialogue([
                  {
                    speaker: '小安',
                    portrait: 'player',
                    text: '先把量測螢幕鎖定畫面，既不會中斷背景紀錄，也不怕鏡頭掃到原始數據。'
                  }
                ]);
              }
            },
            { label: '先不操作', onSelect: () => {} }
          ]
        }
      ]);
    }

    function handleCh1Samples(state) {
      if (state.labItems.samples) {
        window.BS.UI.startDialogue([
          {
            speaker: '樣品架與標籤',
            portrait: 'samples',
            text: '樣品已經整齊收進不透明的防塵保管箱中，外部看不到任何配方代碼標籤。'
          }
        ]);
        return;
      }

      window.BS.UI.startDialogue([
        {
          speaker: '樣品架與標籤',
          portrait: 'samples',
          text: '實驗桌上排著三支未收妥的樣品管，白色標籤朝外清楚寫著批次與配方代號（CS-B4 / CS-B5 / CS-B6）。',
          choices: [
            {
              label: '將樣品收妥至不透明樣品盒／遮蔽標籤',
              onSelect: () => {
                state.labItems.samples = true;
                ctx.advanceTime(1);
                ctx.refreshHUD();
                window.BS.Audio.success();
                window.BS.UI.startDialogue([
                  {
                    speaker: '小安',
                    portrait: 'player',
                    text: '把樣品收進專屬的不透明保管盒蓋好。標籤細節最容易被忽略，幸好有檢查到！'
                  }
                ]);
              }
            },
            { label: '先放著不管', onSelect: () => {} }
          ]
        }
      ]);
    }

    function handleCh1Reception(state) {
      state.clues.visitorLog = true;
      ctx.refreshHUD();
      window.BS.Audio.select();
      window.BS.UI.startDialogue([
        {
          speaker: '1F 大門接待櫃台（登記簿）',
          speaker_en: '1F Main Reception Desk (Logbook)',
          portrait: 'reception',
          text: '【今日預約登記】\n來訪人員：陳先生（外校參訪來賓）｜時間：15:30\n核准活動範圍：1F 大門大廳形象牆拍照留念；若須上 2F 實驗區參觀拍照，須由值班人員全程陪同，且拍攝前須確認畫面無未遮蔽之研究資訊。',
          text_en: '[Today\'s Visitor Registry]\nVisitor: Mr. Chen (Academic Guest) | Time: 15:30\nApproved Scope: Commemorative photo at 1F Lobby Logo Wall; if visiting 2F lab, must be escorted continuously by duty staff with prior verification that no unshielded research info is in view.'
        }
      ]);
    }

    function handleCh1Visitor(state) {
      const v = state.visitor;

      if (v.status === 'done_entrance' || v.status === 'done_lab_clean' || v.status === 'done_lab_leaked') {
        window.BS.UI.startDialogue([
          {
            speaker: '訪客 陳先生',
            portrait: 'visitor',
            text: v.status === 'done_lab_leaked'
              ? '照片拍得很清楚，連後面螢幕跟白板都很有實驗室氣氛！謝謝你的招待，我準備回去整理報告了。'
              : '剛剛那張照片構圖很棒，謝謝你這麼細心引導！不打擾你們下班，我先離開囉。'
          }
        ]);
        return;
      }

      if (v.status === 'in_lab') {
        const exposed = window.BS.State.getExposedLabItems(state);
        window.BS.UI.startDialogue([
          {
            speaker: '訪客 陳先生',
            portrait: 'visitor',
            text: exposed.length > 0
              ? '我準備好隨時可以拍了，不過好像還有一些資料沒收好？要再看一下取景預覽，還是改回入口拍呢？'
              : '看你都整理得乾乾淨淨了！那我們現在來看看相機取景畫面、按下快門吧？',
            choices: [
              {
                label: '查看實驗區相機取景預覽',
                onSelect: () => launchCh1Camera(state, 'lab')
              },
              {
                label: '改帶陳先生回 1F 大門形象牆指定角度拍攝',
                onSelect: () => {
                  v.pausedAndFixed = true;
                  ctx.moveNpcTo('npc_visitor', 1, 7, 11, 'up');
                  ctx.transitionToFloor(1, 7, 12, 'up', () => launchCh1Camera(state, 'entrance'));
                }
              },
              { label: '再給我一分鐘整理現場', onSelect: () => {} }
            ]
          }
        ]);
        return;
      }

      const choices = [];
      if (!state.clues.visitorPurpose) {
        choices.push({
          label: '先問清楚拍照用途與預計公開範圍',
          onSelect: () => {
            state.clues.visitorPurpose = true;
            ctx.advanceTime(1);
            ctx.refreshHUD();
            window.BS.UI.startDialogue([
              {
                speaker: '訪客 陳先生',
                portrait: 'visitor',
                text: '喔，這張照片是要放進我們單位這次的參訪紀錄報告，報告之後會貼在系上網頁公開分享喔！'
              },
              {
                speaker: '小安',
                portrait: 'player',
                text: '（會公開放在網頁上！那更不能讓 2F 實驗區裡還沒收好的研究資料入鏡。）'
              }
            ], () => handleCh1Visitor(state));
          }
        });
      }

      choices.push({
        label: '引導在「1F 大廳形象牆指定角度」拍照（核准範圍）',
        onSelect: () => launchCh1Camera(state, 'entrance')
      });

      choices.push({
        label: '陪同上「2F 實驗區」查看取景畫面並拍攝',
        onSelect: () => {
          v.status = 'in_lab';
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.UI.startDialogue([
            {
              speaker: '小安',
              portrait: 'player',
              text: '好的，請您跟我一起搭電梯上 2F、刷卡進入實驗區，並請先讓我確認一下相機的取景預覽畫面。'
            }
          ], () => {
            ctx.moveNpcTo('npc_visitor', 2, 9, 5, 'up');
            ctx.transitionToFloor(2, 8, 5, 'right', () => launchCh1Camera(state, 'lab'));
          });
        }
      });

      choices.push({ label: '請陳先生在一樓櫃台稍等（先看登記簿或上樓巡視）', onSelect: () => {} });

      window.BS.UI.startDialogue([
        {
          speaker: '訪客 陳先生（1F 大門櫃台）',
          portrait: 'visitor',
          text: state.clues.visitorPurpose
            ? '照片會放進公開參訪報告裡。請問我們要在一樓大廳形象牆拍，還是可以上二樓實驗區拍一張呢？'
            : '你好！我是預約三點半參訪的陳先生，剛在一樓大門櫃台報到，想拍一張實驗室的照片當參訪紀錄，請問可以上二樓實驗區拍嗎？',
          choices
        }
      ]);
    }

    function launchCh1Camera(state, mode) {
      window.BS.UI.openCameraModal(state, mode, {
        onPauseToFix() {
          state.visitor.pausedAndFixed = true;
          state.visitor.status = 'in_lab';
          ctx.refreshHUD();
          window.BS.UI.startDialogue([
            {
              speaker: '小安',
              portrait: 'player',
              text: '陳先生不好意思，先暫停一下下！背景拍到正在進行中的研究資料，我先去把 2F 實驗區的白板、螢幕跟樣品標籤收妥，整理好馬上幫您拍！'
            },
            {
              speaker: '訪客 陳先生',
              portrait: 'visitor',
              text: '沒問題，保密最重要！我在 2F 實驗區門口這裡等您，整理好再叫我。'
            }
          ]);
        },

        onSwitchToEntrance() {
          state.visitor.pausedAndFixed = true;
          ctx.refreshHUD();
          window.BS.UI.startDialogue([
            {
              speaker: '小安',
              portrait: 'player',
              text: '陳先生，2F 實驗區裡面目前還有未收妥的研究資料，我們改回 1F 大廳的形象牆指定角度拍，光線跟招牌也更好看喔！'
            }
          ], () => {
            ctx.moveNpcTo('npc_visitor', 1, 7, 11, 'up');
            ctx.transitionToFloor(1, 7, 12, 'up', () => launchCh1Camera(state, 'entrance'));
          });
        },

        onShoot(shootMode, leakedItems) {
          ctx.advanceTime(3);
          if (shootMode === 'entrance') {
            state.visitor.status = 'done_entrance';
            state.visitor.photoSpot = '1F 大廳形象牆（核准角度）';
            state.visitor.leakedItems = [];
            ctx.moveNpcTo('npc_visitor', 1, 7, 11, 'up');
            ctx.refreshHUD();
            window.BS.Audio.success();
            window.BS.UI.startDialogue([
              {
                speaker: '訪客 陳先生',
                portrait: 'visitor',
                text: '喀嚓！這張 1F 大廳形象牆拍起來很專業耶，完全符合我們的參訪紀錄需求，謝謝你！'
              }
            ]);
          } else if (leakedItems.length === 0) {
            state.visitor.status = 'done_lab_clean';
            state.visitor.photoSpot = '2F 實驗區（全程陪同並完成清場）';
            state.visitor.leakedItems = [];
            ctx.moveNpcTo('npc_visitor', 1, 7, 11, 'up');
            ctx.refreshHUD();
            window.BS.Audio.success();
            window.BS.UI.startDialogue([
              {
                speaker: '訪客 陳先生',
                portrait: 'visitor',
                text: '喀嚓！畫面既看得出實驗室環境，又完全保護了研究機密。謝謝你細心陪同，我先搭電梯回 1F 大廳準備離開囉！'
              }
            ]);
          } else {
            state.visitor.status = 'done_lab_leaked';
            state.visitor.photoSpot = '2F 實驗區（未完成清場）';
            state.visitor.leakedItems = leakedItems.slice();
            ctx.moveNpcTo('npc_visitor', 1, 7, 11, 'up');
            ctx.refreshHUD();
            window.BS.Audio.alert();
            window.BS.UI.showToast(`⚠ 注意：照片已拍入「${leakedItems.join('、')}」！`, true, 4500);
            window.BS.UI.startDialogue([
              {
                speaker: '小安',
                portrait: 'player',
                text: `喀嚓……慘了，陳先生下樓離開了，但放大剛才的預覽，背景真的把「${leakedItems.join('、')}」都拍進去了……待會一定要記錄在交班並告訴阿明組長。`,
                text_en: `Snap... Oh no, Mr. Chen has headed downstairs and left, but zooming in on the preview, the background clearly captured "${leakedItems.map(item => item === '白板配方參數' ? 'Whiteboard Formula Parameters' : item === '螢幕原始數據' ? 'Screen Raw Measurements' : item === '樣品代碼標籤' ? 'Sample Batch Code Labels' : item).join(', ')}"... I must record this in the handover notes and notify Team Lead A-Ming.`
              }
            ]);
          }
        }
      });
    }

    function handleCh1DutyDesk(state) {
      if (state.handoverDone) {
        window.BS.UI.startDialogue([
          {
            speaker: '值班桌（交班紀錄簿）',
            portrait: 'desk',
            text: '第一章已經完成交班！要重新檢視交班紀錄，還是再玩一次嘗試不同路線呢？',
            choices: [
              {
                label: '🏆 重新檢視通關畫面與交班紀錄',
                onSelect: () => {
                  const result = window.BS.State.evaluateHandover(state);
                  window.BS.UI.openClearScreen(result, {
                    onReplay: () => ctx.restartChapter(),
                    onReturnMenu: () => ctx.returnToMenu(),
                    onStartChapter: (ch) => ctx.startChapter(ch)
                  });
                }
              },
              {
                label: '🔄 再玩一次第一章（挑戰其他結局）',
                onSelect: () => ctx.restartChapter()
              },
              {
                label: '🏠 返回章節選單',
                onSelect: () => ctx.returnToMenu()
              },
              { label: '先取消', onSelect: () => {} }
            ]
          }
        ]);
        return;
      }

      const ready = window.BS.State.canHandover(state);
      if (!ready) {
        const missing = [];
        if (state.email.status === 'unread' || state.email.status === 'read' || state.email.status === 'holding') {
          missing.push('合作方來信還沒完成分享');
        }
        if (!window.BS.State.isVisitorResolved(state)) {
          missing.push('訪客陳先生還在等候拍照');
        }
        window.BS.UI.startDialogue([
          {
            speaker: '值班桌（交班紀錄簿）',
            portrait: 'desk',
            text: `現在還不能交班下班喔！還有待處理事項：\n• ${missing.join('\n• ')}\n\n先完成這兩件事再回來填寫交班紀錄吧！（按下方 SELECT 鍵或 Tab 可隨時查看筆記與進度）`,
            text_en: `You cannot hand over and clock out yet! Remaining tasks:\n• ${missing.map(m => m === '合作方來信還沒完成分享' ? 'Partner email file sharing pending' : m === '訪客陳先生還在等候拍照' ? 'Visitor Mr. Chen waiting for photography' : m).join('\n• ')}\n\nComplete these two tasks before returning to fill out handover notes! (Press SELECT or Tab to review notes & progress anytime)`
          }
        ]);
        return;
      }

      const urgentPending = state.email.misshared && (!state.email.linkRevoked || !state.email.reportedToLead);

      window.BS.UI.startDialogue([
        {
          speaker: '值班桌（交班紀錄簿）',
          portrait: 'desk',
          text: urgentPending
            ? '⚠ 警告：合作方誤分享事件還沒完成停權與通報！確定現在就要直接交班下班嗎？'
            : '兩件值班任務都處理完畢了！要現在填寫交班紀錄、查看今日結果並下班嗎？',
          choices: [
            {
              label: urgentPending ? '不管了，直接交班下班（將觸發風險結局）' : '✍ 填寫交班紀錄並下班',
              onSelect: () => {
                state.handoverDone = true;
                state.timeMinutes = Math.max(state.timeMinutes, 16 * 60);
                ctx.refreshHUD();
                const result = window.BS.State.evaluateHandover(state);
                if (window.BS.Analytics) {
                  window.BS.Analytics.trackChapterComplete(state);
                }
                if (result.ending.id === 'alarm_handover') {
                  window.BS.Audio.alert();
                } else {
                  window.BS.Audio.fanfare();
                }
                window.BS.UI.openClearScreen(result, {
                  onReplay: () => ctx.restartChapter(),
                  onReturnMenu: () => ctx.returnToMenu(),
                  onStartChapter: (ch) => ctx.startChapter(ch)
                });
              }
            },
            {
              label: urgentPending ? '先回去把公開連結停權並通報阿明組長' : '再在實驗室繞一下',
              onSelect: () => {}
            }
          ]
        }
      ]);
    }

    // =========================================================================
    // CHAPTER 2: 投稿前一晚
    // =========================================================================
    function playCh2Intro() {
      window.BS.UI.startDialogue([
        {
          speaker: '同事 阿文（辦公區門口）',
          speaker_en: 'Colleague: A-Wen (Office Entrance)',
          portrait: 'colleague',
          text: '小安，太好了你還沒走！我正在趕明天研討會要用的海報。\n「我把上次合作會議的圖放進海報了。今晚要交，你可以幫我看一下嗎？」',
          text_en: 'Xiao-An, so glad you are still here! I am rushing tomorrow\'s symposium poster.\n"I included charts from our last partner meeting. Deadline is tonight—could you review it with me?"'
        },
        {
          speaker: '同事 阿文',
          speaker_en: 'Colleague: A-Wen',
          portrait: 'colleague',
          text: '海報草稿我已經存到辦公區電腦裡了。我先回實驗區整理手邊的圖檔，如果有圖片需要確認來源或換圖，再過來實驗區找我！',
          text_en: 'I saved the draft on the office PC. I will be in the lab organizing figures. If any figure needs source verification or replacement, come find me!'
        },
        {
          speaker: '小安',
          speaker_en: 'Xiao-An',
          portrait: 'player',
          text: '晚上六點了，公開研討會海報可不能馬虎。先去辦公區電腦看看草稿有三張什麼圖，也可以找實驗區的阿文和辦公區的阿明組長確認！',
          text_en: 'It\'s 6:00 PM. A public symposium poster must be handled rigorously. Check the 3 draft figures at the office PC, and consult A-Wen and Team Lead A-Ming!'
        }
      ], () => {
        // Move 阿文 back to his 2F Lab bench so player walks to 2F 實驗區的阿文 for clues
        ctx.moveNpcTo('npc_colleague', 2, 10, 4, 'left');
        ctx.refreshHUD();
      });
    }

    function interactCh2(state, target) {
      switch (target.id) {
        case 'pc':
          handleCh2Computer(state);
          break;
        case 'duty_desk':
          handleCh2DutyDesk(state);
          break;
        case 'npc_lead':
          handleCh2Lead(state);
          break;
        case 'npc_colleague':
          handleCh2Colleague(state);
          break;
        case 'whiteboard':
          window.BS.UI.startDialogue([
            {
              speaker: '實驗白板',
              portrait: 'whiteboard',
              text: '今晚的白板已經擦乾淨了。目前最重要的是確認辦公區電腦裡那份研討會海報草稿，別把不該公開的圖片交出去！'
            }
          ]);
          break;
        case 'monitor':
          window.BS.UI.startDialogue([
            {
              speaker: '實驗室螢幕',
              portrait: 'monitor',
              text: '實驗室的量測電腦處於待機鎖定狀態。海報草稿檔案放在辦公區的電腦上，阿文人也在實驗區旁邊。'
            }
          ]);
          break;
        case 'samples':
          window.BS.UI.startDialogue([
            {
              speaker: '樣品保管箱',
              portrait: 'samples',
              text: '樣品都已經收進不透明保管箱了。今晚的任務重點是審閱研討會海報草稿（辦公區電腦）、找阿文與阿明組長核對。'
            }
          ]);
          break;
        case 'reception':
          window.BS.UI.startDialogue([
            {
              speaker: '訪客接待處',
              portrait: 'reception',
              text: '晚上六點已過訪客時段，今日沒有外部訪客。回辦公區與實驗區處理研討會海報投稿吧！'
            }
          ]);
          break;
      }
    }

    function handleCh2Computer(state) {
      const c = state.ch2;
      if (!c.openedPoster) {
        c.openedPoster = true;
        ctx.advanceTime(2);
        ctx.refreshHUD();
      }

      window.BS.UI.openPosterModal(state, {
        onEditPoster(patch) {
          const prevCount = c.versions.length;
          const ver = window.BS.State.applyPosterEdit(state, patch);
          ctx.advanceTime(1);
          ctx.refreshHUD();
          if (ver.status === 'needs_reapproval' && c.versions.length > prevCount) {
            window.BS.UI.showToast(`⚠ 已建立新版本 ${ver.filename}（待重新確認），原核准版紀錄已保留！`, false, 4000);
          }
          return ver;
        },

        onSendForReview() {
          const res = window.BS.State.submitWorkingForReview(state);
          ctx.refreshHUD();
          return res;
        },

        onAfterSendForReview(ver) {
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.UI.startDialogue([
            {
              speaker: '辦公區電腦',
              portrait: 'poster',
              text: `已將「${ver.filename}」送出給阿明組長審閱！\n（圖一：設備配置示意保留／圖二：已替換為替代圖／圖三：已移除）`,
              text_en: `Submitted "${ver.filename}" to Team Lead A-Ming for review!\n(Fig 1: Equipment Layout retained / Fig 2: Replaced with alternative / Fig 3: Removed)`
            },
            {
              speaker: '小安',
              portrait: 'player',
              text: '現在走過去找辦公區的阿明組長，請他正式確認核准這個版本吧！',
              text_en: 'Now head over to Team Lead A-Ming in the office area to request his formal approval for this version!'
            }
          ]);
        },

        onDeferSubmission() {
          const wv = window.BS.State.getWorkingVersion(state);
          const reasons = [];
          if (wv.slots.fig2 === 'orig') {
            reasons.push(
              c.clues.wenExplainedFig2
                ? '圖二「合作方量測圖」（曾用於合作會議，是否可用於公開海報尚待確認）'
                : '圖二「合作方量測圖」（來源與公開授權尚待確認）'
            );
          }
          if (wv.slots.fig3 === 'orig') {
            reasons.push('圖三「測試條件與結果摘要」（涉及尚待確認的專利申請安排與公開時點）');
          }
          if (reasons.length === 0) {
            reasons.push('目前海報版本尚未取得阿明組長正式確認核准，決定先暫緩上傳');
          }
          c.deferredReasons = reasons;
          c.deferredNextStep =
            '與阿文及阿明組長確認合作約定公開條款與專利申請安排，改用核准圖檔並完成正式版本核准後再提交。';
          c.outcome = 'deferred';
          ctx.advanceTime(3);
          ctx.refreshHUD();
          window.BS.Audio.success();
          window.BS.UI.startDialogue([
            {
              speaker: '辦公區電腦',
              portrait: 'poster',
              text: `已選擇「暫緩上傳」並留存紀錄。\n待確認項目：\n• ${reasons.join('\n• ')}`,
              text_en: `Selected "Defer Submission" and saved records.\nPending confirmation items:\n• ${reasons.map(r => r.includes('圖二') ? 'Figure 2 Partner Data (usage on public poster unconfirmed)' : r.includes('圖三') ? 'Figure 3 Test Conditions & Results (patent filing timing unconfirmed)' : 'Current poster version not yet formally approved by Team Lead A-Ming').join('\n• ')}`
            },
            {
              speaker: '小安',
              portrait: 'player',
              text: '在還沒確認清楚公開授權跟專利安排之前，先暫緩投稿比較穩妥。回值班桌把原因與下一步寫進交班紀錄吧！',
              text_en: 'Deferring submission is safer until public authorizations and patent arrangements are settled. Head to the duty desk to write the reasons and next steps into the handover notes!'
            }
          ]);
        },

        onSubmitVersion(verId) {
          const ver = window.BS.State.getVersionById(state, verId);
          if (!ver) return;
          ctx.advanceTime(4);
          c.submittedVersionId = ver.id;
          c.submittedFilename = ver.filename;
          c.submittedTimeStr = window.BS.State.formatClock(state.timeMinutes);

          if (ver.status === 'approved') {
            c.outcome = 'submitted_approved';
            ctx.refreshHUD();
            window.BS.Audio.success();
            window.BS.UI.startDialogue([
              {
                speaker: '研討會投稿系統（模擬）',
                portrait: 'poster',
                text: `✅ 上傳成功！已提交「${ver.filename}」（核准狀態：阿明組長於 ${ver.approvedAt} 確認核准）。\n系統已回傳收件編號與版本雜湊紀錄。`,
                text_en: `✅ Upload successful! Submitted "${ver.filename}" (Approval status: Approved by Team Lead A-Ming at ${ver.approvedAt}).\nSystem returned receipt ID and version hash record.`
              },
              {
                speaker: '小安',
                portrait: 'player',
                text: '核對過檔名與核准狀態再按送出，心裡踏實多了！去值班桌填寫交班紀錄就能安心下班囉。',
                text_en: 'Verifying the filename and approval status before sending gives great peace of mind! Head to the duty desk to complete the handover notes and clock out.'
              }
            ]);
          } else {
            // Mis-upload old or unapproved version!
            c.outcome = 'misuploaded';
            c.misuploaded = true;
            c.misuploadTimeStr = c.submittedTimeStr;
            ctx.refreshHUD();
            window.BS.Audio.alert();
            const meta = window.BS.State.getVersionStatusMeta(ver.status).text;
            window.BS.UI.showToast(`🚨 糟糕！誤傳了未核准檔案「${ver.filename}」！請立刻補救！`, true, 5000);
            window.BS.UI.startDialogue([
              {
                speaker: '研討會投稿系統（上傳回執）',
                portrait: 'alert',
                text: `⚠ 上傳完成回執顯示你提交的是「${ver.filename}」（狀態：${meta}）！\n內容摘要：${ver.summary}`,
                text_en: `⚠ Upload receipt indicates you submitted "${ver.filename}" (Status: ${ver.status === 'approved' ? 'Approved' : 'Unapproved Draft'})!\nSummary: ${ver.id === 'v1' ? 'Original draft: Fig 2 partner data and Fig 3 patent data included.' : 'Unapproved draft version.'}`
              },
              {
                speaker: '小安',
                portrait: 'player',
                text: '糟了！！不小心選成還沒核准的版本上傳給主辦方了！\n現在馬上回電腦聯絡研討會主辦方提出撤換請求，並且立刻找辦公區的阿明組長回報！',
                text_en: 'Oh no!! I mistakenly picked an unapproved version to upload to the organizer!\nI must immediately return to the PC to submit a retraction request, and report to Team Lead A-Ming in the office!'
              }
            ]);
          }
        },

        onContactOrganizer() {
          c.contactedOrganizer = true;
          c.contactedOrganizerTimeStr = window.BS.State.formatClock(state.timeMinutes);
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.Audio.success();
          window.BS.UI.showToast('📨 已向主辦方提出撤換請求，公開狀態待確認！', false, 4200);
        }
      });
    }

    function handleCh2Colleague(state) {
      const c = state.ch2;

      if (!c.clues.wenExplainedFig2) {
        window.BS.UI.startDialogue([
          {
            speaker: '同事 阿文',
            portrait: 'colleague',
            text: '小安，你看到海報草稿裡的圖二「合作方量測圖」了嗎？老實說，那張圖原本是上次跟星海科技開合作進度會議時用的比較圖。'
          },
          {
            speaker: '同事 阿文',
            portrait: 'colleague',
            text: '我剛剛越想越不對勁——合作會議能看，不代表能直接放到對外公開的研討會海報上！'
          },
          {
            speaker: '同事 阿文',
            portrait: 'colleague',
            text: '所以我趕快另外畫了一張不含合作方數據的「自研校準趨勢示意圖（替代圖）」，已經同步放到辦公區電腦的圖庫裡了！你現在回電腦就能替換圖二。'
          },
          {
            speaker: '同事 阿文',
            portrait: 'colleague',
            text: '不過這張替代圖還是要連同整份海報一起給阿明組長確認喔！另外圖三「測試條件與結果摘要」好像牽涉到專利申請，建議你順便問一下辦公區的阿明組長！'
          }
        ], () => {
          c.clues.wenExplainedFig2 = true;
          c.clues.hasReplacementFig2 = true;
          ctx.advanceTime(3);
          ctx.refreshHUD();
          window.BS.Audio.success();
          window.BS.UI.showToast('✅ 已掌握圖二來源（合作會議用），並於電腦解鎖「替換替代圖」！', false, 4000);
        });
        return;
      }

      const wv = window.BS.State.getWorkingVersion(state);
      let tip = '替代圖已經放進辦公區電腦了！換完圖二、也確認好圖三怎麼處理後，記得送交辦公區的阿明組長確認版本喔。';
      if (c.misuploaded) {
        tip = '聽說不小心傳錯舊版了！別緊張，先在電腦聯絡主辦方申請撤換，再趕快跟阿明組長回報，我們一起追蹤處理。';
      } else if (c.outcome === 'submitted_approved') {
        tip = '太感謝你幫忙把關了！核准版送出後，記得回值班桌寫一下交班紀錄就可以下班囉。';
      } else if (c.outcome === 'deferred') {
        tip = '先暫緩投稿也完全沒問題，安全第一！明天我們再一起把合作約定和專利時程確認清楚。';
      } else if (wv.slots.fig2 === 'alt' && wv.slots.fig3 === 'removed') {
        tip = '我看你已經把圖二換成替代圖、圖三也移除了！接下來把這個版本送審給阿明組長確認，提交時記得核對檔名喔。';
      }

      window.BS.UI.startDialogue([
        {
          speaker: '同事 阿文',
          portrait: 'colleague',
          text: tip
        }
      ]);
    }

    function handleCh2Lead(state) {
      const c = state.ch2;
      const choices = [];

      // Priority 1: Mis-upload Report
      if (c.misuploaded && !c.reportedToLead) {
        choices.push({
          label: `🚨 回報：不小心將未核准海報（${c.submittedFilename}）上傳給主辦方了！`,
          label_en: `🚨 Report: Accidentally uploaded unapproved poster (${c.submittedFilename}) to symposium organizer!`,
          onSelect: () => {
            c.reportedToLead = true;
            ctx.advanceTime(3);
            ctx.refreshHUD();
            window.BS.Audio.success();
            window.BS.UI.startDialogue([
              {
                speaker: '小安',
                portrait: 'player',
                text: `阿明組長，對不起！我剛才在 ${c.misuploadTimeStr || '18:15'} 上傳海報時，誤傳了未確認的「${c.submittedFilename}」。${
                  c.contactedOrganizer
                    ? '我已經立刻在電腦聯絡研討會主辦方提出撤換請求，目前顯示「公開狀態待確認」。'
                    : '我還沒聯絡主辦方，馬上來跟您回報！'
                }`,
                text_en: `Team Lead A-Ming, I am so sorry! At around ${c.misuploadTimeStr || '18:15'} while uploading the poster, I mistakenly submitted the unapproved file "${c.submittedFilename}". ${
                  c.contactedOrganizer
                    ? 'I immediately contacted the symposium organizer via the PC to request a retraction; it currently shows "Public status pending confirmation".'
                    : 'I have not contacted the organizer yet, and came straight to report to you!'
                }`
              },
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: c.contactedOrganizer
                  ? '你第一時間提出撤換又立刻回報，處置非常正確！在主辦方正式確認下架或替換之前，交班紀錄務必維持「公開狀態待確認」，我明天一早也會親自盯緊主辦方回覆。'
                  : '感謝你馬上來講！請立刻回辦公區電腦聯絡主辦方提出撤換請求，把「已提出撤換請求，公開狀態待確認」記進交班紀錄，我這邊同步啟動追蹤！',
                text_en: c.contactedOrganizer
                  ? 'Requesting retraction immediately and reporting without delay was absolutely the right move! Until the organizer formally confirms takedown or replacement, keep the handover notes as "Public status pending confirmation"; I will personally follow up with the organizer first thing tomorrow morning.'
                  : 'Thank you for coming to tell me immediately! Please go right back to the office PC to submit a retraction request to the organizer, document "Retraction requested, public status pending confirmation" in the handover notes, and I will initiate incident tracking on my end!'
              }
            ]);
          }
        });
      }

      // Priority 2: Approve Pending Review Version
      if (c.pendingReviewVersionId) {
        const pendingVer = window.BS.State.getVersionById(state, c.pendingReviewVersionId);
        if (pendingVer) {
          choices.push({
            label: `✅ 請阿明組長確認剛送審的海報版本（${pendingVer.filename}）`,
            label_en: `✅ Ask Team Lead A-Ming to approve submitted poster version (${pendingVer.filename})`,
            onSelect: () => {
              const approved = window.BS.State.approvePendingVersion(state);
              c.clues.mingExplainedRules = true;
              c.clues.mingExplainedVersion = true;
              ctx.advanceTime(3);
              ctx.refreshHUD();
              window.BS.Audio.success();
              window.BS.UI.startDialogue([
                {
                  speaker: '負責人 阿明組長',
                  portrait: 'lead',
                  text: `我檢視過了：\n• 圖一「設備配置示意」：已確認可公開。\n• 圖二：已替換為阿文的自研校準趨勢示意圖，不含合作方機密數據。\n• 圖三「測試條件與結果摘要」：已從本次公開版移除。`,
                  text_en: `I have reviewed it:\n• Figure 1 "Equipment Layout": Confirmed safe for public release.\n• Figure 2: Replaced with A-Wen's alternative calibration trend chart, free of partner confidential data.\n• Figure 3 "Test Conditions & Result Summary": Excluded from this public release.`
                },
                {
                  speaker: '負責人 阿明組長',
                  portrait: 'lead',
                  text: `沒問題！我正式核准「${approved.filename}」。\n記住兩件事：第一，核准只綁定這個版本，之後若又再編輯會變成待重新確認的新版；第二，回電腦上傳時務必核對檔名，別不小心挑到舊的 v1 草稿喔！`,
                  text_en: `Looks good! I formally approve "${approved.filename}".\nRemember two things: First, approval is bound strictly to this version; any further edits will generate a new unapproved draft. Second, when uploading at the PC, carefully verify the filename—don't accidentally pick the old v1 draft!`
                }
              ]);
            }
          });
        }
      }

      // Standard Clue Questions
      choices.push({
        label: '現在哪張圖能用？',
        label_en: 'Which figures are safe to use right now?',
        onSelect: () => {
          c.clues.mingExplainedRules = true;
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.Audio.select();
          window.BS.UI.startDialogue([
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '我逐張跟你說明喔：\n① 圖一「設備配置示意」：已經確認可以公開，直接保留沒問題。\n② 圖二「合作方量測圖」：那上次是合作會議用的，還沒確認合作約定是否涵蓋公開海報，不能直接放上去！你可以找實驗區的阿文拿可送審的替代圖。',
              text_en: 'Let me explain each figure:\n① Figure 1 "Equipment Layout": Confirmed safe for public release; keeping it as-is is fine.\n② Figure 2 "Partner Measurement Chart": Used in a previous partner meeting; we have not confirmed if the agreement allows public symposium use, so it cannot be published directly! Ask A-Wen in the lab for an alternative chart.'
            },
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '③ 圖三「測試條件與結果摘要」：涉及尚待確認的專利申請安排，如果太早公開可能影響專利新穎性。今晚公開時點還沒辦法確定，你可以先把它從這次公開版本移除；或者若認為資訊不足，也可以選擇暫緩投稿。',
              text_en: '③ Figure 3 "Test Conditions & Result Summary": Involves pending patent application arrangements; disclosing too early could jeopardize patent novelty. Since public timing cannot be settled tonight, remove it from this release, or defer submission if information is insufficient.'
            }
          ]);
        }
      });

      choices.push({
        label: '整理好之後怎麼確認版本？',
        label_en: 'How do we verify and approve versions once assembled?',
        onSelect: () => {
          c.clues.mingExplainedVersion = true;
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.Audio.select();
          window.BS.UI.startDialogue([
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '你在辦公區電腦把圖二替換、圖三移除後，點「送交阿明組長確認」，再過來找我核准。',
              text_en: 'At the office PC, after replacing Fig 2 and removing Fig 3, click "Submit to Team Lead A-Ming for Confirmation", then come to me for approval.'
            },
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '特別注意：我的核准只綁定當時送審的那個版本。核准後如果又改動海報，系統會產生「待重新確認」的新版本，必須重新送審。最後上傳檔案時，也要仔細核對檔名與核准狀態，別誤傳成原始草稿！',
              text_en: 'Crucial note: My approval is tied only to the version submitted at that moment. Editing the poster after approval creates a new version requiring re-approval. When uploading, double-check filename and approval status so you never submit the raw draft!'
            }
          ]);
        }
      });

      choices.push({ label: '先回電腦處理海報', label_en: 'Return to PC to edit poster first', onSelect: () => {} });

      window.BS.UI.startDialogue([
        {
          speaker: '負責人 阿明組長',
          portrait: 'lead',
          text: c.misuploaded && c.reportedToLead
            ? '誤傳事件我已經記下來追蹤了。記得確認主辦方撤換請求送出，再回值班桌寫交班紀錄喔。'
            : '小安，聽阿文說今晚要交研討會海報。對外公開前一定要確認兩件事：合作資料是否授權公開，以及有沒有卡到專利申請安排！',
          text_en: c.misuploaded && c.reportedToLead
            ? 'The mis-upload incident is logged for tracking. Ensure the organizer retraction request is submitted, then return to the duty desk for handover notes.'
            : 'Xiao-An, A-Wen mentioned the symposium poster is due tonight. Before public release, verify two critical things: whether partner data is authorized for public disclosure, and whether patent application schedules are affected!',
          choices
        }
      ]);
    }

    function handleCh2DutyDesk(state) {
      const c = state.ch2;

      if (state.handoverDone) {
        window.BS.UI.startDialogue([
          {
            speaker: '值班桌（交班紀錄簿）',
            portrait: 'desk',
            text: '第二章已經完成交班！要重新檢視交班紀錄，還是再試一次其他路線呢？',
            choices: [
              {
                label: '🏆 重新檢視通關畫面與交班紀錄',
                onSelect: () => {
                  const result = window.BS.State.evaluateChapter2Handover(state);
                  window.BS.UI.openClearScreen(result, {
                    onReplay: () => ctx.restartChapter(),
                    onReturnMenu: () => ctx.returnToMenu(),
                    onStartChapter: (ch) => ctx.startChapter(ch)
                  });
                }
              },
              {
                label: '🔄 再玩一次第二章',
                onSelect: () => ctx.restartChapter()
              },
              {
                label: '🏠 返回章節選單',
                onSelect: () => ctx.returnToMenu()
              },
              { label: '先取消', onSelect: () => {} }
            ]
          }
        ]);
        return;
      }

      if (c.outcome === 'in_progress') {
        window.BS.UI.startDialogue([
          {
            speaker: '值班桌（交班紀錄簿）',
            portrait: 'desk',
            text: '研討會海報還沒做出決定喔！\n請先到辦公區電腦檢視海報草稿，並向實驗區的阿文與辦公區的阿明組長確認後，再決定「核准後提交」或「暫緩上傳」。',
            text_en: 'A decision on the symposium poster has not been reached!\nPlease inspect the draft at the office PC, verify with A-Wen in the lab and Team Lead A-Ming in the office, and then choose "Submit Approved Version" or "Defer Submission".'
          }
        ]);
        return;
      }

      const unfinishedRemedy = c.misuploaded && (!c.contactedOrganizer || !c.reportedToLead);

      window.BS.UI.startDialogue([
        {
          speaker: '值班桌（交班紀錄簿）',
          portrait: 'desk',
          text: unfinishedRemedy
            ? '⚠ 注意：誤傳舊版海報的補救步驟還沒全部完成（聯絡主辦方／回報阿明組長）！確定現在就先填寫交班紀錄嗎？'
            : '海報投稿事項已處理告一段落。要現在填寫第二章交班紀錄嗎？',
          text_en: unfinishedRemedy
            ? '⚠ Warning: Remediation steps for mis-uploading the old poster are incomplete (contact organizer / report to Lead A-Ming)! Are you sure you want to fill out handover notes now?'
            : 'Symposium poster submission tasks are wrapped up. Do you want to fill out Chapter 2 handover notes now?',
          choices: [
            {
              label: unfinishedRemedy ? '✍ 仍先填寫交班紀錄（列出尚待處理事項）' : '✍ 填寫交班紀錄並檢視結果',
              onSelect: () => {
                state.handoverDone = true;
                state.timeMinutes = Math.max(state.timeMinutes, 18 * 60 + 25);
                ctx.refreshHUD();
                const result = window.BS.State.evaluateChapter2Handover(state);
                if (window.BS.Analytics) {
                  window.BS.Analytics.trackChapterComplete(state);
                }
                if (unfinishedRemedy) {
                  window.BS.Audio.alert();
                } else {
                  window.BS.Audio.fanfare();
                }
                window.BS.UI.openClearScreen(result, {
                  onReplay: () => ctx.restartChapter(),
                  onReturnMenu: () => ctx.returnToMenu(),
                  onStartChapter: (ch) => ctx.startChapter(ch)
                });
              }
            },
            {
              label: unfinishedRemedy ? '先回去補救（電腦聯絡主辦方／找阿明組長）' : '再在實驗室走走',
              onSelect: () => {}
            }
          ]
        }
      ]);
    }

    // =========================================================================
    // CHAPTER 4 (Internal 3): 阿文的最後一天
    // =========================================================================
    function playCh3Intro() {
      window.BS.UI.startDialogue([
        {
          speaker: '同事 阿文（2F 辦公區旁）',
          speaker_en: 'Colleague: A-Wen (2F Office)',
          portrait: 'colleague',
          text: '下午五點了，今天就是我在實驗室的最後一天。\n「上次那批資料已經有清冊，我們從那裡找。我把交接清單放在電腦裡了。對了，下個月改論文還要用之前開會那兩張圖。我原本的資料夾權限可以先留著嗎？」',
          text_en: '5:00 PM. Today is my last day in the lab.\n"The previous records are already inventoried; we can check there. I left the handover checklist on the PC. By the way, I need 2 figures to revise my thesis next month. Can I keep my folder access?"'
        },
        {
          speaker: '同事 阿文',
          speaker_en: 'Colleague: A-Wen',
          portrait: 'colleague',
          text: '我先回 2F 實驗區整理個人工作區。接手我研究的小晴也在 2F 實驗區，阿明組長跟門禁回收櫃台都在 1F 大廳喔！',
          text_en: 'I will tidy my desk in 2F lab. Xiao-Qing (taking over my project) is also in 2F lab. Team Lead A-Ming and the badge desk are in 1F lobby!'
        },
        {
          speaker: '小安',
          speaker_en: 'Xiao-An',
          portrait: 'player',
          text: '離職交接可不能漏掉任何一步！先看看 2F 值班電腦的交接清單與存取預覽，或是先問 2F 的阿文與小晴、下樓找 1F 阿明組長與大門櫃台都可以！',
          text_en: 'Offboarding requires rigorous execution! Review the handover checklist and access preview on 2F PC, or consult A-Wen, Xiao-Qing, and Team Lead A-Ming!'
        }
      ], () => {
        ctx.moveNpcTo('npc_colleague', 2, 10, 4, 'left');
        ctx.refreshHUD();
      });
    }

    function interactCh3(state, target) {
      switch (target.id) {
        case 'pc':
          handleCh3Computer(state);
          break;
        case 'duty_desk':
          handleCh3DutyDesk(state);
          break;
        case 'npc_colleague':
          handleCh3Colleague(state);
          break;
        case 'npc_qing':
          handleCh3Qing(state);
          break;
        case 'npc_lead':
          handleCh3Lead(state);
          break;
        case 'monitor':
          handleCh3LabTerminal(state);
          break;
        case 'reception':
          handleCh3Reception(state);
          break;
        case 'whiteboard':
          window.BS.UI.startDialogue([
            {
              speaker: '實驗白板',
              portrait: 'whiteboard',
              text: '白板已經整理乾淨。今天重點是把阿文個人區裡的原始量測紀錄移交給小晴，並完成 1F 門禁收回與權限終止！'
            }
          ]);
          break;
        case 'samples':
          window.BS.UI.startDialogue([
            {
              speaker: '樣品保管箱',
              portrait: 'samples',
              text: '阿文已經把實體樣品清點收進樣品盒交給小晴了。接下來要確認電子原始紀錄的移交、存取權限與 1F 門禁卡回收！'
            }
          ]);
          break;
      }
    }

    function handleCh3Computer(state) {
      const c = state.ch3;
      if (!c.openedChecklist) {
        c.openedChecklist = true;
        ctx.advanceTime(2);
        ctx.refreshHUD();
      }

      window.BS.UI.openOffboardModal(state, {
        onGrantQing() {
          c.qingHasProjectAccess = true;
          ctx.advanceTime(2);
          ctx.refreshHUD();
        },
        onGrantAwenPaper() {
          c.awenPaperGrant = true;
          ctx.advanceTime(2);
          ctx.refreshHUD();
        },
        onRevokeAwenOrig() {
          const early = c.rawLogLocation !== 'project';
          c.awenOrigAccess = 'revoked';
          if (early) {
            c.interruptedByEarlyRevoke = true;
            window.BS.UI.showToast('⚠ 原始紀錄尚未移交就停權了！可找 2F 小晴確認，再下樓請 1F 阿明組長安排管理員移交！', true, 5200);
          }
          ctx.advanceTime(2);
          ctx.refreshHUD();
          return early;
        },
        onKeepAwenOrig() {
          c.awenOrigAccess = 'kept_explicit';
          c.everKeptExplicit = true;
          ctx.advanceTime(1);
          ctx.refreshHUD();
          window.BS.UI.showToast('⚠ 已暫時保留阿文原權限！請看「阿文視角」確認是否授權過廣。', true, 4200);
        }
      });
    }

    function handleCh3Colleague(state) {
      const c = state.ch3;
      c.clues.talkedToWen = true;
      ctx.refreshHUD();

      const choices = [];

      // 1. Transfer Raw Log
      if (c.rawLogLocation !== 'project') {
        choices.push({
          label: `請阿文將原始量測紀錄（${c.rawLogName}）移交至專案指定位置`,
          label_en: `Ask A-Wen to transfer raw measurement log (${c.rawLogName}) to project folder`,
          onSelect: () => {
            if (c.awenOrigAccess === 'revoked') {
              window.BS.Audio.alert();
              window.BS.UI.startDialogue([
                {
                  speaker: '同事 阿文',
                  portrait: 'colleague',
                  text: `咦？我剛剛點開個人工作區（${c.rawLogOrigPath}），系統顯示我的原帳號已經被停權登不進去了！`,
                  text_en: `Wait, I just opened my personal workspace (${c.rawLogOrigPath}), and the system says my account has already been revoked and I cannot log in!`
                },
                {
                  speaker: '同事 阿文',
                  portrait: 'colleague',
                  text: '沒關係，千萬別把我的整包原權限重開！你下樓找 1F 的阿明組長，請他由管理員協助單獨移交這一份指定紀錄給小晴就好！',
                  text_en: 'No worries, please do NOT reopen my entire project permissions! Go downstairs to Team Lead A-Ming on 1F and ask him to have an admin transfer this single specified log to Xiao-Qing!'
                }
              ]);
            } else {
              c.rawLogLocation = 'project';
              c.transferredBy = 'awen';
              ctx.advanceTime(3);
              ctx.refreshHUD();
              window.BS.Audio.success();
              window.BS.UI.showToast('✅ 阿文已將原始紀錄移交至專案指定位置！', false, 3600);
              window.BS.UI.startDialogue([
                {
                  speaker: '同事 阿文',
                  portrait: 'colleague',
                  text: `沒問題！我已經把原本存在我個人工作區的「${c.rawLogName}」，完整移交到專案指定位置（${c.rawLogTargetPath}）了。`,
                  text_en: `Done! I have fully transferred "${c.rawLogName}" from my personal workspace to the designated project location (${c.rawLogTargetPath}).`
                },
                {
                  speaker: '同事 阿文',
                  portrait: 'colleague',
                  text: '記得在 2F 值班電腦確認小晴的存取權限，再請旁邊的小晴實際打開確認能不能讀取喔！',
                  text_en: 'Remember to confirm Xiao-Qing\'s access permissions at the 2F duty PC, and ask Xiao-Qing here to personally test opening the file!'
                }
              ]);
            }
          }
        });
      }

      // 2. Remind Post-Departure NDA Obligations
      if (!c.ndaRemindedToAwen) {
        choices.push({
          label: '確認保密約定，並提醒阿文離開後的保密義務與資料攜出限制',
          onSelect: () => {
            c.ndaRemindedToAwen = true;
            ctx.advanceTime(2);
            ctx.refreshHUD();
            window.BS.Audio.success();
            window.BS.UI.showToast('✅ 已記錄：完成阿文離職保密義務提醒！', false, 3400);
            window.BS.UI.startDialogue([
              {
                speaker: '小安',
                portrait: 'player',
                text: '阿文，離職前跟你再次確認一下：我們簽署的保密約定在離開實驗室後依然有效，未經核准的研究資料、原始數據跟製程筆記都不能自行備份攜出；下個月改論文也只限在核准的兩張圖與期限內使用喔！'
              },
              {
                speaker: '同事 阿文',
                portrait: 'colleague',
                text: '瞭解，我完全同意也會確實遵守！個人電腦跟隨身碟我都已經清查過、沒有留存實驗室機密檔案，交接清單可以放心幫我打勾。'
              }
            ]);
          }
        });
      }

      // 3. Collect Physical Access Badge
      if (!c.badgeReturned && !c.awenGaveBadge) {
        choices.push({
          label: '請阿文先交出實驗室實體門禁卡（準備拿到 1F 櫃台收回登記）',
          onSelect: () => {
            c.awenGaveBadge = true;
            ctx.advanceTime(1);
            ctx.refreshHUD();
            window.BS.Audio.confirm();
            window.BS.UI.showToast('🪪 已取得阿文門禁卡！請下樓至 1F 大門接待櫃台完成收回登記。', false, 4000);
            window.BS.UI.startDialogue([
              {
                speaker: '同事 阿文',
                portrait: 'colleague',
                text: '給妳，這是我的門禁卡！麻煩拿到 1F 大門接待櫃台幫我辦理收回登記喔。'
              }
            ]);
          }
        });
      }

      choices.push({ label: '先處理其他交接項目', onSelect: () => {} });

      let introMsg = `小安，我有一份原始量測紀錄「${c.rawLogName}」目前還在我的個人工作區（${c.rawLogOrigPath}），還沒移到專案資料夾。`;
      let introMsgEn = `Xiao-An, I have a raw measurement log "${c.rawLogName}" currently still in my personal workspace (${c.rawLogOrigPath}), not yet moved to the project folder.`;
      if (c.rawLogLocation === 'project') {
        introMsg = '原始量測紀錄已經放進專案指定位置了！還有門禁卡、保密義務提醒或權限設定要跟我確認的嗎？';
        introMsgEn = 'The raw measurement log has been moved to the project destination! Are there any access badges, confidentiality obligations, or permissions you need to confirm with me?';
      }

      window.BS.UI.startDialogue([
        {
          speaker: '同事 阿文（2F 實驗區）',
          portrait: 'colleague',
          text: introMsg,
          text_en: introMsgEn,
          choices
        }
      ]);
    }

    function handleCh3Qing(state) {
      const c = state.ch3;
      c.clues.talkedToQing = true;
      ctx.refreshHUD();

      if (c.qingConfirmedOpen) {
        window.BS.UI.startDialogue([
          {
            speaker: '接手同事 小晴（2F 實驗區）',
            portrait: 'qing',
            text: `我剛剛已經確認「${c.rawLogName}」在專案資料夾可以正常開啟，交接清單的接收人確認也勾好了！剩下的權限終止、1F 門禁收回跟保密提醒就交給妳囉。`,
            text_en: `I just confirmed that "${c.rawLogName}" can be opened normally in the project folder, and the recipient confirmation on the handover checklist is checked! The rest of the permission revocations, 1F badge return, and confidentiality reminder are up to you.`
          }
        ]);
        return;
      }

      // Case A: File NOT transferred yet
      if (c.rawLogLocation !== 'project') {
        if (c.awenOrigAccess === 'revoked') {
          window.BS.Audio.alert();
          window.BS.UI.startDialogue([
            {
              speaker: '接手同事 小晴（2F 實驗區）',
              portrait: 'qing',
              text: `小安！我接手星空計畫最需要「${c.rawLogName}」這份原始量測紀錄，但專案指定位置（${c.rawLogTargetPath}）裡是空的！`,
              text_en: `Xiao-An! To take over Project StarSky, I urgently need the raw measurement log "${c.rawLogName}", but the project destination (${c.rawLogTargetPath}) is empty!`
            },
            {
              speaker: '接手同事 小晴',
              portrait: 'qing',
              text: '剛剛聽阿文說他的原權限已經先被終止了，他自己也登不進去拿……快下樓找 1F 的阿明組長，請求由管理員協助單獨移交那一份紀錄吧！（不用恢復阿文整包權限喔！）',
              text_en: "I just heard from A-Wen that his original permissions were already terminated, so he can't log in to retrieve it either... Head downstairs to find Team Lead A-Ming on 1F, and request an administrator-assisted transfer of that specific record! (No need to restore A-Wen's entire project access!)"
            }
          ]);
        } else {
          window.BS.UI.startDialogue([
            {
              speaker: '接手同事 小晴（2F 實驗區）',
              portrait: 'qing',
              text: `嗨小安！我接手阿文的星空計畫，最關鍵的是要確認能找到並開啟「${c.rawLogName}」這份原始量測紀錄。`,
              text_en: `Hi Xiao-An! In taking over Project StarSky from A-Wen, the most critical step is confirming we can find and open the raw measurement log "${c.rawLogName}".`
            },
            {
              speaker: '接手同事 小晴',
              portrait: 'qing',
              text: `我剛去專案資料夾（${c.rawLogTargetPath}）看過，目前還沒看到檔案，應該還在阿文的個人工作區！麻煩先請旁邊的阿文移交過來，移交後再來讓我測開看看。`,
              text_en: `I just checked the project folder (${c.rawLogTargetPath}) and didn't see the file yet—it must still be in A-Wen's personal workspace! Please ask A-Wen right beside you to transfer it over, and then let me test opening it.`
            }
          ]);
        }
        return;
      }

      // Case B: File transferred, but Qing lacks permission!
      if (!c.qingHasProjectAccess) {
        window.BS.Audio.alert();
        window.BS.UI.startDialogue([
          {
            speaker: '接手同事 小晴（2F 實驗區）',
            portrait: 'qing',
            text: `我看到「${c.rawLogName}」已經移交到專案指定位置（${c.rawLogTargetPath}）了！我現在點開測測看……`,
            text_en: `I see that "${c.rawLogName}" has been transferred to the designated project location (${c.rawLogTargetPath})! Let me click and test opening it now...`
          },
          {
            speaker: '接手同事 小晴',
            portrait: 'qing',
            text: '哎呀，系統跳出「權限不足，無法開啟」！檔案雖然移交過來了，但我的帳號還沒開通這個專案資料夾的存取權限。麻煩到 2F 值班電腦幫我開通並用「小晴視角」預覽確認，再來找我測開！',
            text_en: 'Oops, the system says "Insufficient permissions, unable to open"! Although the file has been transferred, my account hasn\'t been granted access to this project folder yet. Please head to the 2F Duty PC to grant my access and verify with "Xiao-Qing View" preview before testing again!'
          }
        ]);
        return;
      }

      // Case C: File transferred AND Qing has access -> Direct confirmation in dialogue!
      c.qingConfirmedOpen = true;
      ctx.advanceTime(2);
      ctx.refreshHUD();
      window.BS.Audio.success();
      window.BS.UI.showToast('✅ 小晴已實測開啟原始紀錄並確認接收！交接清單已更新！', false, 4000);
      window.BS.UI.startDialogue([
        {
          speaker: '接手同事 小晴（2F 實驗區）',
          portrait: 'qing',
          text: `我現在直接點開 ${c.rawLogTargetPath} 測試……`,
          text_en: `I will open and test ${c.rawLogTargetPath} right away...`
        },
        {
          speaker: '接手同事 小晴',
          portrait: 'qing',
          text: '成功打開了！量測欄位、日期和原始波形全都完整無缺！我已經在交接清單勾選「接收人已確認（小晴）」了，你可以安心進行後續的權限終止和 1F 門禁收回囉！',
          text_en: 'Opened successfully! Measurement columns, dates, and raw waveforms are completely intact! I have checked "Recipient Confirmed (Xiao-Qing)" on the handover checklist. You can now proceed with terminating access and returning the 1F access badge!'
        }
      ]);
    }

    function handleCh3LabTerminal(state) {
      const c = state.ch3;
      c.clues.inspectedLabTerminal = true;
      ctx.refreshHUD();
      window.BS.Audio.select();
      const statusTextZh = c.rawLogLocation === 'project'
        ? c.qingConfirmedOpen
          ? '✅ 已移交至指定位置，小晴已確認開啟'
          : c.qingHasProjectAccess
          ? '🟡 已移交且小晴權限已開通（待小晴親自確認）'
          : '⚠ 已移交，但小晴尚無開啟權限（請至 2F 值班電腦開通）'
        : '❌ 尚在阿文個人工作區（未移交）';

      const statusTextEn = c.rawLogLocation === 'project'
        ? c.qingConfirmedOpen
          ? '✅ Transferred to destination; Xiao-Qing verified opening'
          : c.qingHasProjectAccess
          ? '🟡 Transferred & Xiao-Qing granted access (Awaiting verification)'
          : '⚠ Transferred, but Xiao-Qing lacks access (Grant at 2F Duty PC)'
        : '❌ In A-Wen personal workspace (Not transferred)';

      window.BS.UI.startDialogue([
        {
          speaker: '2F 實驗紀錄電腦（交接檔案對照）',
          portrait: 'monitor',
          text:
            `【交接清單位址對照】\n` +
            `• 檔名：${c.rawLogName}\n` +
            `• 原位置：${c.rawLogOrigPath}\n` +
            `• 接手指定位置：${c.rawLogTargetPath}\n` +
            `• 目前狀態：${statusTextZh}`,
          text_en:
            `[Handover Path Cross-Reference]\n` +
            `• File: ${c.rawLogName}\n` +
            `• Original Path: ${c.rawLogOrigPath}\n` +
            `• Handover Target Path: ${c.rawLogTargetPath}\n` +
            `• Status: ${statusTextEn}`
        }
      ]);
    }

    function handleCh3Lead(state) {
      const c = state.ch3;
      const choices = [];

      // Priority: Admin-assisted single-file transfer remediation (Route 2!)
      if (c.interruptedByEarlyRevoke && c.rawLogLocation !== 'project') {
        choices.push({
          label: `🚒 補救請求：已提早終止阿文原權限，請管理員協助移交指定紀錄（${c.rawLogName}）`,
          label_en: `🚒 Remediation Request: A-Wen's access was revoked early; request admin transfer of record (${c.rawLogName})`,
          onSelect: () => {
            c.rawLogLocation = 'project';
            c.transferredBy = 'admin';
            c.adminTransferCompleted = true;
            ctx.advanceTime(3);
            ctx.refreshHUD();
            window.BS.Audio.success();
            window.BS.UI.showToast('🚒 管理員已單獨移交指定原始紀錄（未恢復阿文整包權限）！', false, 4200);
            window.BS.UI.startDialogue([
              {
                speaker: '負責人 阿明組長（1F 大廳）',
                portrait: 'lead',
                text: '了解！離職停權太早確實常讓交接中斷，但千萬不能因此把阿文原本整包專案權限又重新打開。',
                text_en: "Understood! Revoking access too early often interrupts handovers, but we must never restore A-Wen's full project access package just for this."
              },
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: `我馬上聯繫資訊管理員，從後端直接把指定的那一份「${c.rawLogName}」移交到專案指定位置（${c.rawLogTargetPath}）……好了，已完成移交！`,
                text_en: `I'll contact IT Admin right now to transfer that specific record "${c.rawLogName}" directly from backend to the designated project location (${c.rawLogTargetPath})... Done, transferred!`
              },
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: '接下來你回 2F 確認小晴的存取權限，並請小晴親自打開確認無誤就行。這段中斷與管理員補救過程也會完整記在交班紀錄裡！',
                text_en: "Now go back to 2F to verify Xiao-Qing's access permissions and have her open and verify it. This interruption and admin remediation process will also be fully documented in the handover notes!"
              }
            ]);
          }
        });
      }

      choices.push({
        label: c.clues.mingConfirmedScope
          ? '再次確認阿文後續改論文的授權範圍與保密提醒'
          : '確認阿文後續改論文需要的兩張圖、用途、期限與保密提醒',
        label_en: c.clues.mingConfirmedScope
          ? "Reconfirm A-Wen's thesis revision scope & confidentiality reminders"
          : "Confirm two figures, purpose, validity period & confidentiality reminders for A-Wen's thesis revision",
        onSelect: () => {
          c.clues.mingConfirmedScope = true;
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.Audio.success();
          window.BS.UI.showToast('✅ 已由 1F 阿明組長核定：僅兩張圖・論文修訂・離開後 30 天！', false, 4000);
          window.BS.UI.startDialogue([
            {
              speaker: '負責人 阿明組長（1F 大廳）',
              portrait: 'lead',
              text: '阿文下個月改論文的部分我確認過了：原本整個專案資料夾權限**不能保留**，離職當日必須終止，避免他繼續看到與論文無關的機密資料！',
              text_en: "I've reviewed A-Wen's request for thesis revisions next month: his original full project folder access CANNOT be retained. It must be terminated on departure day to prevent exposure to unrelated confidential data!"
            },
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '我核准另行開立獨立的限期授權：\n• 內容：僅限會議用兩張摘要圖（StarSky_會議用摘要圖_v2：圖A、圖B）\n• 用途：後續論文修訂\n• 期限：離開後 30 天自動到期',
              text_en: "I approve creating a separate time-limited authorization:\n• Scope: Only the two meeting summary figures (StarSky_Meeting_Summary_v2: Fig A, Fig B)\n• Purpose: Subsequent thesis revision\n• Expiration: Automatically expires 30 days after departure"
            },
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '你現在回 2F 值班電腦就能設定這份限期授權了。另外別忘了兩件事：① 到旁邊的 1F 大門接待櫃台把阿文的實體門禁卡收回登記；② 跟阿文親自提醒離職後仍須遵守的保密約定！',
              text_en: "You can now configure this time-limited authorization at the 2F Duty PC. Don't forget two tasks: ① Return and log A-Wen's physical access badge at 1F Reception Desk; ② Personally remind A-Wen of continuing confidentiality obligations after leaving!"
            }
          ]);
        }
      });

      choices.push({
        label: '確認這兩層樓還有哪些交接步驟',
        label_en: 'Check remaining handover steps across both floors',
        onSelect: () => {
          const pending = window.BS.State.getCh3PendingItems(state);
          let pendingZh = pending.length === 0
            ? '全部交接項目都完成得滴水不漏！上 2F 辦公區值班桌填寫交班紀錄就能下班囉。'
            : `目前還有 ${pending.length} 項待處理：\n• ${pending.slice(0, 3).join('\n• ')}${pending.length > 3 ? '\n……（可按 SELECT 查看完整清單）' : ''}`;
          let pendingEn = pending.length === 0
            ? 'All handover items completed flawlessly! Go to the 2F Duty Desk to fill in handover notes and clock out.'
            : `Currently ${pending.length} items pending:\n• ${pending.slice(0, 3).join('\n• ')}${pending.length > 3 ? '\n... (Press SELECT for full list)' : ''}`;
          window.BS.UI.startDialogue([
            {
              speaker: '負責人 阿明組長（1F 大廳）',
              portrait: 'lead',
              text: pendingZh,
              text_en: pendingEn
            }
          ]);
        }
      });

      choices.push({
        label: '先忙其他項目',
        label_en: 'Attend to other tasks first',
        onSelect: () => {}
      });

      window.BS.UI.startDialogue([
        {
          speaker: '負責人 阿明組長（1F 大廳）',
          portrait: 'lead',
          text: '小安，我正在 1F 櫃台旁處理阿文的離職核簽。離職當日一定要把研究交接、電子權限終止跟 1F 門禁卡回收分頭確認清楚喔！',
          text_en: "Xiao-An, I'm processing A-Wen's departure sign-offs here at the 1F counter. On departure day, be sure to verify research handovers, digital access revocations, and 1F physical badge returns separately!",
          choices
        }
      ]);
    }

    function handleCh3Reception(state) {
      const c = state.ch3;
      if (c.badgeReturned) {
        window.BS.UI.startDialogue([
          {
            speaker: '1F 大門接待櫃台（門禁憑證登記）',
            portrait: 'reception',
            text: '✅ 阿文的實體門禁卡已收回並完成註銷登記。\n（提醒：實體門禁卡與電子檔案權限分開管制，電子權限請於 2F 值班電腦確認終止！）',
            text_en: "✅ A-Wen's physical access badge has been retrieved and logged as deactivated.\n(Reminder: Physical badges and digital file permissions are controlled separately; please confirm digital access termination at 2F Duty PC!)"
          }
        ]);
        return;
      }

      window.BS.UI.startDialogue([
        {
          speaker: '1F 大門接待櫃台（門禁憑證登記）',
          portrait: 'reception',
          text: c.awenGaveBadge
            ? '你手上有阿文剛交還的實驗室實體門禁卡。要現在於 1F 櫃台完成收回與門禁註銷登記嗎？'
            : '阿文今天離職，1F 櫃台尚未收到他的實體門禁卡回收紀錄。要立刻通知阿文交回門禁卡並於 1F 櫃台完成收回登記嗎？（門禁卡與電子權限將各自獨立記錄）',
          text_en: c.awenGaveBadge
            ? "You have A-Wen's physical lab access badge in hand. Complete badge return and deactivation registration at 1F Reception Desk now?"
            : "A-Wen is leaving today, but 1F Reception has no record of his badge return yet. Notify A-Wen to hand over his badge and complete deactivation registration at 1F Reception? (Badges and digital access are logged separately)",
          choices: [
            {
              label: '🪪 辦理阿文門禁卡收回與註銷登記',
              label_en: "🪪 Process A-Wen's access badge return & deactivation",
              onSelect: () => {
                c.awenGaveBadge = true;
                c.badgeReturned = true;
                ctx.advanceTime(2);
                ctx.refreshHUD();
                window.BS.Audio.success();
                window.BS.UI.showToast('✅ 已於 1F 大門接待櫃台完成阿文門禁卡收回登記！', false, 3800);
                window.BS.UI.startDialogue([
                  {
                    speaker: '1F 大門接待櫃台',
                    portrait: 'reception',
                    text: '已收回阿文的實驗室門禁卡並於系統登錄停用！門禁回收狀態已同步更新到交接清單。',
                    text_en: "A-Wen's lab access badge retrieved and logged as disabled in system! Badge return status updated on handover checklist."
                  }
                ]);
              }
            },
            {
              label: '等一下再登記',
              label_en: 'Register later',
              onSelect: () => {}
            }
          ]
        }
      ]);
    }

    function handleCh3DutyDesk(state) {
      if (state.handoverDone) {
        window.BS.UI.startDialogue([
          {
            speaker: '2F 值班桌（交班紀錄簿）',
            portrait: 'desk',
            text: '第五章「阿文的最後一天」已經完成交班！要重新檢視通關畫面與交班紀錄，還是再挑戰其他路線呢？',
            text_en: 'Chapter 5 "A-Wen\'s Last Day" handover is completed! Would you like to review the clearance screen and handover notes, or try a different route?',
            choices: [
              {
                label: '🏆 重新檢視通關畫面與交班紀錄',
                label_en: '🏆 Review clearance screen & handover notes',
                onSelect: () => {
                  const result = window.BS.State.evaluateChapter3Handover(state);
                  window.BS.UI.openClearScreen(result, {
                    onReplay: () => ctx.restartChapter(),
                    onReturnMenu: () => ctx.returnToMenu(),
                    onStartChapter: (ch) => ctx.startChapter(ch)
                  });
                }
              },
              {
                label: '🔄 再玩一次第五章',
                label_en: '🔄 Replay Chapter 5',
                onSelect: () => ctx.restartChapter()
              },
              {
                label: '🏠 返回首頁選單',
                label_en: '🏠 Return to Main Menu',
                onSelect: () => ctx.returnToMenu()
              },
              {
                label: '先取消',
                label_en: 'Cancel',
                onSelect: () => {}
              }
            ]
          }
        ]);
        return;
      }

      if (!window.BS.State.canHandover(state)) {
        window.BS.UI.startDialogue([
          {
            speaker: '2F 值班桌（交班紀錄簿）',
            portrait: 'desk',
            text: '還沒開始處理阿文的離職交接喔！請先打開旁邊的 2F 值班電腦查看交接清單與存取預覽，或找 2F 的阿文與小晴、1F 的阿明組長與大門櫃台確認事項。',
            text_en: "Departure handover hasn't started yet! Please open the adjacent 2F Duty PC to inspect the handover checklist and access preview, or consult A-Wen and Xiao-Qing on 2F, and Team Lead A-Ming and 1F Reception Desk."
          }
        ]);
        return;
      }

      const pending = window.BS.State.getCh3PendingItems(state);
      const hasPending = pending.length > 0;

      window.BS.UI.startDialogue([
        {
          speaker: '2F 值班桌（交班紀錄簿）',
          portrait: 'desk',
          text: hasPending
            ? `⚠ 目前交接清單還有 ${pending.length} 項待辦未完成（例如：${pending[0]}）。確定要帶著待辦事項直接交班嗎？`
            : '太棒了！所有跨樓層離職交接、權限終止、限期授權、1F 門禁收回與保密提醒都已完成！要現在填寫交班紀錄並下班嗎？',
          text_en: hasPending
            ? `⚠ There are still ${pending.length} pending items on the handover checklist (e.g., ${pending[0]}). Are you sure you want to proceed with handover while items remain incomplete?`
            : 'Excellent! All cross-floor handovers, permission revocations, time-limited authorizations, 1F badge returns, and confidentiality reminders are complete! Fill in handover notes and clock out now?',
          choices: [
            {
              label: hasPending ? '✍ 仍帶著待辦事項交班（檢視風險與未完成項目）' : '✍ 填寫交班紀錄並完成本章',
              label_en: hasPending ? '✍ Proceed with handover anyway (Review risks & pending items)' : '✍ Fill in handover notes & complete chapter',
              onSelect: () => {
                state.handoverDone = true;
                state.timeMinutes = Math.max(state.timeMinutes, 17 * 60 + 25);
                ctx.refreshHUD();
                const result = window.BS.State.evaluateChapter3Handover(state);
                if (window.BS.Analytics) {
                  window.BS.Analytics.trackChapterComplete(state);
                }
                if (result.hasRisk) {
                  window.BS.Audio.alert();
                } else {
                  window.BS.Audio.fanfare();
                }
                window.BS.UI.openClearScreen(result, {
                  onReplay: () => ctx.restartChapter(),
                  onReturnMenu: () => ctx.returnToMenu(),
                  onStartChapter: (ch) => ctx.startChapter(ch)
                });
              }
            },
            {
              label: hasPending ? '先回去補齊剩餘交接事項' : '再在兩層樓繞一下',
              label_en: hasPending ? 'Go back and finish pending handover items' : 'Walk around both floors a bit more',
              onSelect: () => {}
            }
          ]
        }
      ]);
    }

    // =========================================================================
    // CHAPTER 3 (Internal 4): 這批資料要列入清單嗎？
    // =========================================================================
    function playCh4Intro() {
      window.BS.UI.startDialogue([
        {
          speaker: '同事 阿文（1F 實驗區）',
          speaker_en: 'Colleague: A-Wen (1F Lab)',
          portrait: 'colleague',
          text: '阿文在 1F 實驗區拿出同一個虛構量測計畫（星空計畫）的三組資料，對小安說：\n「這三組資料都是同一個計畫做的。小晴明天要盤點，你幫我看看哪些需要列進研發成果清單？她要知道去哪裡找，還有該找誰問。」',
          text_en: 'In 1F lab, A-Wen presents 3 data sets from the StarSky Project and says:\n"These are all from the same project. Xiao-Qing will inventory them tomorrow. Which ones should go into the R&D Records Inventory? She needs to know where to find them and who to ask."'
        },
        {
          speaker: '小安',
          speaker_en: 'Xiao-An',
          portrait: 'player',
          text: '好！同一計畫可能同時包含公開資訊、未公開 know-how 和專利申請資料。我們一起看這三張資料卡，確認各自該如何判斷！',
          text_en: 'Great! A single project can encompass public information, undisclosed know-how, and patent filings. Let us examine the 3 data cards to classify each properly!'
        }
      ], () => {
        ctx.refreshHUD();
      });
    }

    function completeCh4Handover(state) {
      state.handoverDone = true;
      state.timeMinutes = Math.max(state.timeMinutes, 17 * 60);
      ctx.refreshHUD();
      const result = window.BS.State.evaluateChapter4Handover(state);
      if (window.BS.Analytics) {
        window.BS.Analytics.trackChapterComplete(state);
      }
      if (result.hasRisk) {
        window.BS.Audio.alert();
      } else {
        window.BS.Audio.fanfare();
      }
      window.BS.UI.openClearScreen(result, {
        onReplay: () => ctx.restartChapter(),
        onReturnMenu: () => ctx.returnToMenu(),
        onStartChapter: (ch) => ctx.startChapter(ch)
      });
    }

    function interactCh4(state, target) {
      switch (target.id) {
        case 'npc_colleague':
          handleCh4Colleague(state);
          break;
        case 'pc':
          handleCh4OfficePC(state);
          break;
        case 'duty_desk':
          handleCh4DutyDesk(state);
          break;
        case 'npc_qing':
          handleCh4Qing(state);
          break;
        case 'npc_lead':
          handleCh4Lead(state);
          break;
        case 'cleanroom_window':
          window.BS.UI.startDialogue([
            {
              speaker: '1F 管制實驗區觀測窗',
              portrait: 'monitor',
              text: '透過觀測窗可看見星空計畫量測機台。機密技術參數與原始數據均保存在專案受控資料夾，不抄入清單中。',
              text_en: 'Looking through the observation window, the StarSky measurement equipment is visible. Confidential technical parameters and raw data are kept in access-controlled project folders, not copied directly into the inventory.'
            }
          ]);
          break;
        default:
          break;
      }
    }

    function handleCh4Colleague(state) {
      const c = state.ch4;
      if (!c.cardsCompleted) {
        window.BS.UI.startDialogue([
          {
            speaker: '同事 阿文（1F 實驗區）',
            portrait: 'colleague',
            text: '來，這是星空計畫的三張資料卡。我們逐張看看：哪些只要留作一般紀錄、哪些要以資料群組列入清單受控保護！',
            text_en: "Here are the three data cards for Project StarSky. Let's examine each: which are kept as general records, and which should be inventoried as data groups for controlled protection!",
            choices: [
              {
                label: '🗂️ 查看三張資料卡並完成判斷',
                label_en: '🗂️ Inspect three data cards & classify',
                onSelect: () => {
                  window.BS.UI.openDataCardsModal(state, {
                    onComplete: () => {
                      ctx.refreshHUD();
                      window.BS.UI.startDialogue([
                        {
                          speaker: '同事 阿文（1F 實驗區）',
                          portrait: 'colleague',
                          text: '太清楚了！同一研究計畫下，公開資訊、自研 know-how 跟專利申請資料的界線完全分明了。走吧，請走樓梯上 2F 辦公區的值班電腦，把這份清單確認並存檔！',
                          text_en: 'Crystal clear! Under the same project, the boundaries between public information, proprietary know-how, and patent filings are completely distinct. Now head up to the 2F Duty PC to review and save the inventory!'
                        }
                      ], () => {
                        ctx.refreshHUD();
                      });
                    }
                  });
                }
              },
              {
                label: '先等一下',
                label_en: 'Wait a moment',
                onSelect: () => {}
              }
            ]
          }
        ]);
        return;
      }

      window.BS.UI.startDialogue([
        {
          speaker: '同事 阿文（1F 實驗區）',
          portrait: 'colleague',
          text: '三組資料卡我們都已經辨識完畢囉！請往左走樓梯上 2F 辦公區，到值班電腦確認清單草稿並存檔。',
          text_en: "We've classified all three data cards! Head left up the stairs to the 2F Duty PC to review and save the draft inventory."
        }
      ]);
    }

    function handleCh4OfficePC(state) {
      const c = state.ch4;
      if (!c.cardsCompleted) {
        window.BS.UI.startDialogue([
          {
            speaker: '2F 值班電腦（研發成果清單）',
            portrait: 'monitor',
            text: '電腦畫面上顯示星空計畫研發成果清單草稿。\n※ 請先在 1F 實驗區找同事阿文查看三組資料卡，完成辨識後再來確認清單！',
            text_en: 'The screen displays the Project StarSky R&D Records Inventory draft.\n* Please visit colleague A-Wen in 1F Lab first to examine the three data cards before reviewing the inventory!'
          }
        ]);
        return;
      }

      window.BS.UI.openChecklistModal(state, {
        onUpdate: () => {
          ctx.refreshHUD();
        }
      });
      ctx.refreshHUD();
    }

    function handleCh4Qing(state) {
      const c = state.ch4;
      if (!c.cardsCompleted) {
        window.BS.UI.startDialogue([
          {
            speaker: '盤點同事 小晴（2F 辦公區）',
            portrait: 'qing',
            text: '嗨小安！明天我要盤點星空計畫的研發成果資料。你先去 1F 實驗區幫阿文看看資料卡，確認好哪些要列入清單再來找我喔！',
            text_en: "Hi Xiao-An! I'm conducting an inventory of Project StarSky R&D records tomorrow. Help A-Wen check the data cards in 1F Lab first, and come back once you've determined what to include!"
          }
        ]);
        return;
      }

      if (!c.updatedSaved) {
        window.BS.UI.startDialogue([
          {
            speaker: '盤點同事 小晴（2F 辦公區）',
            portrait: 'qing',
            text: '小安，這份清單上的「量測裝置申請資料」還是標註『尚未公開』耶？組長剛剛不是發通知說專利已經公開了嗎？請先回 2F 值班電腦更新狀態再來找我核對喔！',
            text_en: "Xiao-An, the \"Measurement Device Application Docs\" on this inventory is still marked \"Not Yet Published\"? Didn't the Lead just notify us that the patent has been published? Please return to 2F Duty PC to update its status before checking with me!",
            choices: [
              {
                label: '💻 好，我這就回 2F 值班電腦更新清單',
                label_en: '💻 Understood, updating the inventory at 2F Duty PC now',
                onSelect: () => {
                  handleCh4OfficePC(state);
                }
              },
              {
                label: '先稍候',
                label_en: 'Wait a moment',
                onSelect: () => {}
              }
            ]
          }
        ]);
        return;
      }

      // Verified report
      c.verifiedWithQing = true;
      c.stage = 'verified';
      ctx.refreshHUD();
      window.BS.Audio.success();

      window.BS.UI.startDialogue([
        {
          speaker: '盤點同事 小晴（2F 辦公區）',
          portrait: 'qing',
          text:
            '小安，清單整理得太清楚了！我來跟你核對明天的盤點重點：\n\n' +
            '1. **需要盤點的資料**：星空計畫量測相關研發成果，依資料群組管理，清楚明瞭！\n' +
            '2. **存放位置與負責人**：各資料群組分別指引至受控資料夾，負責人皆為阿文，明天找資料與詢問完全沒問題。\n' +
            '3. **公開與保護界線**：\n' +
            '   • 量測裝置申請資料已標記公開，並註明僅涵蓋公開文件內容；\n' +
            '   • 量測裝置調校紀錄未納入申請，明確保留為未公開 know-how 繼續受控；\n' +
            '   • 條件優化紀錄亦維持內部保護，公開與保密界線絲毫不混淆！\n\n' +
            '今天的研發成果清單任務大成功！',
          text_en:
            'Xiao-An, the inventory is organized so clearly! Let me review tomorrow\'s inventory focus with you:\n\n' +
            '1. **Records to Inventory**: StarSky measurement-related R&D records managed by data groups, crystal clear!\n' +
            '2. **Storage Locations & Persons Responsible**: Each data group points to access-controlled folders with A-Wen as Person Responsible; locating files or asking questions tomorrow will be completely seamless.\n' +
            '3. **Public vs. Protected Boundaries**:\n' +
            '   • Measurement device application docs marked public, explicitly noting coverage only of published documents;\n' +
            '   • Device calibration notes omitted from application, clearly preserved as undisclosed know-how under control;\n' +
            '   • Condition optimization records also maintained under internal protection—zero confusion between public and confidential!\n\n' +
            'Today\'s R&D Records Inventory task is a total success!',
          choices: [
            {
              label: '🏆 填寫第三章交班紀錄並完成本章',
              label_en: '🏆 Fill in handover notes & complete chapter',
              onSelect: () => completeCh4Handover(state)
            },
            {
              label: '我再看一下周圍',
              label_en: 'Look around a bit more',
              onSelect: () => {}
            }
          ]
        }
      ]);
    }

    function handleCh4Lead(state) {
      const c = state.ch4;
      let msg = '';
      let msgEn = '';
      if (!c.draftSaved) {
        msg = '研發成果清單以研究計畫或資料群組建立即可，每筆記得寫清楚五項：資料名稱或範圍、資料類型、保護原因、存放位置、負責人。技術細節留在受控資料夾。';
        msgEn = 'The R&D Records Inventory only needs to be organized by project or data group. Remember to record the five fields for each entry: Record Name or Scope, Record Type, Reason for Protection, Storage Location, and Person Responsible. Keep technical details inside access-controlled folders.';
      } else if (!c.updatedSaved) {
        msg = '量測裝置的申請案今天公開了。公開文件只有裝置的結構與原理，沒有我們內部的調校紀錄。請回值班電腦更新清單！';
        msgEn = 'The patent application for the measurement device was published today. The published document only covers structure and principles, not our internal calibration notes. Please return to the Duty PC to update the inventory!';
      } else {
        msg = '清單更新得很精準！公開文件涵蓋的部分標示已公開，未納入申請的調校紀錄依然受控保護，這樣明天小晴盤點就完全沒有疑義了。可以找小晴核對交班囉。';
        msgEn = 'The inventory update is spot on! Parts covered by the published document are marked public, while calibration notes outside the application remain under controlled protection. Xiao-Qing will have no doubts during inventory tomorrow. You can now verify with her for handover!';
      }

      window.BS.UI.startDialogue([
        {
          speaker: '負責人 阿明組長（2F 辦公區）',
          portrait: 'lead',
          text: msg,
          text_en: msgEn
        }
      ]);
    }

    function handleCh4DutyDesk(state) {
      if (state.handoverDone) {
        window.BS.UI.startDialogue([
          {
            speaker: '2F 值班桌（第三章交班紀錄）',
            portrait: 'desk',
            text: '第三章「這批資料要列入清單嗎？」已經完成交班！要重新檢視通關畫面，還是再試試不同路線呢？',
            text_en: 'Chapter 3 "Should These Records Be Inventoried?" handover completed! Review clearance screen, or try a different route?',
            choices: [
              {
                label: '🏆 重新檢視通關畫面與交班紀錄',
                label_en: '🏆 Review clearance screen & handover notes',
                onSelect: () => {
                  const result = window.BS.State.evaluateChapter4Handover(state);
                  window.BS.UI.openClearScreen(result, {
                    onReplay: () => ctx.restartChapter(),
                    onReturnMenu: () => ctx.returnToMenu(),
                    onStartChapter: (ch) => ctx.startChapter(ch)
                  });
                }
              },
              {
                label: '🔄 再玩一次第三章',
                label_en: '🔄 Replay Chapter 3',
                onSelect: () => ctx.restartChapter()
              },
              {
                label: '🏠 返回首頁選單',
                label_en: '🏠 Return to Main Menu',
                onSelect: () => ctx.returnToMenu()
              },
              {
                label: '先取消',
                label_en: 'Cancel',
                onSelect: () => {}
              }
            ]
          }
        ]);
        return;
      }

      const c = state.ch4;
      if (!c.updatedSaved) {
        window.BS.UI.startDialogue([
          {
            speaker: '2F 值班桌（第三章交班）',
            portrait: 'desk',
            text: '請先至 2F 值班電腦確認星空計畫研發成果清單，並依專利公開通知完成更新，再向小晴核對完成交班。',
            text_en: 'Please review the StarSky R&D Records Inventory at 2F Duty PC and update it per the patent publication notice before verifying with Xiao-Qing for handover.'
          }
        ]);
        return;
      }

      if (!c.verifiedWithQing) {
        window.BS.UI.startDialogue([
          {
            speaker: '2F 值班桌（第四章交班）',
            portrait: 'desk',
            text: '清單已更新存檔！請先找 2F 辦公區的盤點同事小晴核對一次明天的盤點重點，即可完成交班。',
            text_en: 'Inventory updated and saved! Please verify tomorrow\'s inventory focus with Xiao-Qing in 2F Office to complete handover.'
          }
        ]);
        return;
      }

      window.BS.UI.startDialogue([
        {
          speaker: '2F 值班桌（第四章交班）',
          portrait: 'desk',
          text: '研發成果清單已整理妥當，小晴也核對完畢！要現在完成第四章交班嗎？',
          text_en: 'The R&D Records Inventory is neatly organized and verified with Xiao-Qing! Complete handover for this chapter now?',
          choices: [
            {
              label: '✍ 填寫第四章交班紀錄並完成本章',
              label_en: '✍ Fill in handover notes & complete chapter',
              onSelect: () => completeCh4Handover(state)
            },
            {
              label: '先不交班',
              label_en: 'Do not hand over yet',
              onSelect: () => {}
            }
          ]
        }
      ]);
    }

    // =========================================================================
    // CHAPTER 3 (Internal 5): 這份文件要怎麼標？
    // =========================================================================
    function playCh5Intro() {
      window.BS.UI.startDialogue([
        {
          speaker: '值班備忘錄（2F 辦公區）',
          speaker_en: 'Duty Memo (2F Office)',
          portrait: 'desk',
          text: '下午 4:00，同事阿文拿著剛整理好的三份研究文件急匆匆走進 2F 辦公區，等一下小晴要接手盤點並準備會議資料。',
          text_en: '4:00 PM. Colleague A-Wen rushes into 2F office holding 3 research documents. Xiao-Qing will take over soon to prepare meeting materials.'
        },
        {
          speaker: '阿文（同事）',
          speaker_en: 'A-Wen (Colleague)',
          portrait: 'colleague',
          text: '小安！這三份資料等一下要交接給小晴，但各份的內容和用途都不太一樣。我們得先逐份看清楚，決定要不要加上機密標示，並標在顯眼的位置（簡報封面與頁腳、紙本首頁蓋印），小晴接手才清楚怎麼處理！',
          text_en: 'Xiao-An! These 3 files will be handed over to Xiao-Qing, but their contents and purposes differ. We must review each to decide whether to add a Confidentiality Label in prominent spots (slides cover/footer, paper cover stamp) so she knows how to handle them!'
        },
        {
          speaker: '小安（值班研究助理）',
          speaker_en: 'Xiao-An (Duty Research Assistant)',
          portrait: 'player',
          text: '沒問題！我們逐份查看內容和用途，確認哪些含有未公開的自研技術，加上正確標示並預覽版面效果後，再交給小晴！',
          text_en: 'No problem! Let us check contents and purposes, identify undisclosed know-how, apply proper Confidentiality Labels, preview layouts, and hand them to Xiao-Qing!'
        }
      ], () => {
        ctx.refreshHUD();
      });
    }

    function completeCh5Handover(state) {
      state.handoverDone = true;
      state.timeMinutes = Math.max(state.timeMinutes, 16 * 60 + 20);
      ctx.refreshHUD();
      const result = window.BS.State.evaluateChapter5Handover(state);
      if (window.BS.Analytics) {
        window.BS.Analytics.trackChapterComplete(state);
      }
      if (result.hasRisk) {
        window.BS.Audio.alert();
      } else {
        window.BS.Audio.fanfare();
      }
      window.BS.UI.openClearScreen(result, {
        onReplay: () => ctx.restartChapter(),
        onReturnMenu: () => ctx.returnToMenu(),
        onStartChapter: (ch) => ctx.startChapter(ch)
      });
    }

    function handleCh5Colleague(state) {
      const c = state.ch5;
      if (!c.markingCompleted) {
        window.BS.UI.startDialogue([
          {
            speaker: '阿文（同事）',
            portrait: 'colleague',
            text: '這三份文件分別是：成果發表會活動海報、量測調校方法內部簡報，以及關鍵樣品量測原始紙本手稿。我們打開工作台，逐份確認內容、用途與機密標示吧！',
            text_en: 'These three documents are: Symposium Event Poster, Measurement & Calibration Method Internal Presentation, and Key Sample Measurement Original Paper Manuscript. Let us open the workbench and review contents, intended purposes, and Confidentiality Labels for each!',
            choices: [
              {
                label: '🏷️ 打開文件標示與版面預覽工作台',
                label_en: '🏷️ Open Document Labeling & Layout Preview Workbench',
                onSelect: () => {
                  window.BS.UI.openMarkingModal(state, {
                    onCompleted: () => {
                      ctx.refreshHUD();
                      window.BS.UI.showToast('🎉 三份文件標示已完成！請找 2F 辦公區的小晴接手文件。', false, 5000);
                    }
                  });
                }
              },
              {
                label: '等一下再看',
                label_en: 'Check later',
                onSelect: () => {}
              }
            ]
          }
        ]);
        return;
      }

      window.BS.UI.startDialogue([
        {
          speaker: '阿文（同事）',
          portrait: 'colleague',
          text: '三份文件的機密標示都標妥了！海報維持公開版面、簡報在封面和頁腳標密、紙本首頁蓋印，一目了然！趕快拿去交給 2F 辦公區的小晴接手吧！',
          text_en: 'Confidentiality Labels for all three documents are complete! The poster remains public, the slides are marked confidential on cover and footer, and the paper manuscript is stamped on the cover—crystal clear! Take them to Xiao-Qing in 2F Office now!'
        }
      ]);
    }

    function handleCh5OfficePC(state) {
      window.BS.UI.startDialogue([
        {
          speaker: '2F 值班電腦',
          portrait: 'monitor',
          text: '螢幕開啟「文件機密標示與版面預覽工作台」。可逐份檢視文件內容、用途與機密標示決策，並即時預覽簡報封面／頁腳或紙本首頁印記。',
          text_en: 'The screen displays the "Document Labeling & Layout Preview Workbench". You can inspect document contents, purposes, and labeling decisions, previewing slide cover/footer or paper manuscript stamps in real time.',
          choices: [
            {
              label: '🏷️ 進入文件標示與版面預覽工作台',
              label_en: '🏷️ Enter Document Labeling & Layout Preview Workbench',
              onSelect: () => {
                window.BS.UI.openMarkingModal(state, {
                  onCompleted: () => {
                    ctx.refreshHUD();
                    window.BS.UI.showToast('🎉 三份文件標示已完成！請找 2F 辦公區的小晴接手文件。', false, 5000);
                  }
                });
              }
            },
            {
              label: '離開電腦',
              label_en: 'Leave computer',
              onSelect: () => {}
            }
          ]
        }
      ]);
    }

    function handleCh5Lead(state) {
      window.BS.UI.startDialogue([
        {
          speaker: '負責人 阿明組長',
          portrait: 'lead',
          text: '小安，文件標示是營業秘密合理保密措施非常關鍵的一環！\n\n' +
            '原則很明確：\n' +
            '① 確認內容：確認是否含有未公開的自研技術、參數或實驗數據？若純為公開宣傳海報，無須標密。\n' +
            '② 顯著標示：含未公開 know-how 的電子簡報，應於封面與每頁頁腳標註機密；紙本文件應於首頁顯著加蓋機密印章與編號。\n' +
            '③ 清楚交接：標示讓接手人知道怎麼處理，分享前仍要確認對象及權限！',
          text_en: 'Xiao-An, document labeling is a crucial cornerstone of Reasonable Confidentiality Measures for trade secrets!\n\n' +
            'The principles are straightforward:\n' +
            '① Verify Content: Does it contain undisclosed proprietary know-how, parameters, or experimental data? Pure public promotional posters need no confidential label.\n' +
            '② Prominent Labeling: Electronic presentations with undisclosed know-how must be marked confidential on the cover and footer of every slide; paper documents must bear a prominent confidential stamp and tracking number on the cover.\n' +
            '③ Clear Handover: Labels instruct handlers how to treat materials; always verify recipient identity and permissions before sharing!'
        }
      ]);
    }

    function handleCh5Qing(state) {
      const c = state.ch5;
      if (!c.markingCompleted) {
        window.BS.UI.startDialogue([
          {
            speaker: '接手同事 小晴',
            portrait: 'qing',
            text: '小安，等阿文和你把三份文件的機密標示都確認好，再交給我喔！接手時我需要確認每一份的標示，才知道接下來要存放在哪裡、能不能對外分享。',
            text_en: "Xiao-An, once you and A-Wen have verified the Confidentiality Labels on all three documents, hand them to me! When taking over, I must check each label so I know where to store it and whether it can be shared externally."
          }
        ]);
        return;
      }

      if (!c.verifiedWithQing) {
        window.BS.UI.startDialogue([
          {
            speaker: '接手同事 小晴',
            portrait: 'qing',
            text: '太好了，三份文件都標示完成了！讓我一份一份核對：',
            text_en: 'Wonderful, labeling is complete for all three documents! Let me verify each one:'
          },
          {
            speaker: '接手同事 小晴',
            portrait: 'qing',
            text: '①【活動海報】：標示為「公開／一般」，確認內容沒有未公開自研技術！我等一下會直接拿去 1F 大廳形象區公布欄張貼，並發布公開報名資訊。',
            text_en: '① [Event Poster]: Marked "Public / General", confirmed to contain no undisclosed know-how! I will post it on the 1F Lobby bulletin board shortly and release public registration details.'
          },
          {
            speaker: '接手同事 小晴',
            portrait: 'qing',
            text: '②【調校方法內部簡報】：封面和每頁頁腳都清楚標註了「機密／限專案內部使用」！這份含有未公開最佳化參數，我會放入加密受控資料夾；日後若有外部合作廠商想要索取，我會先向阿明組長確認 NDA 與授權範圍，絕不私自轉發！',
            text_en: '② [Calibration Method Internal Presentation]: Cover and all slide footers clearly state "Confidential / Internal Project Use Only"! Since this contains undisclosed optimization parameters, I will place it in an encrypted controlled folder. If external partners request it later, I will verify the NDA and authorization scope with Team Lead A-Ming first—never forwarding privately!'
          },
          {
            speaker: '接手同事 小晴',
            portrait: 'qing',
            text: '③【原始紙本手稿】：首頁蓋有醒目的「機密」紅章與管制編號！因為記載第一手量測數據，我今天核對完會立刻鎖進 2F 防火公文櫃，離開座位時落實桌面淨空；日後借閱皆需在清冊登記。',
            text_en: '③ [Original Paper Manuscript]: Cover stamped with a conspicuous red "Confidential" stamp and control number! As it records raw first-hand measurement data, I will lock it in the 2F fireproof filing cabinet immediately after review and enforce a clean desk policy; any future loans must be recorded in the registry.'
          },
          {
            speaker: '接手同事 小晴',
            portrait: 'qing',
            text: '總結來說：\n「標示讓接手人知道怎麼處理，分享前仍要確認對象及權限。」',
            text_en: 'In summary:\n"Labels inform handlers how to treat materials; always verify recipient and permissions before sharing."'
          }
        ], () => {
          c.verifiedWithQing = true;
          ctx.refreshHUD();
          window.BS.UI.startDialogue([
            {
              speaker: '接手同事 小晴',
              portrait: 'qing',
              text: '文件交接核對完成！你可以直接向我完成交班，或是回 2F 值班桌填寫交班紀錄簿！',
              text_en: 'Document handover verification complete! You can complete handover directly with me, or return to 2F Duty Desk to log handover notes!',
              choices: [
                {
                  label: '✍ 現在完成第三章交班',
                  label_en: '✍ Complete Chapter 3 handover now',
                  onSelect: () => completeCh5Handover(state)
                },
                {
                  label: '回 2F 值班桌交班',
                  label_en: 'Return to 2F Duty Desk for handover',
                  onSelect: () => {}
                }
              ]
            }
          ]);
        });
        return;
      }

      window.BS.UI.startDialogue([
        {
          speaker: '接手同事 小晴',
          portrait: 'qing',
          text: '三份文件我都按照標示妥善安排了！記得核心守則：「標示讓接手人知道怎麼處理，分享前仍要確認對象及權限。」隨時可完成交班喔！',
          text_en: 'All three documents have been properly arranged according to their labels! Remember the core rule: "Labels inform handlers how to treat materials; always verify recipient and permissions before sharing." Ready for handover whenever you are!',
          choices: [
            {
              label: '✍ 填寫交班紀錄並完成第三章',
              label_en: '✍ Fill in handover notes & complete Chapter 3',
              onSelect: () => completeCh5Handover(state)
            },
            {
              label: '先不交班',
              label_en: 'Do not hand over yet',
              onSelect: () => {}
            }
          ]
        }
      ]);
    }

    function handleCh5DutyDesk(state) {
      const c = state.ch5;
      if (state.handoverDone) {
        window.BS.UI.startDialogue([
          {
            speaker: '2F 值班桌（第三章交班）',
            portrait: 'desk',
            text: '第三章「這份文件要怎麼標？」已經完成交班！要重新檢視交班紀錄，還是再挑戰一次呢？',
            text_en: 'Chapter 3 "How Should This Document Be Labeled?" handover completed! Review handover notes, or challenge this chapter again?',
            choices: [
              {
                label: '🏆 重新檢視通關畫面與交班紀錄',
                label_en: '🏆 Review clearance screen & handover notes',
                onSelect: () => {
                  const result = window.BS.State.evaluateChapter5Handover(state);
                  window.BS.UI.openClearScreen(result, {
                    onReplay: () => ctx.restartChapter(),
                    onReturnMenu: () => ctx.returnToMenu(),
                    onStartChapter: (ch) => ctx.startChapter(ch)
                  });
                }
              },
              {
                label: '🔄 再玩一次第三章',
                label_en: '🔄 Replay Chapter 3',
                onSelect: () => ctx.restartChapter()
              },
              {
                label: '🏠 返回首頁選單',
                label_en: '🏠 Return to Main Menu',
                onSelect: () => ctx.returnToMenu()
              },
              {
                label: '先取消',
                label_en: 'Cancel',
                onSelect: () => {}
              }
            ]
          }
        ]);
        return;
      }

      if (!c.markingCompleted) {
        window.BS.UI.startDialogue([
          {
            speaker: '2F 值班桌（第三章交班）',
            portrait: 'desk',
            text: '三份文件尚未完成標示喔！請先和 2F 的阿文或操作旁邊的 2F 值班電腦，逐份判定活動海報、調校簡報與紙本手稿的機密標示。',
            text_en: 'The three documents have not been labeled yet! Please work with A-Wen on 2F or use the adjacent Duty PC to determine Confidentiality Labels for the poster, presentation, and manuscript.'
          }
        ]);
        return;
      }

      if (!c.verifiedWithQing) {
        window.BS.UI.startDialogue([
          {
            speaker: '2F 值班桌（第三章交班）',
            portrait: 'desk',
            text: '三份文件的標示都完成了！請先找 2F 辦公區的接手同事小晴交接文件，確認保管方式與分享原則，即可完成交班。',
            text_en: 'Labels for all three documents are complete! Please hand them over to Xiao-Qing in 2F Office to confirm storage methods and sharing rules before completing handover.'
          }
        ]);
        return;
      }

      window.BS.UI.startDialogue([
        {
          speaker: '2F 值班桌（第三章交班）',
          portrait: 'desk',
          text: '文件標示與版面預覽精準落實，小晴也已核對並清楚後續保管與分享規範！要現在完成第三章交班嗎？',
          text_en: 'Document labeling and layout previews are accurately implemented, and Xiao-Qing has verified storage and sharing protocols! Complete handover for Chapter 3 now?',
          choices: [
            {
              label: '✍ 填寫第三章交班紀錄並完成本章',
              label_en: '✍ Fill in handover notes & complete chapter',
              onSelect: () => completeCh5Handover(state)
            },
            {
              label: '先不交班',
              label_en: 'Do not hand over yet',
              onSelect: () => {}
            }
          ]
        }
      ]);
    }

    function interactCh5(state, target) {
      switch (target.id) {
        case 'npc_colleague':
          handleCh5Colleague(state);
          break;
        case 'npc_qing':
          handleCh5Qing(state);
          break;
        case 'npc_lead':
          handleCh5Lead(state);
          break;
        case 'pc':
          handleCh5OfficePC(state);
          break;
        case 'duty_desk':
          handleCh5DutyDesk(state);
          break;
        default:
          break;
      }
    }

    return {
      playIntro,
      interact
    };
  }

  window.BS.Story = {
    createStoryController
  };
})();
