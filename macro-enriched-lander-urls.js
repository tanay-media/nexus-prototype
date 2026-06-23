// Macro-enriched lander URLs by source (Published screen).
// Canonical spec: docs/02-base-system/macro-enriched-lander-urls-by-source.md (lander project)
//
// Lander query-param keys → ad-platform macro values at click time.
// Nexus Serving reads resolved params as {{key}} macros; CAPI uses clid + buySource.

(function () {
  var BY_SOURCE = {
    fb: {
      buySource: "fb",
      label: "Meta Ads",
      shortLabel: "Meta",
      params: [
        { key: "clid", value: "{{fbclid}}" },
        { key: "buySource", value: "fb" },
        { key: "utm_source", value: "{{site_source_name}}" },
        { key: "utm_medium", value: "cpc" },
        { key: "utm_campaign", value: "{{campaign.name}}" },
        { key: "utm_id", value: "{{campaign.id}}" },
        { key: "utm_content", value: "{{ad.id}}" },
        { key: "utm_term", value: "{{adset.id}}" },
        { key: "utm_placement", value: "{{placement}}" }
      ]
    },
    google: {
      buySource: "google",
      label: "Google Ads",
      shortLabel: "Google",
      params: [
        { key: "clid", value: "{gclid}" },
        { key: "buySource", value: "google" },
        { key: "utm_source", value: "google" },
        { key: "utm_medium", value: "cpc" },
        { key: "utm_campaign", value: "{campaignid}" },
        { key: "utm_content", value: "{creative}" },
        { key: "keyword", value: "{keyword}" },
        { key: "wbraid", value: "{wbraid}" },
        { key: "gbraid", value: "{gbraid}" }
      ]
    },
    taboola: {
      buySource: "taboola",
      label: "Taboola",
      shortLabel: "Taboola",
      params: [
        { key: "clid", value: "{click_id}" },
        { key: "buySource", value: "taboola" },
        { key: "utm_source", value: "taboola" },
        { key: "utm_medium", value: "cpc" },
        { key: "utm_campaign", value: "{campaign_id}" }
      ]
    }
  };

  var SOURCE_KEYS = ["fb", "google", "taboola"];

  function encodeQueryValue(val) {
    return encodeURIComponent(String(val))
      .replace(/%7B%7B/g, "{{")
      .replace(/%7D%7D/g, "}}")
      .replace(/%7B/g, "{")
      .replace(/%7D/g, "}");
  }

  function normalizeBaseUrl(base) {
    var b = String(base || "").trim();
    if (!b) return "";
    if (/^https?:\/\//i.test(b)) return b.replace(/\/+$/, "");
    return "https://" + b.replace(/^\/+/, "").replace(/\/+$/, "");
  }

  function buildMacroLanderUrl(baseUrl, sourceKey) {
    var def = BY_SOURCE[sourceKey];
    if (!def) return "";
    var base = normalizeBaseUrl(baseUrl);
    if (!base) return "";
    var qs = def.params.map(function (p) {
      return encodeURIComponent(p.key) + "=" + encodeQueryValue(p.value);
    }).join("&");
    return base + "?" + qs;
  }

  window.nexusMacroLanderUrls = {
    BY_SOURCE: BY_SOURCE,
    SOURCE_KEYS: SOURCE_KEYS,
    buildMacroLanderUrl: buildMacroLanderUrl,
    normalizeBaseUrl: normalizeBaseUrl
  };
})();
