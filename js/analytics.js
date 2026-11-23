(function () {
  window.BS = window.BS || {};

  // =========================================================================
  // Google Analytics 4 (GA4) Configuration
  // =========================================================================
  // Formal Measurement ID provided by Google Analytics 4
  const MEASUREMENT_ID = 'G-WDMF1EC65J';

  let isInitialized = false;
  let isProduction = false;

  // Stable chapter mapping: aligns internal chapter code with user-facing chapter order:
  // - 第1章 寄出之前 (內部代號 1) -> 'ch1'
  // - 第2章 投稿前一晚 (內部代號 2) -> 'ch2'
  // - 第3章 這份文件要怎麼標？ (內部代號 5) -> 'ch3'
  // - 第4章 這批資料要列入清單嗎？ (內部代號 4) -> 'ch4'
  // - 第5章 阿文的最後一天 (內部代號 3) -> 'ch5'
  const CHAPTER_ID_MAP = {
    1: 'ch1',
    2: 'ch2',
    5: 'ch3',
    4: 'ch4',
    3: 'ch5'
  };

  /**
   * Strictly verifies whether the current environment matches formal deployment rules:
   * 1. Protocol is HTTPS
   * 2. Hostname is exactly 'tommy1114-commits.github.io'
   * 3. Pathname is '/before-sending/' or '/before-sending/index.html'
   */
  function checkProductionEnvironment() {
    try {
      const loc = window.location;
      const isHttps = loc.protocol === 'https:';
      const isHostname = loc.hostname === 'tommy1114-commits.github.io';
      const isPath = loc.pathname === '/before-sending/' || loc.pathname === '/before-sending/index.html';
      return isHttps && isHostname && isPath;
    } catch {
      return false;
    }
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;
    isProduction = checkProductionEnvironment();

    const hasValidId = Boolean(MEASUREMENT_ID && MEASUREMENT_ID.startsWith('G-'));

    if (isProduction && hasValidId) {
      try {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() {
          window.dataLayer.push(arguments);
        }
        window.gtag = gtag;

        gtag('js', new Date());

        const configOptions = {
          send_page_view: false // Cloudflare Web Analytics handles page views
        };

        // If URL has ?debug_mode=true, activate GA4 DebugView
        if (window.location.search && window.location.search.includes('debug_mode=true')) {
          configOptions.debug_mode = true;
        }

        gtag('config', MEASUREMENT_ID, configOptions);
      } catch (err) {
        console.warn('[Analytics] Failed to initialize Google Analytics:', err);
      }
    }
  }

  /**
   * Internal event dispatcher
   */
  function trackEvent(eventName, params) {
    if (!eventName) return;

    if (isProduction && typeof window.gtag === 'function') {
      try {
        window.gtag('event', eventName, params);
      } catch (e) {
        console.warn('[Analytics] Error sending gtag event:', e);
      }
    } else {
      // Local testing / simulation logger (only logs to console, no network requests)
      console.log(`[Analytics Mock] event: ${eventName}`, params);
    }
  }

  function getChapterId(chapter) {
    if (typeof chapter === 'string' && chapter.startsWith('ch')) return chapter;
    return CHAPTER_ID_MAP[chapter] || `ch${chapter}`;
  }

  /**
   * Records chapter start for a round.
   * Guarded so moving between floors, pausing, or notes never duplicate events.
   */
  function trackChapterStart(state) {
    if (!state) return;
    if (state._analyticsStartTracked) return;
    state._analyticsStartTracked = true;

    const chapterId = getChapterId(state.chapter);
    trackEvent('chapter_start', {
      chapter_id: chapterId
    });
  }

  /**
   * Records chapter completion for a round.
   * Guarded so inspecting endings or reopening handover notes never duplicates events.
   */
  function trackChapterComplete(state) {
    if (!state) return;
    if (state._analyticsCompleteTracked) return;
    state._analyticsCompleteTracked = true;

    const chapterId = getChapterId(state.chapter);
    trackEvent('chapter_complete', {
      chapter_id: chapterId
    });
  }

  window.BS.Analytics = {
    init,
    trackChapterStart,
    trackChapterComplete,
    getChapterId,
    getMeasurementId: () => MEASUREMENT_ID,
    isProduction: () => isProduction,
    isInitialized: () => isInitialized,
    CHAPTER_ID_MAP
  };

  // Safe auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
