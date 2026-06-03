// Logs · Journeys view — visit → postback → destination-fire tied by visit_id.
// Prototype data: ~20 realistic journeys spanning all states.

(function () {
  // ===== Seed data =====
  // Each journey is one visit_id; postback / destinationFire may be null.
  function ts(s) { return s; } // pass-through; just for readability
  var SEED_JOURNEYS = [
    // ---- Fully successful fires (8) ----
    {
      visitId: "v_a7f239c8", buySource: "facebook",
      visit: {
        ts: "2026-04-21 09:42:11", lander: "Summer Sale", landerId: "summer-sale", variant: "var_ss_03",
        domain: "offers.acme.com", path: "/summer-sale-hero",
        country: "US", device: "Desktop", os: "macOS",
        params: { utm_source: "facebook", utm_medium: "cpc", utm_campaign: "summer_2026_v3", utm_content: "ad_hero_42", fbclid: "fb.1.1775171734000.IwY2xj...", gclid: null },
        clickId: "cl_9f2a17", referer: "https://l.facebook.com/"
      },
      ctaForward: { ts: "2026-04-21 09:42:48", ctaId: "cta_buy_now", zone: "hero-primary", outboundUrl: "https://tracker.acme.com/r?vid=v_a7f239c8&offer=summer_2026&fbclid=fb.1.1775171734000.IwY2xj..." },
      postback: {
        ts: "2026-04-21 09:43:48", conversionId: "cv_x82b40a7e1c",
        conversionType: "purchase", value: 49.99, currency: "USD",
        externalId: "ord_88f12", source: "max",
        raw: { visit_id: "v_a7f239c8", conversion_type: "purchase", value: 49.99, currency: "USD", external_id: "ord_88f12", ts: 1775172228 }
      },
      destinationFire: {
        ts: "2026-04-21 09:43:50", status: "ok", latencyMs: 312,
        destinationId: "cd_meta_prod", destinationName: "Meta — ACME Growth",
        endpoint: "POST graph.facebook.com/v18.0/319847562103948/events",
        request: { data: [{ event_id: "cv_x82b40a7e1c", event_name: "Purchase", event_time: 1775172228, action_source: "website", user_data: { fbc: "fb.1.1775171734000.IwY2xj...", client_ip_address: "107.21.28.235", client_user_agent: "Mozilla/5.0 (Macintosh)" }, custom_data: { value: 49.99, currency: "USD" } }] },
        response: { events_received: 1, messages: [] },
        retries: []
      }
    },
    {
      visitId: "v_b1ce4710", buySource: "facebook",
      visit: { ts: "2026-04-21 09:38:02", lander: "Black Friday", landerId: "black-friday", variant: "var_bf_02", domain: "offers.acme.com", path: "/black-friday-2026", country: "CA", device: "Mobile", os: "iOS",
        params: { utm_source: "facebook", utm_medium: "cpc", utm_campaign: "bf_warmup", fbclid: "fb.1.1775171482000.AbCdEf" }, clickId: "cl_8b1c91", referer: "https://l.facebook.com/" },
      ctaForward: { ts: "2026-04-21 09:38:32", ctaId: "cta_shop", zone: "hero-cta", outboundUrl: "https://tracker.acme.com/r?vid=v_b1ce4710&offer=bf_warmup" },
      postback: { ts: "2026-04-21 09:38:54", conversionId: "cv_p44d9e8201", conversionType: "lead", value: 0, currency: "USD", externalId: "lead_77a3", source: "max", raw: { visit_id: "v_b1ce4710", conversion_type: "lead", external_id: "lead_77a3" } },
      destinationFire: { ts: "2026-04-21 09:38:55", status: "ok", latencyMs: 198, destinationId: "cd_meta_prod", destinationName: "Meta — ACME Growth", endpoint: "POST graph.facebook.com/v18.0/319847562103948/events", request: { data: [{ event_id: "cv_p44d9e8201", event_name: "Lead", event_time: 1775171934, action_source: "website", user_data: { fbc: "fb.1.1775171482000.AbCdEf", client_user_agent: "Mozilla/5.0 (iPhone)" } }] }, response: { events_received: 1, messages: [] }, retries: [] }
    },
    {
      visitId: "v_c3f81920", buySource: "google",
      visit: { ts: "2026-04-21 09:30:44", lander: "Referral Q2", landerId: "referral-q2", variant: "var_rq_01", domain: "refer.acme.com", path: "/q2", country: "US", device: "Desktop", os: "Windows",
        params: { utm_source: "google", utm_medium: "cpc", utm_campaign: "ref_q2_search", gclid: "EAIaIQobChMI-test-1234-5678", fbclid: null }, clickId: "cl_g99f01", referer: "https://www.google.com/" },
      ctaForward: { ts: "2026-04-21 09:31:18", ctaId: "cta_get_demo", zone: "footer", outboundUrl: "https://tracker.acme.com/r?vid=v_c3f81920&offer=referral_q2&gclid=EAIaIQobChMI-test-1234-5678" },
      postback: { ts: "2026-04-21 09:34:21", conversionId: "cv_g7281f3", conversionType: "signup", value: 0, currency: "USD", externalId: "u_42819", source: "max", raw: { visit_id: "v_c3f81920", conversion_type: "signup", external_id: "u_42819" } },
      destinationFire: { ts: "2026-04-21 09:34:22", status: "ok", latencyMs: 421, destinationId: "cd_google_main", destinationName: "Google Ads — main", endpoint: "POST googleads.googleapis.com/v15/customers/2846197723:uploadClickConversions", request: { conversions: [{ conversion_action: "customers/2846197723/conversionActions/8841502", conversion_date_time: "2026-04-21 09:34:21+00:00", gclid: "EAIaIQobChMI-test-1234-5678", order_id: "cv_g7281f3" }], partial_failure_enabled: true }, response: { results: [{ gclid: "EAIaIQobChMI-test-1234-5678", conversion_action: "customers/2846197723/conversionActions/8841502" }], partial_failure_error: null }, retries: [] }
    },
    {
      visitId: "v_e5a91402", buySource: "facebook",
      visit: { ts: "2026-04-21 09:21:18", lander: "Founder Letter", landerId: "founder-letter", variant: "var_fl_01", domain: "offers.acme.com", path: "/founder-letter", country: "UK", device: "Desktop", os: "Windows",
        params: { utm_source: "facebook", utm_medium: "social", fbclid: "fb.1.1775170278000.XyZ8q1" }, clickId: "cl_f2e91a" },
      ctaForward: { ts: "2026-04-21 09:22:38", ctaId: "cta_subscribe", zone: "letter-end", outboundUrl: "https://tracker.acme.com/r?vid=v_e5a91402&offer=founder_letter" },
      postback: { ts: "2026-04-21 09:24:02", conversionId: "cv_l34782", conversionType: "purchase", value: 129, currency: "GBP", externalId: "ord_55a1", source: "max", raw: {} },
      destinationFire: { ts: "2026-04-21 09:24:04", status: "ok", latencyMs: 270, destinationId: "cd_meta_promo", destinationName: "Meta — Holiday promo", endpoint: "POST graph.facebook.com/v18.0/904782156390124/events", request: { data: [{ event_id: "cv_l34782", event_name: "Purchase", custom_data: { value: 129, currency: "GBP" } }], test_event_code: "TEST82910" }, response: { events_received: 1, messages: [] }, retries: [] }
    },
    {
      visitId: "v_f1bd4408", buySource: "tiktok",
      visit: { ts: "2026-04-21 09:14:55", lander: "Partner Announce", landerId: "partner-announce", variant: "var_pa_02", domain: "try.acme.com", path: "/partner", country: "US", device: "Mobile", os: "Android",
        params: { utm_source: "tiktok", utm_medium: "paid", ttclid: "C0gO3-Test1234" }, clickId: "cl_tt8a01" },
      ctaForward: { ts: "2026-04-21 09:15:34", ctaId: "cta_apply", zone: "hero", outboundUrl: "https://tracker.acme.com/r?vid=v_f1bd4408&offer=partner_announce&ttclid=C0gO3-Test1234" },
      postback: { ts: "2026-04-21 09:16:12", conversionId: "cv_t99102", conversionType: "lead", value: 0, currency: "USD", externalId: "tl_2210", source: "max", raw: {} },
      destinationFire: { ts: "2026-04-21 09:16:13", status: "ok", latencyMs: 250, destinationId: "cd_meta_prod", destinationName: "Meta — ACME Growth", endpoint: "POST graph.facebook.com/v18.0/319847562103948/events", request: { data: [{ event_id: "cv_t99102", event_name: "Lead" }] }, response: { events_received: 1 }, retries: [] }
    },
    {
      visitId: "v_g9402a18", buySource: "facebook",
      visit: { ts: "2026-04-20 23:11:08", lander: "Walk-in Tubs", landerId: "walk-in-tubs", variant: "var_wt_01", domain: "edge.financeapp.com", path: "/tubs", country: "US", device: "Tablet", os: "iPadOS",
        params: { utm_source: "facebook", fbclid: "fb.1.1775125868000.qErT9" } },
      ctaForward: { ts: "2026-04-20 23:12:14", ctaId: "cta_quote", zone: "form-cta", outboundUrl: "https://tracker.acme.com/r?vid=v_g9402a18&offer=walk_in_tubs" },
      postback: { ts: "2026-04-20 23:14:01", conversionId: "cv_wt5512", conversionType: "purchase", value: 1899, currency: "USD", externalId: "ord_wt8810", source: "max", raw: {} },
      destinationFire: { ts: "2026-04-20 23:14:03", status: "ok", latencyMs: 405, destinationId: "cd_meta_prod", destinationName: "Meta — ACME Growth", endpoint: "POST graph.facebook.com/v18.0/319847562103948/events", request: { data: [{ event_id: "cv_wt5512", event_name: "Purchase", custom_data: { value: 1899, currency: "USD" } }] }, response: { events_received: 1 }, retries: [] }
    },
    {
      visitId: "v_h6712e29", buySource: "facebook",
      visit: { ts: "2026-04-20 21:48:33", lander: "Summer Sale", landerId: "summer-sale", variant: "var_ss_03", domain: "offers.acme.com", path: "/summer-sale-hero", country: "US", device: "Desktop", os: "macOS",
        params: { utm_source: "facebook", utm_campaign: "summer_2026_v3", fbclid: "fb.1.1775120913000.MnOpQ" } },
      ctaForward: { ts: "2026-04-20 21:49:01", ctaId: "cta_buy_now", zone: "hero-primary", outboundUrl: "https://tracker.acme.com/r?vid=v_h6712e29&offer=summer_2026" },
      postback: { ts: "2026-04-20 21:50:19", conversionId: "cv_h812af", conversionType: "lead", value: 0, currency: "USD", externalId: "l_8814", source: "max", raw: {} },
      destinationFire: { ts: "2026-04-20 21:50:20", status: "ok", latencyMs: 219, destinationId: "cd_meta_prod", destinationName: "Meta — ACME Growth", endpoint: "POST graph.facebook.com/v18.0/319847562103948/events", request: { data: [{ event_id: "cv_h812af", event_name: "Lead" }] }, response: { events_received: 1 }, retries: [] }
    },
    {
      visitId: "v_j2918c41", buySource: "google",
      visit: { ts: "2026-04-20 18:33:02", lander: "Holiday Teaser", landerId: "holiday-teaser", variant: "var_ht_01", domain: "try.acme.com", path: "/teaser", country: "AU", device: "Desktop", os: "Windows",
        params: { utm_source: "google", utm_campaign: "ht_brand", gclid: "EAIaIQ-AU-teaser-9981" } },
      ctaForward: { ts: "2026-04-20 18:35:48", ctaId: "cta_notify", zone: "hero", outboundUrl: "https://tracker.acme.com/r?vid=v_j2918c41&offer=holiday_teaser&gclid=EAIaIQ-AU-teaser-9981" },
      postback: { ts: "2026-04-20 18:39:48", conversionId: "cv_j1019b", conversionType: "signup", value: 0, currency: "AUD", externalId: "u_au_3301", source: "max", raw: {} },
      destinationFire: { ts: "2026-04-20 18:39:50", status: "ok", latencyMs: 350, destinationId: "cd_google_main", destinationName: "Google Ads — main", endpoint: "POST googleads.googleapis.com/v15/customers/2846197723:uploadClickConversions", request: { conversions: [{ conversion_action: "customers/2846197723/conversionActions/8841502", gclid: "EAIaIQ-AU-teaser-9981", order_id: "cv_j1019b" }] }, response: { results: [{ gclid: "EAIaIQ-AU-teaser-9981" }] }, retries: [] }
    },

    // ---- Visit only (no postback yet) (3) ----
    {
      visitId: "v_k7a8019c", buySource: "facebook",
      visit: { ts: "2026-04-21 09:48:21", lander: "Fall Preview", landerId: "fall-preview", variant: "var_fp_01", domain: "offers.acme.com", path: "/fall-preview", country: "DE", device: "Mobile", os: "iOS",
        params: { utm_source: "facebook", utm_campaign: "fall_warmup", fbclid: "fb.1.1775172501000.JustNow" }, clickId: "cl_fp9921" },
      postback: null, destinationFire: null
    },
    {
      visitId: "v_l9024aab", buySource: "tiktok",
      visit: { ts: "2026-04-21 09:46:09", lander: "Black Friday", landerId: "black-friday", variant: "var_bf_02", domain: "offers.acme.com", path: "/black-friday-2026", country: "US", device: "Mobile", os: "Android",
        params: { utm_source: "tiktok", utm_medium: "paid", ttclid: "C0gO3-Recent-991" } },
      postback: null, destinationFire: null
    },
    {
      visitId: "v_m18ce201", buySource: "google",
      visit: { ts: "2026-04-21 09:44:55", lander: "Founder Letter", landerId: "founder-letter", variant: "var_fl_01", domain: "offers.acme.com", path: "/founder-letter", country: "IN", device: "Desktop", os: "Linux",
        params: { utm_source: "google", utm_medium: "organic", gclid: null } },
      postback: null, destinationFire: null
    },

    // ---- Postback received, fire pending (3) ----
    {
      visitId: "v_n4892bfa", buySource: "facebook",
      visit: { ts: "2026-04-21 09:39:18", lander: "Summer Sale", landerId: "summer-sale", variant: "var_ss_03", domain: "offers.acme.com", path: "/summer-sale-hero", country: "US", device: "Mobile", os: "iOS",
        params: { utm_source: "facebook", fbclid: "fb.1.1775171958000.Recent4" } },
      ctaForward: { ts: "2026-04-21 09:39:52", ctaId: "cta_buy_now", zone: "hero-primary", outboundUrl: "https://tracker.acme.com/r?vid=v_n4892bfa&offer=summer_2026" },
      postback: { ts: "2026-04-21 09:47:02", conversionId: "cv_n8123c", conversionType: "purchase", value: 79.99, currency: "USD", externalId: "ord_n1209", source: "max", raw: {} },
      destinationFire: { ts: null, status: "pending", destinationId: "cd_meta_prod", destinationName: "Meta — ACME Growth", endpoint: "POST graph.facebook.com/v18.0/319847562103948/events", queuedAt: "2026-04-21 09:47:02", retries: [] }
    },
    {
      visitId: "v_p7a0c10b", buySource: "facebook",
      visit: { ts: "2026-04-21 09:34:11", lander: "Referral Q2", landerId: "referral-q2", variant: "var_rq_01", domain: "refer.acme.com", path: "/q2", country: "FR", device: "Desktop", os: "Windows",
        params: { utm_source: "facebook", fbclid: "fb.1.1775171651000.Pending9" } },
      ctaForward: { ts: "2026-04-21 09:34:48", ctaId: "cta_get_demo", zone: "footer", outboundUrl: "https://tracker.acme.com/r?vid=v_p7a0c10b&offer=referral_q2" },
      postback: { ts: "2026-04-21 09:45:33", conversionId: "cv_p77a02b", conversionType: "lead", value: 0, currency: "EUR", externalId: "lead_eu_2210", source: "max", raw: {} },
      destinationFire: { ts: null, status: "pending", destinationId: "cd_meta_prod", destinationName: "Meta — ACME Growth", endpoint: "POST graph.facebook.com/v18.0/319847562103948/events", queuedAt: "2026-04-21 09:45:33", retries: [] }
    },
    {
      visitId: "v_q19a4218", buySource: "taboola",
      visit: { ts: "2026-04-21 09:31:08", lander: "Walk-in Tubs", landerId: "walk-in-tubs", variant: "var_wt_01", domain: "edge.financeapp.com", path: "/tubs", country: "US", device: "Desktop", os: "Windows",
        params: { utm_source: "taboola", click_id: "tbq_77810ab" } },
      ctaForward: { ts: "2026-04-21 09:31:50", ctaId: "cta_quote", zone: "form-cta", outboundUrl: "https://tracker.acme.com/r?vid=v_q19a4218&offer=walk_in_tubs&click_id=tbq_77810ab" },
      postback: { ts: "2026-04-21 09:43:01", conversionId: "cv_q44e1a", conversionType: "lead", value: 0, currency: "USD", externalId: "wt_lead_99", source: "max", raw: {} },
      destinationFire: { ts: null, status: "pending", destinationId: "cd_taboola_default", destinationName: "Taboola — default", endpoint: "POST trc.taboola.com/123456/log/3/unip", queuedAt: "2026-04-21 09:43:01", retries: [] }
    },

    // ---- Fire failed (3) — final state error ----
    {
      visitId: "v_r29a0e18", buySource: "facebook",
      visit: { ts: "2026-04-20 22:11:18", lander: "Summer Sale", landerId: "summer-sale", variant: "var_ss_03", domain: "offers.acme.com", path: "/summer-sale-hero", country: "BR", device: "Mobile", os: "Android",
        params: { utm_source: "facebook", fbclid: "fb.1.1775118278000.Failed1" } },
      ctaForward: { ts: "2026-04-20 22:11:48", ctaId: "cta_buy_now", zone: "hero-primary", outboundUrl: "https://tracker.acme.com/r?vid=v_r29a0e18&offer=summer_2026" },
      postback: { ts: "2026-04-20 22:13:55", conversionId: "cv_r4488e", conversionType: "purchase", value: 89, currency: "BRL", externalId: "ord_br_119", source: "max", raw: {} },
      destinationFire: {
        ts: "2026-04-20 22:17:48", status: "error", latencyMs: 1213, destinationId: "cd_meta_prod", destinationName: "Meta — ACME Growth",
        endpoint: "POST graph.facebook.com/v18.0/319847562103948/events",
        request: { data: [{ event_id: "cv_r4488e", event_name: "Purchase", custom_data: { value: 89, currency: "BRL" } }] },
        response: { error: { message: "Invalid OAuth access token. Token has expired.", type: "OAuthException", code: 190 } },
        retries: [
          { ts: "2026-04-20 22:14:00", n: 1, code: 190, latencyMs: 1145, error: "OAuthException: Invalid token" },
          { ts: "2026-04-20 22:15:30", n: 2, code: 190, latencyMs: 1198, error: "OAuthException: Invalid token" },
          { ts: "2026-04-20 22:17:48", n: 3, code: 190, latencyMs: 1213, error: "OAuthException: Invalid token (final)" }
        ]
      }
    },
    {
      visitId: "v_s55a1029", buySource: "google",
      visit: { ts: "2026-04-20 19:48:10", lander: "Holiday Teaser", landerId: "holiday-teaser", variant: "var_ht_01", domain: "try.acme.com", path: "/teaser", country: "US", device: "Desktop", os: "Windows",
        params: { utm_source: "google", gclid: "EAIaIQ-Stale-7290" } },
      ctaForward: { ts: "2026-04-20 19:48:48", ctaId: "cta_notify", zone: "hero", outboundUrl: "https://tracker.acme.com/r?vid=v_s55a1029&offer=holiday_teaser&gclid=EAIaIQ-Stale-7290" },
      postback: { ts: "2026-04-20 19:51:21", conversionId: "cv_s9912c", conversionType: "signup", value: 0, currency: "USD", externalId: "su_410", source: "max", raw: {} },
      destinationFire: {
        ts: "2026-04-20 19:55:48", status: "error", latencyMs: 894, destinationId: "cd_google_main", destinationName: "Google Ads — main",
        endpoint: "POST googleads.googleapis.com/v15/customers/2846197723:uploadClickConversions",
        request: { conversions: [{ conversion_action: "customers/2846197723/conversionActions/8841502", gclid: "EAIaIQ-Stale-7290" }] },
        response: { partial_failure_error: { code: 3, message: "Click 'EAIaIQ-Stale-7290' is too old to be uploaded." } },
        retries: [
          { ts: "2026-04-20 19:51:24", n: 1, code: 3, latencyMs: 720, error: "Click expired (>90 days)" },
          { ts: "2026-04-20 19:53:01", n: 2, code: 3, latencyMs: 802, error: "Click expired (>90 days)" },
          { ts: "2026-04-20 19:55:48", n: 3, code: 3, latencyMs: 894, error: "Click expired — giving up" }
        ]
      }
    },
    {
      visitId: "v_t91c2a18", buySource: "facebook",
      visit: { ts: "2026-04-20 14:02:33", lander: "Black Friday", landerId: "black-friday", variant: "var_bf_02", domain: "offers.acme.com", path: "/black-friday-2026", country: "ES", device: "Mobile", os: "iOS",
        params: { utm_source: "facebook", fbclid: "fb.1.1775094153000.ESfail" } },
      ctaForward: { ts: "2026-04-20 14:03:01", ctaId: "cta_shop", zone: "hero-cta", outboundUrl: "https://tracker.acme.com/r?vid=v_t91c2a18&offer=bf_warmup" },
      postback: { ts: "2026-04-20 14:04:18", conversionId: "cv_t128e2", conversionType: "purchase", value: 59, currency: "EUR", externalId: "ord_es_881", source: "max", raw: {} },
      destinationFire: {
        ts: "2026-04-20 14:07:21", status: "error", latencyMs: 1502, destinationId: "cd_meta_prod", destinationName: "Meta — ACME Growth",
        endpoint: "POST graph.facebook.com/v18.0/319847562103948/events",
        request: { data: [{ event_id: "cv_t128e2", event_name: "Purchase", custom_data: { value: 59, currency: "EUR" } }] },
        response: { error: { message: "user_data is missing required user_data parameters", type: "GraphMethodException", code: 100 } },
        retries: [
          { ts: "2026-04-20 14:04:25", n: 1, code: 100, latencyMs: 1421, error: "Missing user_data — no fbc/fbp/ip/ua" },
          { ts: "2026-04-20 14:05:50", n: 2, code: 100, latencyMs: 1490, error: "Missing user_data" },
          { ts: "2026-04-20 14:07:21", n: 3, code: 100, latencyMs: 1502, error: "Missing user_data (final)" }
        ]
      }
    },

    // ---- Retried then succeeded (2) ----
    {
      visitId: "v_u01a92e2", buySource: "facebook",
      visit: { ts: "2026-04-20 12:18:08", lander: "Partner Announce", landerId: "partner-announce", variant: "var_pa_02", domain: "try.acme.com", path: "/partner", country: "US", device: "Desktop", os: "macOS",
        params: { utm_source: "facebook", fbclid: "fb.1.1775087888000.Retry1" } },
      ctaForward: { ts: "2026-04-20 12:18:48", ctaId: "cta_apply", zone: "hero", outboundUrl: "https://tracker.acme.com/r?vid=v_u01a92e2&offer=partner_announce" },
      postback: { ts: "2026-04-20 12:20:11", conversionId: "cv_u02e91", conversionType: "lead", value: 0, currency: "USD", externalId: "l_part_8801", source: "max", raw: {} },
      destinationFire: {
        ts: "2026-04-20 12:21:38", status: "ok", latencyMs: 412, destinationId: "cd_meta_prod", destinationName: "Meta — ACME Growth",
        endpoint: "POST graph.facebook.com/v18.0/319847562103948/events",
        request: { data: [{ event_id: "cv_u02e91", event_name: "Lead" }] },
        response: { events_received: 1 },
        retries: [
          { ts: "2026-04-20 12:20:14", n: 1, code: 500, latencyMs: 8003, error: "Upstream 500 — gateway timeout" },
          { ts: "2026-04-20 12:21:38", n: 2, code: 200, latencyMs: 412, ok: true }
        ]
      }
    },
    {
      visitId: "v_v8e21902", buySource: "google",
      visit: { ts: "2026-04-20 10:45:21", lander: "Referral Q2", landerId: "referral-q2", variant: "var_rq_01", domain: "refer.acme.com", path: "/q2", country: "US", device: "Mobile", os: "iOS",
        params: { utm_source: "google", gclid: "EAIaIQ-Retried-2020" } },
      ctaForward: { ts: "2026-04-20 10:46:08", ctaId: "cta_get_demo", zone: "footer", outboundUrl: "https://tracker.acme.com/r?vid=v_v8e21902&offer=referral_q2&gclid=EAIaIQ-Retried-2020" },
      postback: { ts: "2026-04-20 10:48:08", conversionId: "cv_v8821e", conversionType: "signup", value: 0, currency: "USD", externalId: "u_v8814", source: "max", raw: {} },
      destinationFire: {
        ts: "2026-04-20 10:49:55", status: "ok", latencyMs: 318, destinationId: "cd_google_main", destinationName: "Google Ads — main",
        endpoint: "POST googleads.googleapis.com/v15/customers/2846197723:uploadClickConversions",
        request: { conversions: [{ conversion_action: "customers/2846197723/conversionActions/8841502", gclid: "EAIaIQ-Retried-2020" }] },
        response: { results: [{ gclid: "EAIaIQ-Retried-2020" }] },
        retries: [
          { ts: "2026-04-20 10:48:11", n: 1, code: 429, latencyMs: 215, error: "Rate limited" },
          { ts: "2026-04-20 10:49:55", n: 2, code: 200, latencyMs: 318, ok: true }
        ]
      }
    },

    // ---- Orphan postback (no matching visit_id) (1) ----
    {
      visitId: null, buySource: null,
      visit: null,
      postback: {
        ts: "2026-04-20 16:42:11", conversionId: "cv_orphan_9981", conversionType: "purchase", value: 149, currency: "USD", externalId: "ord_oprhan_99",
        source: "max", visitIdSent: "v_unknown_4421",
        raw: { visit_id: "v_unknown_4421", conversion_type: "purchase", value: 149, currency: "USD", external_id: "ord_oprhan_99" },
        error: "visit_id 'v_unknown_4421' not found in visit_served"
      },
      destinationFire: null
    }
  ];

  // Expose to other scripts (e.g. logs-flat.js)
  window.NEXUS_JOURNEYS = SEED_JOURNEYS;

  // Journeys UI was removed — if its DOM isn't present, stop here (data is still exposed above).
  if (!document.getElementById("jr-list")) return;

  // ===== State =====
  var state = {
    filter: "all",
    search: "",
    source: "",
    lander: "",
    destination: "",
    dateFrom: "",
    dateTo: "",
    expanded: {} // visitId -> bool
  };

  // ===== Helpers =====
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function highlightJson(obj) {
    if (obj == null) return '<span class="json-null">null</span>';
    var s = JSON.stringify(obj, null, 2);
    return escapeHtml(s)
      .replace(/(&quot;)([^&]+?)(&quot;)(\s*:)/g, '<span class="json-key">$1$2$3</span>$4')
      .replace(/:\s*(&quot;)(.*?)(&quot;)/g, ': <span class="json-str">$1$2$3</span>')
      .replace(/:\s*(-?\d+(?:\.\d+)?)/g, ': <span class="json-num">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
  }
  function timeOf(j) {
    return (j.visit && j.visit.ts) || (j.postback && j.postback.ts) || "";
  }
  function dateOf(j) { return (timeOf(j) || "").slice(0, 10); }
  function fmtDate(s) {
    if (!s) return "";
    var d = s.slice(0, 10);
    var t = s.slice(11, 16);
    return { d: d, t: t };
  }
  function relTime(s) {
    if (!s) return "";
    var now = new Date("2026-04-21T09:55:00");
    var then = new Date(s.replace(" ", "T"));
    var diff = (now - then) / 1000;
    if (diff < 60) return Math.max(1, Math.round(diff)) + "s ago";
    if (diff < 3600) return Math.round(diff / 60) + "m ago";
    if (diff < 86400) return Math.round(diff / 3600) + "h ago";
    return Math.round(diff / 86400) + "d ago";
  }
  function durationBetween(a, b) {
    if (!a || !b) return null;
    var da = new Date(a.replace(" ", "T"));
    var db = new Date(b.replace(" ", "T"));
    var ms = db - da;
    if (ms < 0) return null;
    if (ms < 60000) return Math.round(ms / 1000) + "s";
    if (ms < 3600000) return Math.round(ms / 60000) + "m";
    return Math.round(ms / 3600000) + "h";
  }

  // Compute the journey state (which filter pill it belongs to)
  function stateOf(j) {
    if (!j.visit && j.postback) return "orphan";
    if (j.visit && !j.postback) return "visit_only";
    if (j.postback && (!j.destinationFire || j.destinationFire.status === "pending")) return "awaiting_fire";
    if (j.destinationFire && j.destinationFire.status === "ok") {
      return (j.destinationFire.retries && j.destinationFire.retries.length > 0) ? "retried" : "fired";
    }
    if (j.destinationFire && j.destinationFire.status === "error") return "failed";
    return "other";
  }

  // ===== Source / lander logo helpers =====
  function sourceLogo(src) {
    if (!src) return "";
    var inner = ({
      facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
      google: '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-1 .6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H2.8v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H2.8a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.7 2.2 12 2.2A10 10 0 0 0 2.8 7.5l3.6 2.6C7.2 7.8 9.4 6.1 12 6.1z"/></svg>',
      taboola: 'Tb',
      tiktok:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3v3.5a4.5 4.5 0 0 0 4 4.5v3a7.5 7.5 0 0 1-4-1.2V16a5 5 0 1 1-5-5v3a2 2 0 1 0 2 2V3z"/></svg>'
    })[src] || "";
    return '<span class="jr-source__logo jr-source__logo--' + src + '">' + inner + '</span>';
  }
  var SOURCE_LABEL = { facebook: "Facebook / Meta", google: "Google", taboola: "Taboola", tiktok: "TikTok" };

  // ===== Filter logic =====
  function matchesFilters(j) {
    if (state.filter !== "all" && stateOf(j) !== state.filter) return false;
    if (state.source && j.buySource !== state.source) return false;
    if (state.lander && (!j.visit || j.visit.lander !== state.lander)) return false;
    if (state.destination && (!j.destinationFire || j.destinationFire.destinationId !== state.destination)) return false;
    if (state.search) {
      var s = state.search.toLowerCase();
      var blob = [
        j.visitId,
        j.postback && j.postback.conversionId,
        j.visit && j.visit.clickId,
        j.visit && j.visit.lander,
        j.destinationFire && j.destinationFire.destinationName
      ].filter(Boolean).join(" ").toLowerCase();
      if (blob.indexOf(s) === -1) return false;
    }
    if (state.dateFrom) {
      var d = dateOf(j);
      if (!d || d < state.dateFrom) return false;
    }
    if (state.dateTo) {
      var d2 = dateOf(j);
      if (!d2 || d2 > state.dateTo) return false;
    }
    return true;
  }

  // ===== Render =====
  function renderFlowStrip(j) {
    // Stage 1 — Visit (Buy source → Nexus)
    var visitHtml = '<div class="jr-stage jr-stage--info" title="Buy source → Nexus (visit)">' +
      '<span class="jr-stage__dot"></span>' +
      '<span class="jr-stage__label">Visit</span>' +
      (j.visit ? '<span class="jr-stage__meta">' + (fmtDate(j.visit.ts).t || "") + '</span>' : '') +
    '</div>';

    // Stage 2 — CTA forward (Nexus → Tracking)
    var ctaHtml;
    if (j.ctaForward) {
      ctaHtml = '<div class="jr-stage jr-stage--ok" title="Nexus → Tracking (CTA click)">' +
        '<span class="jr-stage__dot"></span>' +
        '<span class="jr-stage__label">CTA → tracking</span>' +
        '<span class="jr-stage__meta">' + (fmtDate(j.ctaForward.ts).t || "") + '</span>' +
      '</div>';
    } else if (j.visit) {
      ctaHtml = '<div class="jr-stage jr-stage--skip"><span class="jr-stage__dot"></span><span class="jr-stage__label">No CTA click</span></div>';
    } else {
      ctaHtml = '<div class="jr-stage jr-stage--skip"><span class="jr-stage__dot"></span><span class="jr-stage__label">—</span></div>';
    }

    // Stage 3 — Postback (Tracking → Nexus)
    var pbHtml;
    if (j.postback && j.postback.error) {
      pbHtml = '<div class="jr-stage jr-stage--fail" title="Orphan postback">' +
        '<span class="jr-stage__dot"></span>' +
        '<span class="jr-stage__label">Orphan postback</span>' +
      '</div>';
    } else if (j.postback) {
      pbHtml = '<div class="jr-stage jr-stage--ok" title="Tracking → Nexus (postback)">' +
        '<span class="jr-stage__dot"></span>' +
        '<span class="jr-stage__label">' + escapeHtml(j.postback.conversionType) + '</span>' +
        (j.postback.value ? '<span class="jr-stage__meta">' + escapeHtml(j.postback.currency) + " " + j.postback.value + '</span>' : '') +
      '</div>';
    } else {
      pbHtml = '<div class="jr-stage jr-stage--skip"><span class="jr-stage__dot"></span><span class="jr-stage__label">No postback</span></div>';
    }

    // Stage 4 — Destination fire (Nexus → Buy source)
    var fireHtml;
    var f = j.destinationFire;
    if (!f) {
      fireHtml = '<div class="jr-stage jr-stage--skip"><span class="jr-stage__dot"></span><span class="jr-stage__label">—</span></div>';
    } else if (f.status === "pending") {
      fireHtml = '<div class="jr-stage jr-stage--wait" title="Queued"><span class="jr-stage__dot"></span><span class="jr-stage__label">Queued</span></div>';
    } else if (f.status === "ok" && f.retries && f.retries.length > 0) {
      fireHtml = '<div class="jr-stage jr-stage--retry" title="Succeeded after retries"><span class="jr-stage__dot"></span><span class="jr-stage__label">Fired</span><span class="jr-stage__retry-pill">×' + f.retries.length + '</span></div>';
    } else if (f.status === "ok") {
      fireHtml = '<div class="jr-stage jr-stage--ok" title="Fired"><span class="jr-stage__dot"></span><span class="jr-stage__label">Fired</span><span class="jr-stage__meta">' + (f.latencyMs || "") + 'ms</span></div>';
    } else {
      fireHtml = '<div class="jr-stage jr-stage--fail" title="Failed"><span class="jr-stage__dot"></span><span class="jr-stage__label">Failed</span>' + (f.retries && f.retries.length ? '<span class="jr-stage__retry-pill">×' + f.retries.length + '</span>' : '') + '</div>';
    }

    return '<div class="jr-flow">' +
      visitHtml + '<div class="jr-arrow"></div>' +
      ctaHtml   + '<div class="jr-arrow"></div>' +
      pbHtml    + '<div class="jr-arrow"></div>' +
      fireHtml +
    '</div>';
  }

  function renderVisitPanel(j) {
    if (!j.visit) {
      return '<div class="jr-card-panel jr-panel--empty"><div class="jr-panel__head"><div class="jr-panel__title"><span>① Visit</span><span class="jr-panel__title-arrow">Buy source → Nexus</span></div></div><div class="jr-panel__body">No matching visit for this postback — orphan.</div></div>';
    }
    var v = j.visit;
    var params = v.params || {};
    var kv = '<dl class="jr-kv">' +
      '<dt>visit_id</dt><dd>' + escapeHtml(j.visitId) + '</dd>' +
      (v.clickId ? '<dt>click_id</dt><dd>' + escapeHtml(v.clickId) + '</dd>' : '') +
      '<dt>buy_source</dt><dd>' + escapeHtml(SOURCE_LABEL[j.buySource] || j.buySource) + '</dd>' +
      '<dt>domain</dt><dd>' + escapeHtml(v.domain || "") + escapeHtml(v.path || "") + '</dd>' +
      '<dt>device</dt><dd>' + escapeHtml(v.device + " · " + v.os + " · " + v.country) + '</dd>' +
    '</dl>';
    return '<div class="jr-card-panel">' +
      '<div class="jr-panel__head">' +
        '<div class="jr-panel__title"><span>① Visit</span><span class="jr-panel__title-arrow">Buy source → Nexus</span></div>' +
        '<div class="jr-panel__sub"><time>' + escapeHtml(v.ts) + '</time></div>' +
      '</div>' +
      '<div class="jr-panel__body">' + kv +
        '<div class="jr-section-title">Query params (campaign macros)</div>' +
        '<pre class="jr-pre">' + highlightJson(params) + '</pre>' +
      '</div>' +
    '</div>';
  }

  function renderCtaPanel(j) {
    if (!j.ctaForward) {
      var msg = j.visit ? 'User didn\'t click the CTA on the lander.' : 'Nothing to forward — no visit recorded.';
      return '<div class="jr-card-panel jr-panel--empty"><div class="jr-panel__head"><div class="jr-panel__title"><span>② CTA → tracking</span><span class="jr-panel__title-arrow">Nexus → Tracking</span></div></div><div class="jr-panel__body">' + msg + '</div></div>';
    }
    var c = j.ctaForward;
    var kv = '<dl class="jr-kv">' +
      '<dt>cta_id</dt><dd>' + escapeHtml(c.ctaId || "—") + '</dd>' +
      '<dt>zone</dt><dd>' + escapeHtml(c.zone || "—") + '</dd>' +
      '<dt>visit_id</dt><dd>' + escapeHtml(j.visitId) + '</dd>' +
    '</dl>';
    var head =
      '<div class="jr-panel__head">' +
        '<div class="jr-panel__title"><span>② CTA → tracking</span><span class="jr-panel__title-arrow">Nexus → Tracking</span></div>' +
        '<div class="jr-panel__sub"><time>' + escapeHtml(c.ts) + '</time>' +
          (j.visit ? '<span>·</span><span>' + durationBetween(j.visit.ts, c.ts) + ' on lander</span>' : '') +
        '</div>' +
      '</div>';
    return '<div class="jr-card-panel">' + head +
      '<div class="jr-panel__body">' + kv +
        '<div class="jr-section-title">Outbound URL (macros resolved)</div>' +
        '<div class="jr-endpoint">' + escapeHtml(c.outboundUrl) + '</div>' +
      '</div>' +
    '</div>';
  }

  function renderPostbackPanel(j) {
    var p = j.postback;
    if (!p) {
      return '<div class="jr-card-panel jr-panel--empty"><div class="jr-panel__head"><div class="jr-panel__title"><span>② Postback</span><span class="jr-panel__title-arrow">Tracking → Nexus</span></div></div><div class="jr-panel__body">Postback not yet received for this visit.</div></div>';
    }
    var orphan = !!p.error;
    var head =
      '<div class="jr-panel__head">' +
        '<div class="jr-panel__title"><span>② Postback</span><span class="jr-panel__title-arrow">Tracking → Nexus</span></div>' +
        '<div class="jr-panel__sub"><time>' + escapeHtml(p.ts) + '</time>' +
          (j.visit ? '<span>·</span><span>' + durationBetween(j.visit.ts, p.ts) + " after visit</span>" : '') +
        '</div>' +
      '</div>';
    var kv = '<dl class="jr-kv">' +
      '<dt>conversion_id</dt><dd>' + escapeHtml(p.conversionId) + '</dd>' +
      '<dt>type</dt><dd>' + escapeHtml(p.conversionType) + '</dd>' +
      (p.value ? '<dt>value</dt><dd>' + escapeHtml(p.currency) + " " + p.value + '</dd>' : '') +
      '<dt>external_id</dt><dd>' + escapeHtml(p.externalId || "—") + '</dd>' +
      '<dt>source</dt><dd>' + escapeHtml(p.source || "—") + '</dd>' +
      (orphan ? '<dt>error</dt><dd style="color:#a31a1a">' + escapeHtml(p.error) + '</dd>' : '') +
    '</dl>';
    return '<div class="jr-card-panel">' + head +
      '<div class="jr-panel__body">' + kv +
        '<div class="jr-section-title">Raw payload</div>' +
        '<pre class="jr-pre">' + highlightJson(p.raw || {}) + '</pre>' +
      '</div>' +
    '</div>';
  }

  function renderFirePanel(j) {
    var f = j.destinationFire;
    if (!f) {
      return '<div class="jr-card-panel jr-panel--empty"><div class="jr-panel__head"><div class="jr-panel__title"><span>③ Destination fire</span><span class="jr-panel__title-arrow">Nexus → Buy source</span></div></div><div class="jr-panel__body">Nothing to fire yet — waiting for postback.</div></div>';
    }
    var statusPill;
    if (f.status === "ok") statusPill = '<span class="jr-fire-status jr-fire-status--ok">200 OK · ' + (f.latencyMs || "") + 'ms</span>';
    else if (f.status === "error") statusPill = '<span class="jr-fire-status jr-fire-status--err">Failed · code ' + (f.response && f.response.error && f.response.error.code || (f.retries && f.retries[f.retries.length-1] && f.retries[f.retries.length-1].code) || "—") + '</span>';
    else statusPill = '<span class="jr-fire-status jr-fire-status--wait">Queued</span>';

    var head =
      '<div class="jr-panel__head">' +
        '<div class="jr-panel__title"><span>③ Destination fire</span><span class="jr-panel__title-arrow">Nexus → Buy source</span></div>' +
        '<div class="jr-panel__sub">' + statusPill +
          (j.postback && f.ts ? '<span>·</span><span>' + durationBetween(j.postback.ts, f.ts) + " after postback</span>" : '') +
        '</div>' +
      '</div>';
    var kv = '<dl class="jr-kv">' +
      '<dt>destination</dt><dd style="font-family:Inter,sans-serif;font-size:11.5px">' + escapeHtml(f.destinationName || f.destinationId) + '</dd>' +
      (f.ts ? '<dt>fired_at</dt><dd>' + escapeHtml(f.ts) + '</dd>' : '<dt>queued_at</dt><dd>' + escapeHtml(f.queuedAt || "") + '</dd>') +
      '<dt>event_id</dt><dd>' + escapeHtml(j.postback ? j.postback.conversionId : "—") + '</dd>' +
    '</dl>';
    var endpoint = '<div class="jr-section-title">Endpoint</div><div class="jr-endpoint">' + escapeHtml(f.endpoint) + '</div>';
    var req = f.request ? '<div class="jr-section-title">Request</div><pre class="jr-pre">' + highlightJson(f.request) + '</pre>' : '';
    var resp = f.response ? '<div class="jr-section-title">Response</div><pre class="jr-pre">' + highlightJson(f.response) + '</pre>' : '';
    var retries = "";
    if (f.retries && f.retries.length) {
      retries = '<div class="jr-section-title">Retry timeline</div><div class="jr-retries">' +
        f.retries.map(function (r) {
          var cls = r.ok ? "ok" : "err";
          var label = r.ok ? ("HTTP " + r.code + " · " + r.latencyMs + "ms") : ("HTTP " + r.code + " · " + escapeHtml(r.error || "error"));
          return '<div class="jr-retry">' +
            '<span class="jr-retry__num">#' + r.n + '</span>' +
            '<span class="jr-retry__detail"><span class="muted">' + escapeHtml(r.ts) + '</span> · ' + label + '</span>' +
            '<span class="jr-retry__status jr-retry__status--' + cls + '">' + (r.ok ? "OK" : "FAIL") + '</span>' +
          '</div>';
        }).join("") +
      '</div>';
    }
    return '<div class="jr-card-panel">' + head +
      '<div class="jr-panel__body">' + kv + endpoint + req + resp + retries + '</div>' +
    '</div>';
  }

  function renderRow(j) {
    var t = fmtDate(timeOf(j));
    var isOpen = j.visitId ? !!state.expanded[j.visitId] : !!state.expanded["orphan_" + (j.postback && j.postback.conversionId)];
    var openKey = j.visitId || ("orphan_" + (j.postback && j.postback.conversionId));
    var landerCell = j.visit
      ? '<strong title="' + escapeHtml(j.visit.lander) + '">' + escapeHtml(j.visit.lander) + '</strong>' +
        '<small>' + escapeHtml(j.visit.variant || "") + ' · ' + escapeHtml(j.visit.domain || "") + '</small>'
      : '<strong style="color:var(--text-muted);font-style:italic">— unknown lander —</strong><small>orphan postback</small>';
    var destCell = j.destinationFire
      ? '<strong title="' + escapeHtml(j.destinationFire.destinationName) + '">' + escapeHtml(j.destinationFire.destinationName) + '</strong>' +
        '<small>' + escapeHtml(j.destinationFire.destinationId) + '</small>'
      : (j.postback ? '<span class="jr-destination--none">awaiting…</span>' : '<span class="jr-destination--none">—</span>');
    var visitIdCell = '<div class="jr-visit-id-wrap"><div class="jr-visit-id">' + (j.visitId ? escapeHtml(j.visitId) : '<span style="color:var(--text-muted);font-style:italic">no visit_id</span>') + '</div>' +
      (j.buySource ? '<div class="jr-source">' + sourceLogo(j.buySource) + '<span>' + escapeHtml(SOURCE_LABEL[j.buySource]) + '</span></div>' : '') + '</div>';

    return '<div class="jr-row' + (isOpen ? " is-open" : "") + '" data-open-key="' + escapeHtml(openKey) + '" aria-expanded="' + (isOpen ? "true" : "false") + '">' +
      '<div class="jr-row__main" data-toggle>' +
        '<div class="jr-time">' +
          '<strong>' + escapeHtml(t.t || "") + '</strong>' +
          '<span>' + escapeHtml(t.d || "") + '</span><br><span>' + relTime(timeOf(j)) + '</span>' +
        '</div>' +
        visitIdCell +
        '<div class="jr-place">' + landerCell + '</div>' +
        renderFlowStrip(j) +
        '<div class="jr-destination">' + destCell + '</div>' +
        '<div class="jr-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></div>' +
      '</div>' +
      (isOpen ? '<div class="jr-row__body"><div class="jr-stages">' +
        renderVisitPanel(j) +
        renderCtaPanel(j) +
        renderPostbackPanel(j) +
        renderFirePanel(j) +
      '</div></div>' : '') +
    '</div>';
  }

  function render() {
    var list = document.getElementById("jr-list");
    var empty = document.getElementById("jr-empty");
    if (!list) return;

    // Counts per state
    var counts = { all: 0, visit_only: 0, awaiting_fire: 0, fired: 0, failed: 0, retried: 0, orphan: 0 };
    SEED_JOURNEYS.forEach(function (j) {
      counts.all++;
      var st = stateOf(j);
      if (counts[st] != null) counts[st]++;
    });
    Object.keys(counts).forEach(function (k) {
      var el = document.getElementById("jr-count-" + k);
      if (el) el.textContent = "· " + counts[k];
    });

    var filtered = SEED_JOURNEYS.filter(matchesFilters);
    if (!filtered.length) {
      list.innerHTML = "";
      empty.hidden = false;
    } else {
      empty.hidden = true;
      list.innerHTML = filtered.map(renderRow).join("");
    }

    var note = document.getElementById("jr-refresh-note");
    if (note) note.textContent = filtered.length + " of " + SEED_JOURNEYS.length + " journeys · auto-refreshing";
  }

  // ===== Filter wiring =====
  document.querySelectorAll(".jr-state").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".jr-state").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      state.filter = btn.getAttribute("data-state");
      render();
    });
  });

  function attachInput(id, key, debounce) {
    var el = document.getElementById(id);
    if (!el) return;
    var t;
    el.addEventListener("input", function () {
      state[key] = el.value || "";
      if (debounce) {
        clearTimeout(t);
        t = setTimeout(render, 120);
      } else render();
    });
    el.addEventListener("change", function () {
      state[key] = el.value || "";
      render();
    });
  }
  attachInput("jr-search", "search", true);
  attachInput("jr-source-filter", "source");
  attachInput("jr-lander-filter", "lander");
  attachInput("jr-destination-filter", "destination");
  attachInput("jr-date-from", "dateFrom");
  attachInput("jr-date-to", "dateTo");

  // Populate lander + destination dropdowns from data
  (function populate() {
    var landerSel = document.getElementById("jr-lander-filter");
    var destSel = document.getElementById("jr-destination-filter");
    var landers = {}, dests = {};
    SEED_JOURNEYS.forEach(function (j) {
      if (j.visit && j.visit.lander) landers[j.visit.lander] = true;
      if (j.destinationFire) dests[j.destinationFire.destinationId] = j.destinationFire.destinationName;
    });
    Object.keys(landers).sort().forEach(function (l) {
      var opt = document.createElement("option"); opt.value = l; opt.textContent = l; landerSel.appendChild(opt);
    });
    Object.keys(dests).sort().forEach(function (id) {
      var opt = document.createElement("option"); opt.value = id; opt.textContent = dests[id]; destSel.appendChild(opt);
    });
  })();

  // Row toggle
  document.getElementById("jr-list").addEventListener("click", function (e) {
    var toggle = e.target.closest("[data-toggle]");
    if (!toggle) return;
    var row = toggle.closest(".jr-row");
    if (!row) return;
    var key = row.getAttribute("data-open-key");
    state.expanded[key] = !state.expanded[key];
    render();
  });

  // Initial render
  render();
})();
