// Macro-enriched lander URLs by source (Published screen).
// Canonical spec: docs/02-base-system/macro-enriched-lander-urls-by-source.md (lander project)
//
// Nexus Param → platform macro at click time. Static values are literals; others expand on click.

(function () {
  var BY_SOURCE = {
    fb: {
      buySource: "fb",
      label: "Meta Ads",
      shortLabel: "Meta",
      params: [
        { key: "clid", value: "{{fbclid}}" },
        { key: "utm_source", value: "facebook" },
        { key: "utm_medium", value: "paid_social" },
        { key: "utm_campaign", value: "{{campaign.name}}" },
        { key: "campaign_id", value: "{{campaign.id}}" },
        { key: "adset_id", value: "{{adset.id}}" },
        { key: "ad_id", value: "{{ad.id}}" },
        { key: "placement", value: "{{placement}}" },
        { key: "publisher", value: "{{site_source_name}}" },
        { key: "device", value: "{{device_type}}" },
        { key: "creative", value: "{{ad.name}}" },
        { key: "utm_term", value: "{{adset.id}}" }
      ]
    },
    google: {
      buySource: "google",
      label: "Google Ads",
      shortLabel: "Google",
      params: [
        { key: "clid", value: "{gclid}" },
        { key: "utm_source", value: "google" },
        { key: "utm_medium", value: "search" },
        { key: "utm_campaign", value: "{campaign}" },
        { key: "campaign_id", value: "{campaignid}" },
        { key: "adset_id", value: "{adgroupid}" },
        { key: "ad_id", value: "{adid}" },
        { key: "placement", value: "{placement}" },
        { key: "publisher", value: "{placement}" },
        { key: "device", value: "{device}" },
        { key: "creative", value: "{creative}" },
        { key: "matchtype", value: "{matchtype}" },
        { key: "utm_term", value: "{keyword}" }
      ]
    },
    taboola: {
      buySource: "taboola",
      label: "Taboola",
      shortLabel: "Taboola",
      params: [
        { key: "clid", value: "{click_id}" },
        { key: "utm_source", value: "taboola" },
        { key: "utm_medium", value: "native" },
        { key: "utm_campaign", value: "{campaign_name}" },
        { key: "campaign_id", value: "{campaign_id}" },
        { key: "ad_id", value: "{campaign_item_id}" },
        { key: "placement", value: "{placement_name}" },
        { key: "publisher", value: "{site}" },
        { key: "device", value: "{platform}" },
        { key: "creative", value: "{title}" }
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
