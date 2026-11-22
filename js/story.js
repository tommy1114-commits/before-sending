(function () {
  window.BS = window.BS || {};

  function createStoryController(ctx) {
    // ctx provides: getState(), getNPCs(), advanceTime(mins), refreshHUD(),
    //               restartChapter(), returnToMenu(), moveNpcTo(id, x, y, dir)

    function interact(target) {
      if (!target) return;
      const state = ctx.getState();

      if (state.chapter === 2) {
        interactCh2(state, target);
      } else {
        interactCh1(state, target);
      }
    }

    function playIntro() {
      const state = ctx.getState();
      if (state.introShown) return;
      state.introShown = true;

      if (state.chapter === 2) {
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
          speaker: '值班備忘錄（辦公區）',
          portrait: 'desk',
          text: '下午 3:40，下班前還有兩件事要處理：\n① 電腦裡有合作方急著要會議資料的來信。\n② 訪客入口有預約來賓想拍實驗室參訪照。'
        },
        {
          speaker: '小安（值班研究助理）',
          portrait: 'player',
          text: '順序可以自己安排。有不確定的地方，就去問問實驗區的阿文或辦公區的阿明組長吧！處理完再回值班桌交班。'
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
                text: `已寄出「ClearSky_會議用摘要圖_v2（僅圖A、圖B）」給星海科技蘇小姐。\n權限：指定收件人唯讀${permission === 'restricted_7d' ? '、7 天後自動到期' : '（未設定到期日）'}。`
              },
              {
                speaker: '小安',
                portrait: 'player',
                text: '蘇小姐回覆「收到了，圖表很清楚，感謝！」\n我也把實際提供的版本、收件對象和權限順手記下來，交班時才好追溯。'
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
                text: '已寄出會議用兩張圖（限定蘇小姐唯讀）。不過寄出前還沒向阿明組長確認 NDA 涵蓋範圍，交班時最好註記一下。'
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
              text: '🔒 已立即停用原公開連結！同時回覆蘇小姐說明誤傳了非會議用檔案，請勿轉傳給協力廠商並協助刪除快取。'
            },
            {
              speaker: '小安',
              portrait: 'player',
              text: '連結先鎖住了，但還不能就此算了——不知道對方或協力廠商剛剛有沒有先下載。\n馬上找辦公區的負責人阿明組長完成異常通報！'
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
              text: '已補寄核准的「ClearSky_會議用摘要圖_v2（僅圖A、圖B）」，限定星海科技蘇小姐唯讀且 7 天自動到期。'
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
              text: '小安，看你神色很緊張，發生什麼事了？'
            },
            {
              speaker: '小安',
              portrait: 'player',
              text: '組長，我剛才不小心把晴空計畫的測試資料設成公開連結寄給合作方，對方還問能不能轉給協力廠商……'
            },
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '你第一時間來講是對的！先別慌——請立刻回電腦把那個公開連結停用／改為限制存取，止血後再馬上回來跟我做正式通報！'
            }
          ]);
          return;
        }

        window.BS.UI.startDialogue([
          {
            speaker: '負責人 阿明組長',
            portrait: 'lead',
            text: '小安，你剛才說已經把公開連結停用了。很好，我們現在立刻做異常通報紀錄。通報時要把關鍵資訊講清楚，你打算怎麼說明？',
            choices: [
              {
                label: '完整交代四要素：發現時間、涉及檔案範圍、使用的雲端系統與已停權現況（含轉傳待確認）',
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
                      text: `阿明組長，我整理好了：\n① 發現時間：約 ${e.misshareTimeStr || '15:46'} 收到蘇小姐回信時發現。\n② 涉及資料：ClearSky_TestData 內含原始量測數據與未審製程筆記。\n③ 使用系統：實驗室雲端分享連結（原誤設為持連結者皆可存取）。\n④ 目前情況：已停用公開連結並請對方勿轉傳，但協力廠商是否已取得檔案仍待追蹤確認。`
                    },
                    {
                      speaker: '負責人 阿明組長',
                      portrait: 'lead',
                      text: '非常好，資訊很完整，我馬上同步知會資訊／資安窗口並聯絡星海科技主管確認是否留存或轉傳。'
                    },
                    {
                      speaker: '負責人 阿明組長',
                      portrait: 'lead',
                      text: '另外提醒你，NDA-CS-2026 只涵蓋「會議用兩張摘要圖」給星海科技專案窗口開會使用。若待會要補寄，記得先跟阿文確認核准版再設定限定對象寄出。'
                    }
                  ]);
                }
              },
              {
                label: '只說「剛剛好像傳錯連結，但我已經關掉了應該沒事」',
                onSelect: () => {
                  window.BS.UI.startDialogue([
                    {
                      speaker: '負責人 阿明組長',
                      portrait: 'lead',
                      text: '等等，只說「關掉了」不夠喔！如果不記錄「發現時間、涉及哪些資料、透過哪個系統分享、目前處置與轉傳風險」，後續資安窗口和合作方都沒辦法精準追蹤。再重新跟我完整回報一次吧！'
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
          label: '確認晴空計畫的保密約定（NDA）與對外提供範圍',
          onSelect: () => {
            state.clues.ndaScope = true;
            ctx.advanceTime(3);
            ctx.refreshHUD();
            window.BS.Audio.success();
            window.BS.UI.startDialogue([
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: '我幫你翻一下專案資料夾……嗯，星海科技簽的是「NDA-CS-2026」。'
              },
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: '這份約定只涵蓋「階段進度會議用的兩張核准摘要圖」，接收對象限星海科技專案團隊（蘇小姐），不包含原始量測數據和製程筆記，也未授權轉傳給協力廠商。'
              },
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: '分享連結時記得設成「指定收件人唯讀」並加上到期日（例如 7 天）。若不確定核准版圖檔在哪，去實驗區問問阿文！'
              }
            ]);
          }
        });
      } else {
        choices.push({
          label: '再次確認 NDA-CS-2026 的重點',
          onSelect: () => {
            window.BS.UI.startDialogue([
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: '重點三個：只給會議所需的兩張核准圖、限星海科技蘇小姐檢視、設定分享期限。寄出後記得在交班紀錄寫清楚實際提供的版本與對象。'
              }
            ]);
          }
        });
      }

      choices.push({
        label: '詢問訪客拍照的注意事項',
        onSelect: () => {
          window.BS.UI.startDialogue([
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '陳先生今天預約參訪，接待處有登記簿。最單純的方式是在訪客入口指定角度拍形象牆；若真的要陪同進實驗區拍照，千萬要先巡過白板、螢幕跟樣品架標籤！'
            }
          ]);
        }
      });

      if (state.visitor.status === 'done_lab_leaked') {
        choices.push({
          label: '回報：剛才訪客在實驗區拍照時拍進了敏感資訊…',
          onSelect: () => {
            window.BS.UI.startDialogue([
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: `感謝你主動告知！拍進「${state.visitor.leakedItems.join('、')}」確實有外洩疑慮，我會立刻聯絡陳先生說明並請對方協助刪除原圖。記得把這件事寫進交班紀錄喔。`
              }
            ]);
          }
        });
      }

      choices.push({ label: '先忙別的事', onSelect: () => {} });

      window.BS.UI.startDialogue([
        {
          speaker: '負責人 阿明組長',
          portrait: 'lead',
          text: e.reportedToLead
            ? '異常通報我已經立案追蹤了。辛苦你及早回報，其他值班任務處理完就可以交班囉。'
            : '小安，快四點了，合作方的信和入口的訪客都還順利嗎？有要確認的隨時問我。',
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
            text: '幸好你有先來問！原本的 ClearSky_TestData 資料夾裡還塞著原始量測數據（RAW）和我寫到一半的製程筆記草稿，千萬別整個資料夾直接丟出去！'
          },
          {
            speaker: '同事 阿文',
            portrait: 'colleague',
            text: '我剛剛已經把核准可以對外給的兩張圖獨立整理成「ClearSky_會議用摘要圖_v2」放在系統裡了。你回電腦重看就會看到這個選項！'
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
              ? `會議用兩張圖已經放好在電腦裡了（ClearSky_會議用摘要圖_v2）。對了，實驗區裡還有「${exposed.join('、')}」露在外面，有訪客進來拍照記得先遮蔽或收妥！`
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
          text: '白板上寫著晴空計畫最新的「配方比例 14.2%、退火溫度 380°C/4h」和結構草圖。若訪客在實驗區拍照，這些資訊會清清楚楚入鏡。',
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
          speaker: '訪客接待處（登記簿）',
          portrait: 'reception',
          text: '【今日預約登記】\n來訪人員：陳先生（外校參訪來賓）｜時間：15:30\n核准活動範圍：訪客入口形象牆拍照留念；若進入實驗區須由值班人員全程陪同，且拍攝前須確認畫面無未遮蔽之研究資訊。'
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
                label: '改帶陳先生回訪客入口指定角度拍攝',
                onSelect: () => {
                  ctx.moveNpcTo('npc_visitor', 18, 13, 'up');
                  v.pausedAndFixed = true;
                  launchCh1Camera(state, 'entrance');
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
                text: '（會公開放在網頁上！那更不能讓實驗區裡還沒收好的研究資料入鏡。）'
              }
            ], () => handleCh1Visitor(state));
          }
        });
      }

      choices.push({
        label: '引導在「訪客入口指定角度」拍形象牆照片（核准範圍）',
        onSelect: () => launchCh1Camera(state, 'entrance')
      });

      choices.push({
        label: '陪同進入「實驗區」查看取景畫面並拍攝',
        onSelect: () => {
          v.status = 'in_lab';
          ctx.moveNpcTo('npc_visitor', 15, 8, 'up');
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.UI.startDialogue([
            {
              speaker: '小安',
              portrait: 'player',
              text: '好的，請您跟我一起刷卡進入實驗區，並請先讓我確認一下相機的取景預覽畫面。'
            }
          ], () => launchCh1Camera(state, 'lab'));
        }
      });

      choices.push({ label: '請陳先生稍等一下（先看接待處或實驗區）', onSelect: () => {} });

      window.BS.UI.startDialogue([
        {
          speaker: '訪客 陳先生',
          portrait: 'visitor',
          text: state.clues.visitorPurpose
            ? '照片會放進公開參訪報告裡。請問我們要在入口這裡拍，還是可以進去實驗區拍一張呢？'
            : '你好！我是預約三點半參訪的陳先生，想拍一張實驗室的照片當參訪紀錄，請問可以進去實驗區拍嗎？',
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
              text: '陳先生不好意思，先暫停一下下！背景拍到正在進行中的研究資料，我先去把白板、螢幕跟樣品標籤收妥，整理好馬上幫您拍！'
            },
            {
              speaker: '訪客 陳先生',
              portrait: 'visitor',
              text: '沒問題，保密最重要！我在實驗區門口這裡等您，整理好再叫我。'
            }
          ]);
        },

        onSwitchToEntrance() {
          state.visitor.pausedAndFixed = true;
          ctx.moveNpcTo('npc_visitor', 18, 13, 'up');
          ctx.refreshHUD();
          window.BS.UI.startDialogue([
            {
              speaker: '小安',
              portrait: 'player',
              text: '陳先生，實驗區裡面目前還有未收妥的研究資料，我們改回訪客入口的形象牆指定角度拍，光線跟招牌也更好看喔！'
            }
          ], () => launchCh1Camera(state, 'entrance'));
        },

        onShoot(shootMode, leakedItems) {
          ctx.advanceTime(3);
          if (shootMode === 'entrance') {
            state.visitor.status = 'done_entrance';
            state.visitor.photoSpot = '訪客入口形象牆（核准角度）';
            state.visitor.leakedItems = [];
            ctx.moveNpcTo('npc_visitor', 18, 13, 'up');
            ctx.refreshHUD();
            window.BS.Audio.success();
            window.BS.UI.startDialogue([
              {
                speaker: '訪客 陳先生',
                portrait: 'visitor',
                text: '喀嚓！這張形象牆拍起來很專業耶，完全符合我們的參訪紀錄需求，謝謝你！'
              }
            ]);
          } else if (leakedItems.length === 0) {
            state.visitor.status = 'done_lab_clean';
            state.visitor.photoSpot = '實驗區（全程陪同並完成清場）';
            state.visitor.leakedItems = [];
            ctx.moveNpcTo('npc_visitor', 18, 13, 'up');
            ctx.refreshHUD();
            window.BS.Audio.success();
            window.BS.UI.startDialogue([
              {
                speaker: '訪客 陳先生',
                portrait: 'visitor',
                text: '喀嚓！畫面既看得出實驗室環境，又完全保護了研究機密。謝謝你細心陪同，我回到入口處準備離開囉！'
              }
            ]);
          } else {
            state.visitor.status = 'done_lab_leaked';
            state.visitor.photoSpot = '實驗區（未完成清場）';
            state.visitor.leakedItems = leakedItems.slice();
            ctx.moveNpcTo('npc_visitor', 18, 13, 'up');
            ctx.refreshHUD();
            window.BS.Audio.alert();
            window.BS.UI.showToast(`⚠ 注意：照片已拍入「${leakedItems.join('、')}」！`, true, 4500);
            window.BS.UI.startDialogue([
              {
                speaker: '小安',
                portrait: 'player',
                text: `喀嚓……慘了，放大剛才的預覽，背景真的把「${leakedItems.join('、')}」都拍進去了……待會一定要記錄在交班並告訴阿明組長。`
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
                label: '📑 重新檢視本次交班紀錄',
                onSelect: () => {
                  const result = window.BS.State.evaluateHandover(state);
                  window.BS.UI.openHandoverModal(result, {
                    onReplay: () => ctx.restartChapter(),
                    onReturnMenu: () => ctx.returnToMenu()
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
            text: `現在還不能交班下班喔！還有待處理事項：\n• ${missing.join('\n• ')}\n\n先完成這兩件事再回來填寫交班紀錄吧！（也可點右上角「📋 筆記」隨時查看進度）`
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
                if (result.ending.id === 'alarm_handover') {
                  window.BS.Audio.alert();
                } else {
                  window.BS.Audio.fanfare();
                }
                window.BS.UI.openHandoverModal(result, {
                  onReplay: () => ctx.restartChapter(),
                  onReturnMenu: () => ctx.returnToMenu()
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
          portrait: 'colleague',
          text: '小安，太好了你還沒走！我正在趕明天研討會要用的海報。\n「我把上次合作會議的圖放進海報了。今晚要交，你可以幫我看一下嗎？」'
        },
        {
          speaker: '同事 阿文',
          portrait: 'colleague',
          text: '海報草稿我已經存到辦公區電腦裡了。我先回實驗區整理手邊的圖檔，如果有圖片需要確認來源或換圖，再過來實驗區找我！'
        },
        {
          speaker: '小安',
          portrait: 'player',
          text: '晚上六點了，公開研討會海報可不能馬虎。先去辦公區電腦看看草稿有三張什麼圖，也可以找實驗區的阿文和辦公區的阿明組長確認！'
        }
      ], () => {
        // Move 阿文 back to his Lab bench so player walks to 實驗區的阿文 for clues
        ctx.moveNpcTo('npc_colleague', 20, 6, 'left');
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
              text: `已將「${ver.filename}」送出給阿明組長審閱！\n（圖一：設備配置示意保留／圖二：已替換為替代圖／圖三：已移除）`
            },
            {
              speaker: '小安',
              portrait: 'player',
              text: '現在走過去找辦公區的阿明組長，請他正式確認核准這個版本吧！'
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
              text: `已選擇「暫緩上傳」並留存紀錄。\n待確認項目：\n• ${reasons.join('\n• ')}`
            },
            {
              speaker: '小安',
              portrait: 'player',
              text: '在還沒確認清楚公開授權跟專利安排之前，先暫緩投稿比較穩妥。回值班桌把原因與下一步寫進交班紀錄吧！'
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
                text: `✅ 上傳成功！已提交「${ver.filename}」（核准狀態：阿明組長於 ${ver.approvedAt} 確認核准）。\n系統已回傳收件編號與版本雜湊紀錄。`
              },
              {
                speaker: '小安',
                portrait: 'player',
                text: '核對過檔名與核准狀態再按送出，心裡踏實多了！去值班桌填寫交班紀錄就能安心下班囉。'
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
                text: `⚠ 上傳完成回執顯示你提交的是「${ver.filename}」（狀態：${meta}）！\n內容摘要：${ver.summary}`
              },
              {
                speaker: '小安',
                portrait: 'player',
                text: '糟了！！不小心選成還沒核准的版本上傳給主辦方了！\n現在馬上回電腦聯絡研討會主辦方提出撤換請求，並且立刻找辦公區的阿明組長回報！'
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
                }`
              },
              {
                speaker: '負責人 阿明組長',
                portrait: 'lead',
                text: c.contactedOrganizer
                  ? '你第一時間提出撤換又立刻回報，處置非常正確！在主辦方正式確認下架或替換之前，交班紀錄務必維持「公開狀態待確認」，我明天一早也會親自盯緊主辦方回覆。'
                  : '感謝你馬上來講！請立刻回辦公區電腦聯絡主辦方提出撤換請求，把「已提出撤換請求，公開狀態待確認」記進交班紀錄，我這邊同步啟動追蹤！'
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
                  text: `我檢視過了：\n• 圖一「設備配置示意」：已確認可公開。\n• 圖二：已替換為阿文的自研校準趨勢示意圖，不含合作方機密數據。\n• 圖三「測試條件與結果摘要」：已從本次公開版移除。`
                },
                {
                  speaker: '負責人 阿明組長',
                  portrait: 'lead',
                  text: `沒問題！我正式核准「${approved.filename}」。\n記住兩件事：第一，核准只綁定這個版本，之後若又再編輯會變成待重新確認的新版；第二，回電腦上傳時務必核對檔名，別不小心挑到舊的 v1 草稿喔！`
                }
              ]);
            }
          });
        }
      }

      // Standard Clue Questions
      choices.push({
        label: '現在哪張圖能用？',
        onSelect: () => {
          c.clues.mingExplainedRules = true;
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.Audio.select();
          window.BS.UI.startDialogue([
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '我逐張跟你說明喔：\n① 圖一「設備配置示意」：已經確認可以公開，直接保留沒問題。\n② 圖二「合作方量測圖」：那上次是合作會議用的，還沒確認合作約定是否涵蓋公開海報，不能直接放上去！你可以找實驗區的阿文拿可送審的替代圖。'
            },
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '③ 圖三「測試條件與結果摘要」：涉及尚待確認的專利申請安排，如果太早公開可能影響專利新穎性。今晚公開時點還沒辦法確定，你可以先把它從這次公開版本移除；或者若認為資訊不足，也可以選擇暫緩投稿。'
            }
          ]);
        }
      });

      choices.push({
        label: '整理好之後怎麼確認版本？',
        onSelect: () => {
          c.clues.mingExplainedVersion = true;
          ctx.advanceTime(2);
          ctx.refreshHUD();
          window.BS.Audio.select();
          window.BS.UI.startDialogue([
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '你在辦公區電腦把圖二替換、圖三移除後，點「送交阿明組長確認」，再過來找我核准。'
            },
            {
              speaker: '負責人 阿明組長',
              portrait: 'lead',
              text: '特別注意：我的核准只綁定當時送審的那個版本。核准後如果又改動海報，系統會產生「待重新確認」的新版本，必須重新送審。最後上傳檔案時，也要仔細核對檔名與核准狀態，別誤傳成原始草稿！'
            }
          ]);
        }
      });

      choices.push({ label: '先回電腦處理海報', onSelect: () => {} });

      window.BS.UI.startDialogue([
        {
          speaker: '負責人 阿明組長',
          portrait: 'lead',
          text: c.misuploaded && c.reportedToLead
            ? '誤傳事件我已經記下來追蹤了。記得確認主辦方撤換請求送出，再回值班桌寫交班紀錄喔。'
            : '小安，聽阿文說今晚要交研討會海報。對外公開前一定要確認兩件事：合作資料是否授權公開，以及有沒有卡到專利申請安排！',
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
                label: '📑 重新檢視第二章交班紀錄',
                onSelect: () => {
                  const result = window.BS.State.evaluateChapter2Handover(state);
                  window.BS.UI.openHandoverModal(result, {
                    onReplay: () => ctx.restartChapter(),
                    onReturnMenu: () => ctx.returnToMenu()
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
            text: '研討會海報還沒做出決定喔！\n請先到辦公區電腦檢視海報草稿，並向實驗區的阿文與辦公區的阿明組長確認後，再決定「核准後提交」或「暫緩上傳」。'
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
          choices: [
            {
              label: unfinishedRemedy ? '✍ 仍先填寫交班紀錄（列出尚待處理事項）' : '✍ 填寫交班紀錄並檢視結果',
              onSelect: () => {
                state.handoverDone = true;
                state.timeMinutes = Math.max(state.timeMinutes, 18 * 60 + 25);
                ctx.refreshHUD();
                const result = window.BS.State.evaluateChapter2Handover(state);
                if (unfinishedRemedy) {
                  window.BS.Audio.alert();
                } else {
                  window.BS.Audio.fanfare();
                }
                window.BS.UI.openHandoverModal(result, {
                  onReplay: () => ctx.restartChapter(),
                  onReturnMenu: () => ctx.returnToMenu()
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

    return {
      playIntro,
      interact
    };
  }

  window.BS.Story = {
    createStoryController
  };
})();
