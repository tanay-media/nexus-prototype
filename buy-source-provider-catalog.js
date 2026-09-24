// Super-admin buy source *provider* catalog — market names + dispatch variable glossary.
// Prototype only; production would live in Base platform catalog + Serving adapters.
(function () {
  var DISPATCH_VARIABLES = [
    { token: "{{visit_id}}", group: "Visit", desc: "Serving visit id (join key for postbacks)" },
    { token: "{{clid}}", group: "Visit", desc: "Generic click id from entry URL ?clid=" },
    { token: "{{buy_source}}", group: "Visit", desc: "Wire buySource on visit (fb, google, outbrain, …)" },
    { token: "{{client_ip}}", group: "Visit", desc: "clientIpAddress from visit_served" },
    { token: "{{user_agent}}", group: "Visit", desc: "clientUserAgent from visit_served" },
    { token: "{{fbc}}", group: "Visit", desc: "Meta fbc cookie / derived from clid" },
    { token: "{{fbp}}", group: "Visit", desc: "Meta fbp cookie" },
    { token: "{{gclid}}", group: "Visit", desc: "Google click id (or mapped from clid)" },
    { token: "{{conversion_id}}", group: "Postback", desc: "Dedup id → Meta event_id, etc." },
    { token: "{{conversion_type}}", group: "Postback", desc: "lead, purchase, …" },
    { token: "{{amount}}", group: "Postback", desc: "Revenue from postback" },
    { token: "{{currency}}", group: "Postback", desc: "ISO currency" },
    { token: "{{event_name}}", group: "Dispatch", desc: "Mapped platform event for this fire" },
    { token: "{{event_time}}", group: "Dispatch", desc: "Unix seconds" },
    { token: "{{account.*}}", group: "Account", desc: "Publisher account field (e.g. {{account.api_token}})" }
  ];

  var TRIGGERS = [
    { id: "visit_served", label: "Visit", hint: "visit_served · page load" },
    { id: "impression", label: "Impression", hint: "page_render beacon" },
    { id: "cta_click", label: "Click", hint: "cta_click beacon" },
    { id: "postback", label: "Postback", hint: "advertiser conversion ingest" }
  ];

  // Names aligned with legacy TP Source / partner webhooks (50+). Slug = wire buySource suggestion.
  var MARKET_SOURCES = [
    { name: "LeadVision", slug: "leadvision", clidMacro: "{{lv_click_id}}" },
    { name: "Moonshot", slug: "moonshot", clidMacro: "{{ms_click_id}}" },
    { name: "Outbrain", slug: "outbrain", clidMacro: "{{ob_click_id}}" },
    { name: "Phonexa", slug: "phonexa", clidMacro: "{{px_click_id}}" },
    { name: "Revolutionary Media", slug: "revolutionary_media", clidMacro: "{{rm_click_id}}" },
    { name: "TMS", slug: "tms", clidMacro: "{{tms_click_id}}" },
    { name: "VariantVerdict", slug: "variantverdict", clidMacro: "{{vv_click_id}}" },
    { name: "adhere", slug: "adhere", clidMacro: "{{adh_click_id}}" },
    { name: "adhereregent", slug: "adhereregent", clidMacro: "{{adh_click_id}}" },
    { name: "alonzomedia", slug: "alonzomedia", clidMacro: "{{am_click_id}}" },
    { name: "ansira", slug: "ansira", clidMacro: "{{ans_click_id}}" },
    { name: "bob_nb", slug: "bob_nb", clidMacro: "{{bob_click_id}}" },
    { name: "cappsool", slug: "cappsool", clidMacro: "{{cap_click_id}}" },
    { name: "cappsool1", slug: "cappsool1", clidMacro: "{{cap_click_id}}" },
    { name: "NewsBreak", slug: "newsbreak", clidMacro: "{{nb_callback}}" },
    { name: "Taboola", slug: "taboola", clidMacro: "{{click_id}}" },
    { name: "RevContent", slug: "revcontent", clidMacro: "{{rev_click_id}}" },
    { name: "MGID", slug: "mgid", clidMacro: "{{mgid_click_id}}" },
    { name: "Yahoo DSP", slug: "yahoo_dsp", clidMacro: "{{vmcid}}" },
    { name: "Media.net", slug: "medianet", clidMacro: "{{mn_click_id}}" },
    { name: "Zemanta", slug: "zemanta", clidMacro: "{{zem_click_id}}" },
    { name: "StackAdapt", slug: "stackadapt", clidMacro: "{{sa_click_id}}" },
    { name: "TripleLift", slug: "triplelift", clidMacro: "{{tl_click_id}}" },
    { name: "Nativo", slug: "nativo", clidMacro: "{{nt_click_id}}" },
    { name: "Sharethrough", slug: "sharethrough", clidMacro: "{{st_click_id}}" },
    { name: "PowerInbox", slug: "powerinbox", clidMacro: "{{pi_click_id}}" },
    { name: "Bidtellect", slug: "bidtellect", clidMacro: "{{bt_click_id}}" },
    { name: "Ex.co", slug: "exco", clidMacro: "{{ex_click_id}}" },
    { name: "TikTok", slug: "tiktok", clidMacro: "{{ttclid}}" },
    { name: "Snapchat", slug: "snapchat", clidMacro: "{{sc_click_id}}" },
    { name: "Pinterest", slug: "pinterest", clidMacro: "{{epik}}" },
    { name: "Reddit", slug: "reddit", clidMacro: "{{rdt_cid}}" },
    { name: "Bing Ads", slug: "bing", clidMacro: "{{msclkid}}" },
    { name: "Quora", slug: "quora", clidMacro: "{{qclid}}" },
    { name: "Verizon Media", slug: "verizon_media", clidMacro: "{{vmcid}}" },
    { name: "LiveIntent", slug: "liveintent", clidMacro: "{{li_click_id}}" },
    { name: "Powerlinks", slug: "powerlinks", clidMacro: "{{pl_click_id}}" },
    { name: "Connatix", slug: "connatix", clidMacro: "{{cx_click_id}}" },
    { name: "Minute Media", slug: "minute_media", clidMacro: "{{mm_click_id}}" },
    { name: "SmartNews", slug: "smartnews", clidMacro: "{{sn_click_id}}" },
    { name: "PopIn", slug: "popin", clidMacro: "{{pop_click_id}}" },
    { name: "Dianomi", slug: "dianomi", clidMacro: "{{dia_click_id}}" },
    { name: "Gravity", slug: "gravity", clidMacro: "{{grav_click_id}}" },
    { name: "Content.ad", slug: "contentad", clidMacro: "{{ca_click_id}}" },
    { name: "RevJet", slug: "revjet", clidMacro: "{{rj_click_id}}" },
    { name: "Kargo", slug: "kargo", clidMacro: "{{kg_click_id}}" },
    { name: "GumGum", slug: "gumgum", clidMacro: "{{gg_click_id}}" },
    { name: "AdRoll", slug: "adroll", clidMacro: "{{adroll_click_id}}" },
    { name: "Criteo", slug: "criteo", clidMacro: "{{criteo_click_id}}" },
    { name: "The Trade Desk", slug: "ttd", clidMacro: "{{ttd_click_id}}" },
    { name: "DV360", slug: "dv360", clidMacro: "{{gclid}}" },
    { name: "Amazon DSP", slug: "amazon_dsp", clidMacro: "{{amzn_click_id}}" },
    { name: "Roku", slug: "roku", clidMacro: "{{roku_click_id}}" },
    { name: "Nextdoor", slug: "nextdoor", clidMacro: "{{nd_click_id}}" },
    { name: "LinkedIn", slug: "linkedin", clidMacro: "{{li_fat_id}}" }
  ];

  function defaultProfile(trigger, slug, clidMacro) {
    var wire = slug || "custom";
    var clid = clidMacro || "{{click_id}}";
    if (trigger === "postback") {
      if (slug === "newsbreak") {
        return {
          trigger: trigger,
          enabled: true,
          firing: { mode: "realtime", batchMax: 1, batchWindowSec: 0, dedupeKey: "{{visit_id}}:{{conversion_type}}" },
          http: { method: "GET", url: "https://business.newsbreak.com/tracking/attribute" },
          bodyType: "query",
          bodyTemplate: "callback={{clid}}&event_type={{event_name}}&nb_value={{amount}}",
          conditions: [{ field: "conversion_type", op: "not_empty", value: "" }]
        };
      }
      return {
        trigger: trigger,
        enabled: true,
        firing: { mode: "realtime", batchMax: 1, batchWindowSec: 0, dedupeKey: "{{conversion_id}}" },
        http: { method: "POST", url: "https://api.example.com/v1/conversions" },
        bodyType: "json",
        bodyTemplate: JSON.stringify({
          click_id: "{{clid}}",
          event: "{{event_name}}",
          conversion_type: "{{conversion_type}}",
          value: "{{amount}}",
          currency: "{{currency}}",
          visit_id: "{{visit_id}}",
          event_time: "{{event_time}}"
        }, null, 2),
        conditions: [{ field: "conversion_type", op: "in", value: "lead,purchase" }]
      };
    }
    var evtMap = { visit_served: "page_view", impression: "view_content", cta_click: "cta_click" };
    return {
      trigger: trigger,
      enabled: trigger === "visit_served" || trigger === "cta_click",
      firing: {
        mode: trigger === "impression" ? "batch" : "realtime",
        batchMax: trigger === "impression" ? 25 : 1,
        batchWindowSec: trigger === "impression" ? 30 : 0,
        dedupeKey: "{{visit_id}}:" + trigger
      },
      http: {
        method: "GET",
        url: "https://trk." + wire + ".com/event"
      },
      bodyType: "query",
      bodyTemplate: "click_id={{clid}}&buy_source={{buy_source}}&event={{event_name}}&visit_id={{visit_id}}",
      conditions: []
    };
  }

  function defaultDispatchSuperset(slug, clidMacro) {
    return {
      traffic: {
        buySourceWire: slug || "custom",
        clidMacro: clidMacro || "{{click_id}}",
        entryUrlTemplate: "{{route}}?clid=" + (clidMacro || "{{click_id}}") + "&buySource=" + (slug || "custom")
      },
      profiles: TRIGGERS.map(function (t) {
        return defaultProfile(t.id, slug, clidMacro);
      })
    };
  }

  function marketBySlug(slug) {
    return MARKET_SOURCES.find(function (m) { return m.slug === slug; }) || null;
  }

  var AUTH_MODES = [
    { id: "api_token", label: "API token paste" },
    { id: "oauth2", label: "OAuth 2.0" },
    { id: "oauth2_plus_fields", label: "OAuth + extra fields" },
    { id: "basic", label: "Basic login" },
    { id: "signed", label: "HMAC signed" },
    { id: "partner_only", label: "Partner portal" }
  ];

  function defaultAuth(slug) {
    var s = slug || "";
    if (s === "google" || s === "dv360" || s === "bing") {
      return {
        mode: "oauth2_plus_fields",
        oauth: {
          authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
          tokenUrl: "https://oauth2.googleapis.com/token",
          scopes: "https://www.googleapis.com/auth/adwords",
          buttonLabel: "Sign in with Google",
          refreshTokenField: "accessToken"
        },
        instructions: "",
        extraFieldHints: ["developer_token", "login_customer_id"]
      };
    }
    if (s === "taboola" || s === "newsbreak" || s === "outbrain" || s === "revcontent" || s === "mgid") {
      return {
        mode: "api_token",
        oauth: null,
        instructions: "Copy the S2S / API token from the partner dashboard and paste when adding the account.",
        extraFieldHints: []
      };
    }
    if (s === "phonexa" || s === "leadvision" || s === "tms" || s === "variantverdict") {
      return {
        mode: "partner_only",
        oauth: null,
        instructions: "Account is provisioned by your partner rep. Enter the account / campaign id they assign; token may arrive by email.",
        extraFieldHints: []
      };
    }
    if (s === "tiktok" || s === "snapchat" || s === "pinterest" || s === "linkedin") {
      return {
        mode: "oauth2",
        oauth: {
          authorizeUrl: "https://example.com/oauth/authorize",
          tokenUrl: "https://example.com/oauth/token",
          scopes: "ads.read ads.write",
          buttonLabel: "Sign in with " + (s === "tiktok" ? "TikTok" : s),
          refreshTokenField: "accessToken"
        },
        instructions: "",
        extraFieldHints: []
      };
    }
    return {
      mode: "api_token",
      oauth: null,
      instructions: "",
      extraFieldHints: []
    };
  }

  function buildCurlPreview(profile, headersRaw) {
    if (!profile || !profile.http) return "# Configure method and URL";
    var method = (profile.http.method || "GET").toUpperCase();
    var url = profile.http.url || "";
    var lines = ["curl -X " + method + " '" + url + "'"];
    (headersRaw || "").split("\n").forEach(function (line) {
      var p = line.split(":");
      if (p.length >= 2 && p[0].trim()) {
        lines.push("  -H '" + p[0].trim() + ": " + p.slice(1).join(":").trim() + "'");
      }
    });
    if (profile.bodyType === "json" && profile.bodyTemplate) {
      lines.push("  -d '" + profile.bodyTemplate.replace(/'/g, "'\\''") + "'");
    } else if (profile.bodyType === "query" && profile.bodyTemplate) {
      var join = url.indexOf("?") >= 0 ? "&" : "?";
      lines[0] = "curl -X " + method + " '" + url + join + profile.bodyTemplate + "'";
    }
    return lines.join(" \\\n");
  }

  window.nexusBuySourceProviderCatalog = {
    DISPATCH_VARIABLES: DISPATCH_VARIABLES,
    TRIGGERS: TRIGGERS,
    MARKET_SOURCES: MARKET_SOURCES,
    AUTH_MODES: AUTH_MODES,
    defaultDispatchSuperset: defaultDispatchSuperset,
    defaultProfile: defaultProfile,
    defaultAuth: defaultAuth,
    marketBySlug: marketBySlug,
    buildCurlPreview: buildCurlPreview
  };
})();
