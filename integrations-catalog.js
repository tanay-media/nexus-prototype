// Shared workspace integration catalog (Settings + Editor publish flow).
//
// UI_FIELD_MAP — prototype localStorage names ↔ Base / Serving contract
// (see docs/02-base-system/workspace-integrations.md §3.1–3.2)
// PRD: docs/03-serving-system/nexus-buy-source-event-tracking.md
//
// Row shape (UI):           { id, name, source, fields, landerEventMap{}, eventMap[], createdAt }
// WorkspaceIntegration:     { integrationId, integrationName, provider, kind, config, … }
// convDestinations element: { convDestinationId, convDestinationName, buySource, landerEventMap, advertiserEventMap, … }

(function () {
  var STORAGE_KEY = "nexus.cd.v2";

  var UI_FIELD_MAP = {
    sourceToProvider: { facebook: "meta_capi", google: "google_ads", taboola: "taboola", gtm: "gtm", meta_pixel: "meta_pixel" },
    providerToBuySource: { meta_capi: "fb", google_ads: "google", taboola: "taboola" },
    rowKeys: { id: "integrationId", name: "integrationName", source: "provider" },
    configFields: {
      fb_pixel_id: "pixelId",
      fb_action_source: "actionSource",
      fb_token_ref: "accessToken",
      g_tag_id: "tagId",
      g_customer_id: "customerId",
      g_dev_token: "developerToken",
      g_client_id: "clientId",
      g_client_secret_ref: "clientSecret",
      g_token_ref: "accessToken",
      tb_account_id: "accountId",
      tb_token_ref: "accessToken",
      gtm_container: "containerId",
      gtm_env: "environment",
      pixel_id: "pixelId"
    },
    landerEventKeys: ["visit", "impression", "click"]
  };

  function defaultLanderEventMap(source) {
    var maps = {
      facebook: {
        visit: { enabled: true, eventName: "PageView" },
        impression: { enabled: true, eventName: "PageView" },
        click: { enabled: true, eventName: "ViewContent" }
      },
      google: {
        visit: { enabled: true, eventName: "page_view", conversionLabel: "AbC-D_efG-h", conversionActionId: "customers/2846197723/conversionActions/8841500" },
        impression: { enabled: true, eventName: "view_content", conversionLabel: "XyZ-Impr01", conversionActionId: "customers/2846197723/conversionActions/8841501" },
        click: { enabled: true, eventName: "cta_click", conversionLabel: "CtA-Click9", conversionActionId: "customers/2846197723/conversionActions/8841502" }
      },
      taboola: {
        visit: { enabled: true, eventName: "page_view" },
        impression: { enabled: true, eventName: "view_content" },
        click: { enabled: true, eventName: "cta_click" }
      }
    };
    return maps[source] ? JSON.parse(JSON.stringify(maps[source])) : null;
  }

  var SEED = {
    defaults: { facebook: "cd_meta_prod", google: "cd_google_main", taboola: "cd_taboola_main", gtm: "cd_gtm_main", meta_pixel: "cd_meta_pixel_main" },
    rows: [
      {
        id: "cd_meta_prod",
        name: "Meta — ACME Growth",
        source: "facebook",
        fields: { fb_pixel_id: "319847562103948", fb_action_source: "website", fb_token_ref: "secret://vault/meta/acme-prod" },
        landerEventMap: defaultLanderEventMap("facebook"),
        eventMap: [{ from: "lead", to: "Lead" }, { from: "purchase", to: "Purchase", value: { mode: "postback_minus_commission", commission: { type: "percent", amount: 15 } } }],
        createdAt: "2026-03-12"
      },
      {
        id: "cd_meta_promo",
        name: "Meta — Holiday promo",
        source: "facebook",
        fields: { fb_pixel_id: "904782156390124", fb_action_source: "website", fb_token_ref: "secret://vault/meta/acme-promo" },
        landerEventMap: defaultLanderEventMap("facebook"),
        eventMap: [{ from: "lead", to: "Lead" }, { from: "purchase", to: "Purchase", value: { mode: "postback_minus_commission", commission: { type: "percent", amount: 15 } } }],
        createdAt: "2026-04-22"
      },
      {
        id: "cd_google_main",
        name: "Google Ads — main",
        source: "google",
        fields: { g_tag_id: "AW-123456789", g_customer_id: "284-619-7723", g_dev_token: "ABcdEfGhIjKlMnOpQrStUv", g_client_id: "2846197723.apps.googleusercontent.com", g_client_secret_ref: "secret://vault/google/acme-main-client", g_token_ref: "secret://vault/google/acme-main" },
        landerEventMap: defaultLanderEventMap("google"),
        eventMap: [{ from: "lead", to: "Submit lead form", conversionActionId: "customers/2846197723/conversionActions/8841502", value: { mode: "static", amount: 40, currency: "USD" } }, { from: "purchase", to: "purchase_offline", conversionActionId: "customers/2846197723/conversionActions/8841503", value: { mode: "from_postback" } }],
        createdAt: "2026-04-04"
      },
      {
        id: "cd_taboola_main",
        name: "Taboola — default",
        source: "taboola",
        fields: { tb_account_id: "1234567", tb_token_ref: "secret://vault/taboola/acme" },
        landerEventMap: defaultLanderEventMap("taboola"),
        eventMap: [{ from: "lead", to: "lead" }],
        createdAt: "2026-04-10"
      },
      {
        id: "cd_gtm_main",
        name: "GTM — house.bestlivingideas.com",
        source: "gtm",
        fields: { gtm_container: "GTM-WX7K2PL", gtm_env: "live" },
        eventMap: [],
        createdAt: "2026-03-28"
      },
      {
        id: "cd_gtm_staging",
        name: "GTM — staging sandbox",
        source: "gtm",
        fields: { gtm_container: "GTM-5QF9D02", gtm_env: "latest" },
        eventMap: [],
        createdAt: "2026-04-19"
      },
      {
        id: "cd_meta_pixel_main",
        name: "Meta Pixel — ACME Growth",
        source: "meta_pixel",
        fields: { pixel_id: "319847562103948" },
        eventMap: [],
        createdAt: "2026-03-15"
      }
    ]
  };

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.rows)) {
          parsed.defaults = parsed.defaults || {};
          ["facebook", "google", "taboola", "gtm", "meta_pixel"].forEach(function (k) {
            if (!parsed.defaults[k] && SEED.defaults[k]) parsed.defaults[k] = SEED.defaults[k];
          });
          parsed.rows.forEach(function (r) {
            if (!r.landerEventMap && defaultLanderEventMap(r.source)) {
              r.landerEventMap = defaultLanderEventMap(r.source);
            }
            if (r.source === "google" && r.fields && r.fields.g_action_id && r.landerEventMap) {
              var legacyAction = r.fields.g_action_id;
              ["visit", "impression", "click"].forEach(function (key) {
                if (r.landerEventMap[key] && !r.landerEventMap[key].conversionActionId) {
                  r.landerEventMap[key].conversionActionId = legacyAction;
                }
              });
              delete r.fields.g_action_id;
            }
          });
          return parsed;
        }
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(SEED));
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function rowsForSource(source) {
    var d = load();
    return (d.rows || []).filter(function (r) { return r.source === source; });
  }

  function rowById(id) {
    var d = load();
    return (d.rows || []).find(function (r) { return r.id === id; }) || null;
  }

  function defaultIdForSource(source) {
    var d = load();
    return d.defaults && d.defaults[source] ? d.defaults[source] : null;
  }

  window.nexusIntegrations = {
    STORAGE_KEY: STORAGE_KEY,
    UI_FIELD_MAP: UI_FIELD_MAP,
    load: load,
    save: save,
    rowsForSource: rowsForSource,
    rowById: rowById,
    defaultIdForSource: defaultIdForSource,
    defaultLanderEventMap: defaultLanderEventMap,
    BUY_SOURCES: ["facebook", "google", "taboola"]
  };
})();
