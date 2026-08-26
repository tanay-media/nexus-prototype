/* Keyword block widget model — aligns with Keyword Blocks PRD (Base + Serving sync). */
(function (global) {
  function defaultMetadata() {
    return {
      description: "",
      image_urls: [],
      video_urls: [],
      options: [],
      max_ads: null
    };
  }

  function defaultMaxAdsPerKeyword() {
    return 1;
  }

  function resolveMaxAdsForKeyword(widget, keyword) {
    var widgetMax = widget.max_ads_per_keyword != null ? widget.max_ads_per_keyword : defaultMaxAdsPerKeyword();
    var meta = keyword && keyword.metadata ? keyword.metadata : {};
    if (meta.max_ads != null && meta.max_ads !== "") {
      var n = parseInt(meta.max_ads, 10);
      if (!isNaN(n) && n > 0) return n;
    }
    return widgetMax;
  }

  function makeKeyword(keyword_term, display_term, status, metadata) {
    var meta = metadata || defaultMetadata();
    return {
      keyword_term: keyword_term,
      display_term: display_term || keyword_term,
      status: status || "on",
      metadata: meta
    };
  }

  function buildGenPayload(widget) {
    return {
      widget_type: "keyword_block",
      widget_name: widget.widget_name,
      slot_config: widget.slot_config || "static",
      max_ads_per_keyword: widget.max_ads_per_keyword != null ? widget.max_ads_per_keyword : defaultMaxAdsPerKeyword(),
      keywords: (widget.keywords || []).map(function (k) {
        return {
          keyword_term: k.keyword_term,
          display_term: k.display_term,
          status: k.status,
          metadata: k.metadata || defaultMetadata()
        };
      })
    };
  }

  function buildBaseWidget(widget) {
    return {
      widget_id: widget.widget_id,
      widget_type: "keyword_block",
      widget_name: widget.widget_name,
      status: widget.status || "active",
      used_in: widget.used_in || [],
      ad_provider_config: {
        advertiser_id: widget.ad_provider_config && widget.ad_provider_config.advertiser_id
          ? widget.ad_provider_config.advertiser_id
          : widget.advertiser_id || ""
      },
      slot_config: widget.slot_config || "static",
      max_ads_per_keyword: widget.max_ads_per_keyword != null ? widget.max_ads_per_keyword : defaultMaxAdsPerKeyword(),
      keywords: widget.keywords || []
    };
  }

  /** Base → Serving sync: keywords with keyword_term, display_term, metadata; no status fields. */
  function buildServingSync(widget) {
    var base = buildBaseWidget(widget);
    if (base.status === "inactive") return null;
    return {
      widget_id: base.widget_id,
      widget_type: base.widget_type,
      ad_provider_config: base.ad_provider_config,
      slot_config: base.slot_config,
      max_ads_per_keyword: base.max_ads_per_keyword,
      keywords: base.keywords
        .filter(function (k) { return k.status === "on"; })
        .map(function (k) {
          return {
            keyword_term: k.keyword_term,
            display_term: k.display_term,
            metadata: k.metadata || defaultMetadata()
          };
        })
    };
  }

  var READER_QUESTIONS = {
    "passive income investing": "How do I start earning passive income from investing?",
    "etf zero fee platform": "What's the best platform to buy ETFs with zero fees?",
    "beginner investing start": "I'm a beginner - where do I even start?",
    "open brokerage account fast": "How quickly can I open and fund a brokerage account?",
    "auto insurance savings": "How much can I save on auto insurance in my state?",
    "compare car insurance quotes": "What's the fastest way to compare quotes online?",
    "cheap full coverage insurance": "Who has the cheapest full coverage near me?",
    "switch auto insurance carrier": "How do I switch carriers without a coverage gap?",
    "zero fee etf platform": "What platform has zero-fee ETFs?",
    "index fund beginner": "Best index funds for beginners?"
  };

  var SAMPLE_ADS = {
    "passive income investing": { ad_title: "E*TRADE® Account Setup", display_url: "us.etrade.com", ad_description: "Open an account and place trades on desktop & mobile.", cta_label: "Open Account" },
    "etf zero fee platform": { ad_title: "Fidelity Zero ETFs", display_url: "fidelity.com", ad_description: "Zero expense ratio index ETFs.", cta_label: "Start investing" },
    "beginner investing start": { ad_title: "Schwab for Beginners", display_url: "schwab.com", ad_description: "Learn basics and open an account.", cta_label: "Get started" },
    "open brokerage account fast": { ad_title: "Robinhood Sign Up", display_url: "robinhood.com", ad_description: "Open and fund from your phone.", cta_label: "Sign up" },
    "auto insurance savings": { ad_title: "Compare Auto Rates", display_url: "quotes.example.com", ad_description: "See rates from top carriers in 60 seconds.", cta_label: "Compare My Rates" },
    "compare car insurance quotes": { ad_title: "Insurance Quote Hub", display_url: "quotes.example.com", ad_description: "Side-by-side quotes, no spam calls.", cta_label: "Get quotes" },
    "cheap full coverage insurance": { ad_title: "Full Coverage Deals", display_url: "quotes.example.com", ad_description: "Licensed carriers in all 50 states.", cta_label: "See rates" },
    "switch auto insurance carrier": { ad_title: "Switch & Save", display_url: "quotes.example.com", ad_description: "Switch without losing coverage.", cta_label: "Compare now" },
    "zero fee etf platform": { ad_title: "Fidelity Zero ETFs", display_url: "fidelity.com", ad_description: "Trade zero-fee index ETFs.", cta_label: "Start investing" },
    "index fund beginner": { ad_title: "Fidelity Index Funds", display_url: "fidelity.com", ad_description: "Low-cost index funds for new investors.", cta_label: "Explore funds" }
  };

  var SAMPLE_ADS_ALT = {
    "passive income investing": { ad_title: "Fidelity® Investing — Zero account fees", display_url: "fidelity.com", ad_description: "Commission-free ETFs and research tools.", cta_label: "Open Account" },
    "auto insurance savings": { ad_title: "Geico — 15 minutes could save you 15%", display_url: "geico.com", ad_description: "Get a fast auto insurance quote online.", cta_label: "Get quote" }
  };

  function macroPrefix(slotIndex, adIndex) {
    return "slot" + slotIndex + "_ad" + (adIndex || 1);
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /** Prototype: simulates Serving preview → CM fetch for one or more ads on a keyword slot. */
  function fetchServingPreviewAds(opts) {
    var keyword_term = opts && opts.keyword_term ? opts.keyword_term : "";
    var slotIndex = opts && opts.slotIndex ? opts.slotIndex : 1;
    var maxAds = opts && opts.maxAds ? opts.maxAds : 1;
    var advertiserId = opts && opts.advertiser_id ? opts.advertiser_id : "";
    var delay = opts && opts.delay != null ? opts.delay : 420;
    var count = Math.max(1, Math.min(maxAds, 5));
    return new Promise(function (resolve) {
      setTimeout(function () {
        var ads = [];
        for (var m = 1; m <= count; m += 1) {
          var sample = m === 1 ? SAMPLE_ADS[keyword_term] : SAMPLE_ADS_ALT[keyword_term];
          if (!sample && m > 1) break;
          var macro = macroPrefix(slotIndex, m);
          var adv = ADVERTISERS[advertiserId];
          var trackingBase = sample ? sample.display_url : "advertiser.com";
          ads.push(sample
            ? {
                macro: macro,
                keyword_term: keyword_term,
                keyword_slot_id: slotIndex,
                ad_index: m,
                ad_title: sample.ad_title,
                display_url: sample.display_url,
                ad_description: sample.ad_description,
                tracking_url: "https://preview.max.example/click?macro=" + macro + "&cmp=" + (adv ? adv.campaignId : "preview"),
                cta_label: sample.cta_label,
                fetch_status: "ok"
              }
            : {
                macro: macro,
                keyword_term: keyword_term,
                keyword_slot_id: slotIndex,
                ad_index: m,
                ad_title: "Ad " + m + " for “" + keyword_term + "”",
                display_url: trackingBase,
                ad_description: "Resolved from CM via Serving preview.",
                tracking_url: "https://preview.max.example/click?macro=" + macro + "&term=" + encodeURIComponent(keyword_term),
                cta_label: "Learn more",
                fetch_status: "ok"
              });
        }
        resolve(ads);
      }, delay);
    });
  }

  function fetchServingPreviewAd(opts) {
    return fetchServingPreviewAds(opts).then(function (ads) { return ads[0] || null; });
  }

  function keywordSlotMacroExamples(slotIndex) {
    var n = slotIndex || 1;
    return {
      description: "{{slot" + n + ".keyword_description}}",
      image: "{{slot" + n + ".keyword_image_url}}",
      video: "{{slot" + n + ".keyword_video_url}}",
      adTitle: "{{slot" + n + "_ad1.ad_title}}"
    };
  }

  function renderKeywordMetaPreviewHtml(slot, slotIndex) {
    if (!slot || !slot.metadata) return "";
    var meta = slot.metadata;
    var macros = keywordSlotMacroExamples(slotIndex);
    var img = meta.image_urls && meta.image_urls[0];
    var vid = meta.video_urls && meta.video_urls[0];
    var parts = [];
    if (meta.description) {
      parts.push('<p class="kb-keyword-meta__desc"><span class="kb-keyword-meta__macro">' + escapeHtml(macros.description) + '</span>' + escapeHtml(meta.description) + "</p>");
    }
    if (img) {
      parts.push('<div class="kb-keyword-meta__img"><img src="' + escapeHtml(img) + '" alt="" /><span class="kb-keyword-meta__macro">' + escapeHtml(macros.image) + "</span></div>");
    }
    if (vid) {
      var isDataVid = vid.indexOf("data:") === 0;
      parts.push(
        '<div class="kb-keyword-meta__video">' +
          (isDataVid
            ? '<video src="' + escapeHtml(vid) + '" controls muted playsinline class="kb-keyword-meta__video-el"></video>'
            : '<p class="muted" style="font-size:10px;margin:0;">Video attached</p>') +
          '<span class="kb-keyword-meta__macro">' + escapeHtml(macros.video) + "</span></div>"
      );
    }
    if (!parts.length) return "";
    return '<div class="kb-keyword-meta">' + parts.join("") + "</div>";
  }

  function renderServingAdPanelsHtml(ads, opts) {
    if (!ads || !ads.length) return renderServingAdPanelHtml(null, opts);
    if (opts && opts.loading) return renderServingAdPanelHtml(null, { loading: true });
    return ads.map(function (ad) { return renderServingAdPanelHtml(ad); }).join("");
  }

  function renderServingAdPanelHtml(ad, opts) {
    if (!ad) return "";
    var loading = opts && opts.loading;
    if (loading) {
      return (
        '<div class="kb-ad-panel kb-ad-panel--loading" aria-busy="true">' +
          '<span class="kb-ad-panel__label kb-ad-panel__label--live">Serving</span>' +
          '<p class="kb-ad-panel__fetching">Fetching ad from CM…</p>' +
        '</div>'
      );
    }
    if (ad.fetch_status === "empty" || ad.fetch_status === "error") {
      return (
        '<div class="kb-ad-panel kb-ad-panel--empty">' +
          '<span class="kb-ad-panel__label">Serving</span>' +
          '<p class="kb-ad-panel__fetching">No ad returned (' + escapeHtml(ad.fetch_status) + ').</p>' +
        '</div>'
      );
    }
    return (
      '<div class="kb-ad-panel" data-macro="' + escapeHtml(ad.macro) + '">' +
        '<span class="kb-ad-panel__label kb-ad-panel__label--live">Live · Serving</span>' +
        '<div class="kb-ad-panel__macro muted" style="font-size:10px;margin-bottom:4px;">{{' + escapeHtml(ad.macro + ".ad_title") + '}}</div>' +
        '<div class="kb-ad-panel__title">' + escapeHtml(ad.ad_title) + '</div>' +
        '<div class="kb-ad-panel__url">' + escapeHtml(ad.display_url) + '</div>' +
        '<p class="kb-ad-panel__desc">' + escapeHtml(ad.ad_description) + '</p>' +
        '<button type="button" class="kb-ad-panel__cta" disabled>' + escapeHtml(ad.cta_label) + ' → preview MAX</button>' +
      '</div>'
    );
  }

  var KB_WIDGET_PASSIVE = "7f3a8b2c-4d5e-6f70-8192-a3b4c5d6e7f8";
  var KB_WIDGET_AUTO = "8e4b9c3d-5e6f-7081-9203-b4c5d6e7f809";
  var KB_WIDGET_FIDELITY = "9f5c0d4e-6f7a-8193-a031-c5d6e7f8e910";

  var KEYWORD_PRESETS = {
    passive: [
      makeKeyword("passive income investing", "passive income investing", "on", {
        description: "Long-term passive income strategies for retail investors.",
        image_urls: ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=320&h=180&fit=crop"],
        video_urls: [],
        options: [],
        max_ads: null
      }),
      makeKeyword("etf zero fee platform", "zero fee ETFs", "on"),
      makeKeyword("beginner investing start", "beginner investing", "on"),
      makeKeyword("open brokerage account fast", "open brokerage fast", "on")
    ],
    auto: [
      makeKeyword("auto insurance savings", "auto insurance savings", "on"),
      makeKeyword("compare car insurance quotes", "compare quotes", "on"),
      makeKeyword("cheap full coverage insurance", "cheap full coverage", "on"),
      makeKeyword("switch auto insurance carrier", "switch carrier", "on")
    ],
    fidelity: [
      makeKeyword("zero fee etf platform", "zero fee ETFs", "on"),
      makeKeyword("index fund beginner", "index funds", "on")
    ]
  };

  var PAST_KEYWORD_SAMPLES = {
    passive: [
      makeKeyword("dividend growth stocks", "dividend growth", "off", {
        description: "Dividend-focused equity strategies for long-term holders.",
        image_urls: ["https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=320&h=180&fit=crop"],
        video_urls: [],
        options: [],
        max_ads: null
      }),
      makeKeyword("roth ira contribution limits", "roth ira limits", "off", {
        description: "Annual Roth IRA contribution rules and eligibility.",
        image_urls: [],
        video_urls: [],
        options: [],
        max_ads: null
      }),
      makeKeyword("tax loss harvesting guide", "tax loss harvesting", "off", {
        description: "Offset portfolio gains with strategic loss harvesting.",
        image_urls: ["https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=320&h=180&fit=crop"],
        video_urls: [],
        options: [],
        max_ads: null
      }),
      makeKeyword("retirement withdrawal strategy", "retirement withdrawals", "off", {
        description: "Sustainable withdrawal rates for retirement portfolios.",
        image_urls: [],
        video_urls: [],
        options: [],
        max_ads: null
      })
    ],
    auto: [
      makeKeyword("teen driver insurance rates", "teen driver rates", "off", {
        description: "Coverage options when adding a teen to your policy.",
        image_urls: ["https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=320&h=180&fit=crop"],
        video_urls: [],
        options: [],
        max_ads: null
      }),
      makeKeyword("bundled home auto discount", "bundle discount", "off", {
        description: "Save by bundling home and auto with one carrier.",
        image_urls: [],
        video_urls: [],
        options: [],
        max_ads: null
      }),
      makeKeyword("sr22 insurance filing", "sr22 filing", "off", {
        description: "What SR-22 means and how to get reinsured.",
        image_urls: [],
        video_urls: [],
        options: [],
        max_ads: null
      })
    ]
  };

  var ADVERTISERS = {
    "adv-etrade": { label: "E*TRADE", teamOfferId: "to_etrade_passive", campaignId: "MAX-CMP-9912", dealValue: "$12.50" },
    "adv-statefarm": { label: "State Farm", teamOfferId: "to_auto_insurance", campaignId: "MAX-CMP-7721", dealValue: "$18.00" },
    "adv-fidelity": { label: "Fidelity", teamOfferId: "to_fidelity_etf", campaignId: "MAX-CMP-8840", dealValue: "$9.75" }
  };

  var WIDGET_REGISTRY = {
    passive: {
      widget_id: KB_WIDGET_PASSIVE,
      widget_name: "Passive investing - keywords",
      status: "active",
      used_in: ["c2d3e4f5-a6b7-4890-1cde-f23456789001"],
      ad_provider_config: { advertiser_id: "adv-etrade" },
      slot_config: "static",
      max_ads_per_keyword: 1,
      keywords: KEYWORD_PRESETS.passive.concat(PAST_KEYWORD_SAMPLES.passive),
      trigger: "Explore reader questions",
      layoutId: "modal_v1"
    },
    auto: {
      widget_id: KB_WIDGET_AUTO,
      widget_name: "Auto insurance - keywords",
      status: "active",
      used_in: ["d3e4f5a6-b7c8-4901-2def-345678901234"],
      ad_provider_config: { advertiser_id: "adv-statefarm" },
      slot_config: "static",
      max_ads_per_keyword: 1,
      keywords: KEYWORD_PRESETS.auto.concat(PAST_KEYWORD_SAMPLES.auto),
      trigger: "See insurance savings",
      layoutId: "modal_v1"
    },
    fidelity: {
      widget_id: KB_WIDGET_FIDELITY,
      widget_name: "Fidelity ETF - keywords",
      status: "active",
      used_in: [],
      ad_provider_config: { advertiser_id: "adv-fidelity" },
      slot_config: "static",
      max_ads_per_keyword: 1,
      keywords: KEYWORD_PRESETS.fidelity.slice(),
      trigger: "Explore ETFs",
      layoutId: "modal_compact"
    }
  };

  function readerQuestionFor(keyword_term) {
    return READER_QUESTIONS[keyword_term] || "Reader question in variant HTML";
  }

  function onKeywordCount(keywords) {
    return (keywords || []).filter(function (k) { return k.status === "on"; }).length;
  }

  global.KbWidgetModel = {
    makeKeyword: makeKeyword,
    defaultMetadata: defaultMetadata,
    defaultMaxAdsPerKeyword: defaultMaxAdsPerKeyword,
    resolveMaxAdsForKeyword: resolveMaxAdsForKeyword,
    buildGenPayload: buildGenPayload,
    buildBaseWidget: buildBaseWidget,
    buildServingSync: buildServingSync,
    READER_QUESTIONS: READER_QUESTIONS,
    SAMPLE_ADS: SAMPLE_ADS,
    macroPrefix: macroPrefix,
    escapeHtml: escapeHtml,
    fetchServingPreviewAd: fetchServingPreviewAd,
    fetchServingPreviewAds: fetchServingPreviewAds,
    renderServingAdPanelsHtml: renderServingAdPanelsHtml,
    renderKeywordMetaPreviewHtml: renderKeywordMetaPreviewHtml,
    keywordSlotMacroExamples: keywordSlotMacroExamples,
    renderServingAdPanelHtml: renderServingAdPanelHtml,
    ADVERTISERS: ADVERTISERS,
    WIDGET_REGISTRY: WIDGET_REGISTRY,
    KEYWORD_PRESETS: KEYWORD_PRESETS,
    PAST_KEYWORD_SAMPLES: PAST_KEYWORD_SAMPLES,
    readerQuestionFor: readerQuestionFor,
    onKeywordCount: onKeywordCount,
    KB_WIDGET_PASSIVE: KB_WIDGET_PASSIVE,
    KB_WIDGET_AUTO: KB_WIDGET_AUTO,
    KB_WIDGET_FIDELITY: KB_WIDGET_FIDELITY
  };
})(window);
