// Shared workspace integration catalog (Settings + Editor publish flow).
//
// UI_FIELD_MAP — prototype localStorage names ↔ Base / Serving contract
// (see docs/02-base-system/workspace-integrations.md §3.1–3.2)
//
// Row shape (UI):           { id, name, source, fields, eventMap[], createdAt }
// WorkspaceIntegration:     { integrationId, integrationName, provider, kind, config, … }
// convDestinations element: { convDestinationId, convDestinationName, buySource, …flat config }
//
// source (UI) → provider (Base) → buySource (Serving, buy_source only):
//   facebook    → meta_capi      → fb
//   google      → google_ads    → google
//   gtm         → gtm           → (client_pixel — baked in servingHtml)
//   meta_pixel  → meta_pixel    → (client_pixel — baked in servingHtml)
//
// fields (UI) → config (Base) → Serving element:
//   fb_pixel_id      → pixelId              → pixelId
//   fb_action_source → actionSource         → actionSource
//   fb_token_ref     → accessToken          → accessToken
//   g_customer_id    → customerId           → customerId
//   g_action_id      → conversionActionId   → conversionActionId
//   g_token_ref      → accessToken          → accessToken
//   gtm_container    → containerId          → (HTML bake)
//   gtm_env          → environment          → (HTML bake)
//   pixel_id         → pixelId (meta_pixel) → (HTML bake)
//
// eventMap (UI): [{ from: "lead", to: "Lead" }, …]
// eventMap (Base/Serving): { "lead": { "eventName": "Lead" }, … }
//
// defaults[source] (UI)           → defaultIntegrationIds[provider] (Base)
// nexus.lander.integrations.v1    → selectedIntegrationIds (Base)

(function () {
  var STORAGE_KEY = "nexus.cd.v2";

  var UI_FIELD_MAP = {
    sourceToProvider: { facebook: "meta_capi", google: "google_ads", gtm: "gtm", meta_pixel: "meta_pixel" },
    providerToBuySource: { meta_capi: "fb", google_ads: "google" },
    rowKeys: { id: "integrationId", name: "integrationName", source: "provider" },
    configFields: {
      fb_pixel_id: "pixelId",
      fb_action_source: "actionSource",
      fb_token_ref: "accessToken",
      g_customer_id: "customerId",
      g_action_id: "conversionActionId",
      g_token_ref: "accessToken",
      gtm_container: "containerId",
      gtm_env: "environment",
      pixel_id: "pixelId"
    }
  };

  var SEED = {
    defaults: { facebook: "cd_meta_prod", google: "cd_google_main", gtm: "cd_gtm_main", meta_pixel: "cd_meta_pixel_main" },
    rows: [
      {
        id: "cd_meta_prod",
        name: "Meta — ACME Growth",
        source: "facebook",
        fields: { fb_pixel_id: "319847562103948", fb_action_source: "website", fb_token_ref: "secret://vault/meta/acme-prod" },
        eventMap: [{ from: "lead", to: "Lead" }, { from: "purchase", to: "Purchase" }],
        createdAt: "2026-03-12"
      },
      {
        id: "cd_meta_promo",
        name: "Meta — Holiday promo",
        source: "facebook",
        fields: { fb_pixel_id: "904782156390124", fb_action_source: "website", fb_token_ref: "secret://vault/meta/acme-promo" },
        eventMap: [{ from: "lead", to: "Lead" }, { from: "purchase", to: "Purchase" }],
        createdAt: "2026-04-22"
      },
      {
        id: "cd_google_main",
        name: "Google Ads — main",
        source: "google",
        fields: { g_customer_id: "284-619-7723", g_action_id: "customers/2846197723/conversionActions/8841502", g_token_ref: "secret://vault/google/acme-main" },
        eventMap: [{ from: "lead", to: "lead_offline" }, { from: "purchase", to: "purchase_offline" }],
        createdAt: "2026-04-04"
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
          ["facebook", "google", "gtm", "meta_pixel"].forEach(function (k) {
            if (!parsed.defaults[k] && SEED.defaults[k]) parsed.defaults[k] = SEED.defaults[k];
          });
          return parsed;
        }
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(SEED));
  }

  function rowsForSource(source) {
    return (load().rows || []).filter(function (r) { return r.source === source; });
  }

  function defaultIdForSource(source) {
    var s = load();
    return (s.defaults && s.defaults[source]) || null;
  }

  function rowById(id) {
    return (load().rows || []).find(function (r) { return r.id === id; }) || null;
  }

  var SOURCE_LABEL = {
    facebook: "Meta (Facebook)",
    google: "Google Ads",
    gtm: "Google Tag Manager",
    meta_pixel: "Meta Pixel"
  };

  window.nexusIntegrations = {
    STORAGE_KEY: STORAGE_KEY,
    UI_FIELD_MAP: UI_FIELD_MAP,
    SEED: SEED,
    load: load,
    rowsForSource: rowsForSource,
    defaultIdForSource: defaultIdForSource,
    rowById: rowById,
    sourceLabel: function (source) { return SOURCE_LABEL[source] || source; }
  };
})();
