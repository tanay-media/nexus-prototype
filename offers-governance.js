/* Offers Wall governance — shared store, mappings, effective status, alerts (prototype). */
(function (w) {
  "use strict";

  var STORAGE_KEY = "nexus-offers-gov::v7";
  var LEGACY_STORAGE_KEYS = ["nexus-offers-gov::v6", "nexus-offers-gov::v5", "nexus-offers-gov::v4"];

  var DEFAULT_TRACKING_PARAMS = [
    { key: "cp1", value: "{{campaign_id}}" },
    { key: "cp2", value: "{{adset_id}}" },
    { key: "cp3", value: "{{ad_id}}" },
    { key: "cp4", value: "{{variant_name}}" },
    { key: "tpid", value: "{{visit_id}}" },
    { key: "tps", value: "fb" },
    { key: "ppid", value: "8PRN625DH" },
    { key: "pid", value: "8PRN625DH" },
    { key: "purl", value: "https://{{route}}" }
  ];
  var ALERTS_KEY = "nexus-offers-alerts::v1";

  var CURRENT_USER = { email: "ops@mediaedge.com" };
  var NOW_ISO = "2026-08-10T10:00:00.000Z";

  var A360_BUY_SOURCES = [
    { id: "fb", name: "Meta (Facebook)" },
    { id: "google", name: "Google Ads" },
    { id: "taboola", name: "Taboola" },
    { id: "tiktok", name: "TikTok Ads" },
    { id: "snap", name: "Snapchat" }
  ];

  var TEAMS = [
    { id: "team-acme", name: "ACME Media", a360Status: "active" },
    { id: "team-fin", name: "FinanceEdge", a360Status: "active" }
  ];

  function auditFields() {
    return {
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
      createdBy: CURRENT_USER.email,
      updatedBy: CURRENT_USER.email
    };
  }

  function touchEntity(entity) {
    entity.updatedAt = new Date().toISOString();
    entity.updatedBy = CURRENT_USER.email;
  }

  function defaultState() {
    var advertisers = [
      Object.assign({ id: "adv-hb", name: "Homebuddy", status: "active", description: "Home improvement lead gen partner for US walk-in and roofing offers.", teamIds: ["team-acme"], deletedAt: null }, auditFields()),
      Object.assign({ id: "adv-bv", name: "Beenverified", status: "active", description: "People search and public records advertiser for VIN and obituary offers.", teamIds: ["team-acme", "team-fin"], deletedAt: null }, auditFields()),
      Object.assign({ id: "adv-sf", name: "Smart Financials", status: "active", description: "Insurance and finance lead gen advertiser for auto and life verticals.", teamIds: ["team-acme", "team-fin"], deletedAt: null }, auditFields())
    ];

    var parentOffers = [
      Object.assign({ id: "po-hb-wis", advertiserId: "adv-hb", name: "Walk-in showers", categoryLevel1: "Home & Garden", categoryLevel2: "Home Improvement", categoryLevel3: "Walk-in showers", dealType: "cpa", targetType: "cpa", targetValue: { amount: 85, currency: "USD" }, countries: ["US"], status: "active", teamIds: ["team-acme"], description: "Canonical walk-in shower CPA offer for Homebuddy US campaigns.", deletedAt: null }, auditFields()),
      Object.assign({ id: "po-hb-wit", advertiserId: "adv-hb", name: "Walk-in Tubs", categoryLevel1: "Home & Garden", categoryLevel2: "Home Improvement", categoryLevel3: "Walk-in tubs", dealType: "cpa", targetType: "cpa", targetValue: { amount: 92, currency: "USD" }, countries: ["US", "CA"], status: "active", teamIds: ["team-acme"], description: "Walk-in tub install leads for Homebuddy across US and Canada markets.", deletedAt: null }, auditFields()),
      Object.assign({ id: "po-hb-roof", advertiserId: "adv-hb", name: "Roofing", categoryLevel1: "Home & Garden", categoryLevel2: "Home Improvement", categoryLevel3: "Roofing", dealType: "cpa", targetType: "cpa", targetValue: { amount: 78, currency: "USD" }, countries: ["US"], status: "active", teamIds: ["team-acme"], description: "Roof replacement and repair lead offer for Homebuddy US homeowners.", deletedAt: null }, auditFields()),
      Object.assign({ id: "po-bv-vin", advertiserId: "adv-bv", name: "VIN Search", categoryLevel1: "Autos & Vehicles", categoryLevel2: "Vehicle Shopping", categoryLevel3: "VIN search", dealType: "cpc", targetType: "cpa", targetValue: { amount: 12, currency: "USD" }, countries: ["US"], status: "active", teamIds: ["team-acme", "team-fin"], description: "Vehicle history and VIN lookup offer for Beenverified search traffic.", deletedAt: null }, auditFields()),
      Object.assign({ id: "po-bv-obit", advertiserId: "adv-bv", name: "Obituary search", categoryLevel1: "People & Society", categoryLevel2: "Family & Relationships", categoryLevel3: "Obituary search", dealType: "cpa", targetType: "cpa", targetValue: { amount: 8, currency: "USD" }, countries: ["US"], status: "inactive", teamIds: ["team-acme"], description: "Obituary and memorial search offer currently paused in catalog.", deletedAt: null }, auditFields()),
      Object.assign({ id: "po-sf-auto", advertiserId: "adv-sf", name: "Auto Insurance", categoryLevel1: "Finance", categoryLevel2: "Insurance", categoryLevel3: "Auto insurance", dealType: "cpa", targetType: "roas", targetValue: { amount: 2.4, currency: "USD" }, countries: ["US", "GB"], status: "active", teamIds: ["team-acme"], description: "Auto insurance quote funnel with ROAS target for Smart Financials.", deletedAt: null }, auditFields()),
      Object.assign({ id: "po-sf-life", advertiserId: "adv-sf", name: "Life Insurance", categoryLevel1: "Finance", categoryLevel2: "Insurance", categoryLevel3: "Life insurance", dealType: "cpa", targetType: "cpa", targetValue: { amount: 45, currency: "USD" }, countries: ["US"], status: "active", teamIds: ["team-acme"], description: "Life insurance lead offer for Smart Financials US acquisition campaigns.", deletedAt: null }, auditFields())
    ];

    var teamOffers = [
      Object.assign({ id: "to-hb-wis", parentOfferId: "po-hb-wis", teamId: "team-acme", displayName: "Walk-in showers — ACME", description: "", status: "active", dealValue: { amount: 85, currency: "USD" }, campaignId: "MAX-88421", campaignProvider: "max", ctaUrl: "https://trk.pmsrv.co/v2/trk?adid=RmWGqVoe&akey=cac2c3c0-d6d7-45b7-b3f0-3d107b37584f", trackingParams: DEFAULT_TRACKING_PARAMS.map(function (x) { return { key: x.key, value: x.value }; }), buySources: null, workspaceMaps: [{ workspaceId: "acme-growth", teamId: "team-acme" }, { workspaceId: "acme-brand", teamId: "team-acme" }], deletedAt: null, deletedBy: null }, auditFields()),
      Object.assign({ id: "to-hb-wis-b", parentOfferId: "po-hb-wis", teamId: "team-acme", displayName: "Walk-in showers — ACME (Brand only)", description: "Second deployment for brand workspace.", status: "active", dealValue: { amount: 85, currency: "USD" }, campaignId: "MAX-88429", campaignProvider: "max", ctaUrl: "https://trk.pmsrv.co/v2/trk?adid=RmWGqVoe&akey=cac2c3c0-d6d7-45b7-b3f0-3d107b37584f", trackingParams: DEFAULT_TRACKING_PARAMS.map(function (x) { return { key: x.key, value: x.value }; }), buySources: ["fb"], workspaceMaps: [{ workspaceId: "acme-brand", teamId: "team-acme" }], deletedAt: null, deletedBy: null }, auditFields()),
      Object.assign({ id: "to-hb-wit", parentOfferId: "po-hb-wit", teamId: "team-acme", displayName: "Walk-in Tubs — ACME", description: "", status: "active", dealValue: { amount: 92, currency: "USD" }, campaignId: "MAX-88422", campaignProvider: "max", ctaUrl: "https://trk.pmsrv.co/v2/trk?adid=Xk9pLmTu&akey=b1c2d3e4-f5a6-7890-abcd-ef1234567890", trackingParams: DEFAULT_TRACKING_PARAMS.map(function (x) { return { key: x.key, value: x.value }; }), buySources: null, workspaceMaps: [{ workspaceId: "acme-growth", teamId: "team-acme" }], deletedAt: null, deletedBy: null }, auditFields()),
      Object.assign({ id: "to-hb-roof", parentOfferId: "po-hb-roof", teamId: "team-acme", displayName: "Roofing — ACME", description: "", status: "active", dealValue: { amount: 78, currency: "USD" }, campaignId: "MAX-88423", campaignProvider: "max", ctaUrl: "https://trk.pmsrv.co/v2/trk?adid=QwRoof01&akey=a1b2c3d4", trackingParams: DEFAULT_TRACKING_PARAMS.map(function (x) { return { key: x.key, value: x.value }; }), buySources: null, workspaceMaps: [{ workspaceId: "acme-growth", teamId: "team-acme" }, { workspaceId: "acme-brand", teamId: "team-acme" }], deletedAt: null, deletedBy: null }, auditFields()),
      Object.assign({ id: "to-bv-vin", parentOfferId: "po-bv-vin", teamId: "team-acme", displayName: "VIN Search — ACME", description: "", status: "active", dealValue: { amount: 0.45, currency: "USD" }, campaignId: "MAX-90101", campaignProvider: "max", ctaUrl: "https://trk.pmsrv.co/v2/trk?adid=BvVin01&akey=z9y8x7w6", trackingParams: DEFAULT_TRACKING_PARAMS.map(function (x) { return { key: x.key, value: x.value }; }), buySources: ["google", "taboola"], workspaceMaps: [{ workspaceId: "acme-growth", teamId: "team-acme" }, { workspaceId: "fin-main", teamId: "team-acme" }], deletedAt: null, deletedBy: null }, auditFields()),
      Object.assign({ id: "to-bv-obit", parentOfferId: "po-bv-obit", teamId: "team-acme", displayName: "Obituary search — ACME", description: "", status: "inactive", dealValue: { amount: 8, currency: "USD" }, campaignId: "MAX-90110", campaignProvider: "max", ctaUrl: "https://trk.pmsrv.co/v2/trk?adid=BvOb01&akey=obit1234", trackingParams: DEFAULT_TRACKING_PARAMS.map(function (x) { return { key: x.key, value: x.value }; }), buySources: null, workspaceMaps: [{ workspaceId: "acme-brand", teamId: "team-acme" }], deletedAt: "2025-07-15T10:30:00.000Z", deletedBy: "ops@acme.media" }, auditFields()),
      Object.assign({ id: "to-sf-auto", parentOfferId: "po-sf-auto", teamId: "team-acme", displayName: "Auto Insurance — ACME", description: "", status: "inactive", dealValue: { amount: 50, currency: "USD" }, campaignId: "MAX-90102", campaignProvider: "max", ctaUrl: "https://trk.pmsrv.co/v2/trk?adid=SfAuto01&akey=m1n2o3p4", trackingParams: DEFAULT_TRACKING_PARAMS.map(function (x) { return { key: x.key, value: x.value }; }), buySources: null, workspaceMaps: [{ workspaceId: "fin-main", teamId: "team-acme" }], deletedAt: null, deletedBy: null }, auditFields())
    ];

    var advertiserTeamMappings = [];
    var parentOfferTeamMappings = [];

    advertisers.forEach(function (a) {
      (a.teamIds || []).forEach(function (teamId) {
        advertiserTeamMappings.push(Object.assign({ advertiserId: a.id, teamId: teamId, deletedAt: null, deletedBy: null }, auditFields()));
      });
    });
    parentOffers.forEach(function (p) {
      (p.teamIds || []).forEach(function (teamId) {
        parentOfferTeamMappings.push(Object.assign({ parentOfferId: p.id, teamId: teamId, deletedAt: null, deletedBy: null }, auditFields()));
      });
    });

    return {
      advertisers: advertisers,
      parentOffers: parentOffers,
      teamOffers: teamOffers,
      advertiserTeamMappings: advertiserTeamMappings,
      parentOfferTeamMappings: parentOfferTeamMappings,
      teams: TEAMS.slice()
    };
  }

  function migrateTeamOfferWorkspaceFields(state) {
    (state.teamOffers || []).forEach(function (to) {
      if (!to.workspaceMaps && to.workspaceIds) {
        to.workspaceMaps = (to.workspaceIds || []).map(function (wsId) {
          return { workspaceId: wsId, teamId: to.teamId };
        });
      }
      if (!to.campaignProvider) to.campaignProvider = "max";
    });
  }

  function normalizeTrackingParams(params) {
    if (!params || !params.length) return params;
    return params.map(function (p) {
      var val = p.value;
      if (p.key === "tpid" && (val === "auto" || !val)) val = "{{visit_id}}";
      if (p.key === "purl" && (val === "{{route}}" || !val)) val = "https://{{route}}";
      return { key: p.key, value: val };
    });
  }

  function migrateTeamOfferTrackingParams(state) {
    (state.teamOffers || []).forEach(function (to) {
      if (to.trackingParams) to.trackingParams = normalizeTrackingParams(to.trackingParams);
      if (to.params) to.params = normalizeTrackingParams(to.params);
    });
  }

  function migrateParentOfferBuySources(state) {
    (state.parentOffers || []).forEach(function (po) {
      delete po.buySources;
    });
  }

  function loadState() {
    try {
      var keys = [STORAGE_KEY].concat(LEGACY_STORAGE_KEYS);
      for (var i = 0; i < keys.length; i++) {
        var raw = localStorage.getItem(keys[i]);
        if (!raw) continue;
        var parsed = JSON.parse(raw);
        migrateTeamOfferWorkspaceFields(parsed);
        migrateTeamOfferTrackingParams(parsed);
        migrateParentOfferBuySources(parsed);
        if (keys[i] !== STORAGE_KEY) localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    } catch (e) {}
    return defaultState();
  }

  var state = loadState();

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      w.dispatchEvent(new CustomEvent("nexus-offers-updated"));
    } catch (e) {}
  }

  function loadAlerts() {
    try {
      var raw = localStorage.getItem(ALERTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function saveAlerts(alerts) {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
      w.dispatchEvent(new CustomEvent("nexus-offers-alerts-updated"));
    } catch (e) {}
  }

  function addAlert(payload) {
    var alerts = loadAlerts();
    alerts.unshift(Object.assign({
      id: "alert-" + Date.now() + "-" + Math.random().toString(36).slice(2, 5),
      at: new Date().toISOString(),
      read: false,
      channel: "ui"
    }, payload));
    if (alerts.length > 50) alerts.length = 50;
    saveAlerts(alerts);
  }

  function notifyGovernanceEvent(type, detail) {
    var msg = detail.message || type;
    addAlert({ type: type, message: msg, detail: detail });
    if (detail.email) {
      addAlert({
        type: type + "_email",
        channel: "email",
        message: "[Email → " + (detail.emailTo || "team owners + lander creators") + "] " + msg,
        detail: detail
      });
    }
  }

  function advById(id) {
    return state.advertisers.find(function (a) { return a.id === id; });
  }

  function parentById(id) {
    return state.parentOffers.find(function (p) { return p.id === id; });
  }

  function teamOfferById(id) {
    return state.teamOffers.find(function (t) { return t.id === id; });
  }

  function teamById(id) {
    return state.teams.find(function (t) { return t.id === id; });
  }

  function isAdvertiserMappedToTeam(advertiserId, teamId) {
    return state.advertiserTeamMappings.some(function (m) {
      return m.advertiserId === advertiserId && m.teamId === teamId && !m.deletedAt;
    });
  }

  function isParentMappedToTeam(parentId, teamId) {
    return state.parentOfferTeamMappings.some(function (m) {
      return m.parentOfferId === parentId && m.teamId === teamId && !m.deletedAt;
    });
  }

  function parentOfferEffectiveStatus(p) {
    if (!p || p.deletedAt) return "inactive";
    var adv = advById(p.advertiserId);
    if (!adv || adv.status === "inactive" || adv.deletedAt) return "inactive";
    if (p.status === "inactive") return "inactive";
    return "active";
  }

  function teamOfferEffectiveStatus(to) {
    if (!to || to.deletedAt) return "inactive";
    var team = teamById(to.teamId);
    if (!team || team.a360Status === "deleted") return "inactive";
    var p = parentById(to.parentOfferId);
    if (!p) return "inactive";
    if (to.status === "inactive") return "inactive";
    if (parentOfferEffectiveStatus(p) === "inactive") return "inactive";
    if (!isAdvertiserMappedToTeam(p.advertiserId, to.teamId)) return "inactive";
    if (!isParentMappedToTeam(p.id, to.teamId)) return "inactive";
    return "active";
  }

  function workspaceIdsFromMaps(to) {
    return (to.workspaceMaps || []).map(function (m) { return m.workspaceId; });
  }

  function softDeleteTeamOffer(to, reason) {
    if (!to || to.deletedAt) return;
    var prevEffective = teamOfferEffectiveStatus(to);
    to.deletedAt = new Date().toISOString();
    to.deletedBy = CURRENT_USER.email;
    touchEntity(to);
    notifyGovernanceEvent("deal_soft_deleted", {
      message: "Deal \"" + (to.displayName || to.id) + "\" was soft-deleted" + (reason ? " (" + reason + ")" : "") + ".",
      teamOfferId: to.id,
      reason: reason,
      email: true,
      emailTo: "lander creators + team owners"
    });
    if (prevEffective === "active") {
      notifyGovernanceEvent("effective_status_changed", {
        message: "Effective status for \"" + (to.displayName || to.id) + "\" changed to inactive.",
        teamOfferId: to.id,
        from: "active",
        to: "inactive"
      });
    }
    saveState();
  }

  function restoreTeamOffer(to) {
    if (!to || !to.deletedAt) return;
    to.deletedAt = null;
    to.deletedBy = null;
    touchEntity(to);
    var eff = teamOfferEffectiveStatus(to);
    notifyGovernanceEvent("deal_restored", {
      message: "Deal \"" + (to.displayName || to.id) + "\" was restored. Effective status: " + eff + ".",
      teamOfferId: to.id
    });
    saveState();
  }

  function softDeleteParentTeamMapping(parentId, teamId, reason) {
    var m = state.parentOfferTeamMappings.find(function (x) {
      return x.parentOfferId === parentId && x.teamId === teamId;
    });
    if (!m) {
      m = Object.assign({ parentOfferId: parentId, teamId: teamId }, auditFields());
      state.parentOfferTeamMappings.push(m);
    }
    if (!m.deletedAt) {
      m.deletedAt = new Date().toISOString();
      m.deletedBy = CURRENT_USER.email;
      touchEntity(m);
      notifyGovernanceEvent("offer_team_soft_deleted", {
        message: "Offer↔team mapping removed (soft-deleted) for offer " + parentId + " / team " + teamId + ".",
        parentOfferId: parentId,
        teamId: teamId,
        reason: reason,
        email: true
      });
    }
    state.teamOffers.filter(function (to) {
      return to.parentOfferId === parentId && to.teamId === teamId && !to.deletedAt;
    }).forEach(function (to) {
      softDeleteTeamOffer(to, reason || "offer_team unmapped");
    });
    saveState();
  }

  function restoreParentTeamMapping(parentId, teamId) {
    var m = state.parentOfferTeamMappings.find(function (x) {
      return x.parentOfferId === parentId && x.teamId === teamId;
    });
    if (!m) {
      m = Object.assign({ parentOfferId: parentId, teamId: teamId }, auditFields());
      state.parentOfferTeamMappings.push(m);
    }
    if (m.deletedAt) {
      m.deletedAt = null;
      m.deletedBy = null;
      touchEntity(m);
      notifyGovernanceEvent("offer_team_restored", {
        message: "Offer↔team mapping restored for offer " + parentId + " / team " + teamId + ".",
        parentOfferId: parentId,
        teamId: teamId
      });
    }
    saveState();
  }

  function softDeleteAdvertiserTeamMapping(advertiserId, teamId, reason) {
    var m = state.advertiserTeamMappings.find(function (x) {
      return x.advertiserId === advertiserId && x.teamId === teamId;
    });
    if (m && !m.deletedAt) {
      m.deletedAt = new Date().toISOString();
      m.deletedBy = CURRENT_USER.email;
      touchEntity(m);
    }
    state.teamOffers.filter(function (to) {
      if (to.teamId !== teamId || to.deletedAt) return false;
      var p = parentById(to.parentOfferId);
      return p && p.advertiserId === advertiserId;
    }).forEach(function (to) {
      softDeleteTeamOffer(to, reason || "advertiser_team unmapped");
    });
    saveState();
  }

  function restoreAdvertiserTeamMapping(advertiserId, teamId) {
    var m = state.advertiserTeamMappings.find(function (x) {
      return x.advertiserId === advertiserId && x.teamId === teamId;
    });
    if (!m) {
      m = Object.assign({ advertiserId: advertiserId, teamId: teamId }, auditFields());
      state.advertiserTeamMappings.push(m);
    }
    if (m.deletedAt) {
      m.deletedAt = null;
      m.deletedBy = null;
      touchEntity(m);
    }
    saveState();
  }

  function cascadeSoftDeleteTeamOffersForParent(parent, reason) {
    state.teamOffers.filter(function (to) {
      return to.parentOfferId === parent.id && !to.deletedAt;
    }).forEach(function (to) {
      softDeleteTeamOffer(to, reason || "offer inactive/deleted");
    });
  }

  function softDeleteParentOffer(parent, reason) {
    if (!parent || parent.deletedAt) return;
    parent.deletedAt = new Date().toISOString();
    parent.deletedBy = CURRENT_USER.email;
    touchEntity(parent);
    cascadeSoftDeleteTeamOffersForParent(parent, reason || "offer deleted");
    notifyGovernanceEvent("offer_deleted", {
      message: "Offer \"" + (parent.name || parent.id) + "\" was soft-deleted. Child deals soft-deleted; hard purge after 90 days.",
      parentOfferId: parent.id,
      email: true
    });
    saveState();
  }

  function handleA360TeamUpdate(teamId, newName) {
    var team = teamById(teamId);
    if (!team) return;
    team.name = newName;
    notifyGovernanceEvent("a360_team_updated", { message: "A360 team " + teamId + " renamed to \"" + newName + "\".", teamId: teamId });
    saveState();
  }

  function handleA360TeamDelete(teamId) {
    var team = teamById(teamId);
    if (!team) return;
    team.a360Status = "deleted";
    state.teamOffers.filter(function (to) {
      return to.teamId === teamId && !to.deletedAt;
    }).forEach(function (to) {
      softDeleteTeamOffer(to, "A360 team deleted");
    });
    notifyGovernanceEvent("a360_team_deleted", {
      message: "A360 team " + (team.name || teamId) + " was deleted. Dependent deals soft-deleted.",
      teamId: teamId,
      email: true
    });
    saveState();
  }

  function resetToSeed() {
    state = defaultState();
    saveState();
  }

  w.NexusOffersGov = {
    STORAGE_KEY: STORAGE_KEY,
    ALERTS_KEY: ALERTS_KEY,
    A360_BUY_SOURCES: A360_BUY_SOURCES,
    CURRENT_USER: CURRENT_USER,
    auditFields: auditFields,
    touchEntity: touchEntity,
    getState: function () { return state; },
    saveState: saveState,
    resetToSeed: resetToSeed,
    loadAlerts: loadAlerts,
    saveAlerts: saveAlerts,
    addAlert: addAlert,
    notifyGovernanceEvent: notifyGovernanceEvent,
    advById: advById,
    parentById: parentById,
    teamOfferById: teamOfferById,
    teamById: teamById,
    isAdvertiserMappedToTeam: isAdvertiserMappedToTeam,
    isParentMappedToTeam: isParentMappedToTeam,
    parentOfferEffectiveStatus: parentOfferEffectiveStatus,
    teamOfferEffectiveStatus: teamOfferEffectiveStatus,
    workspaceIdsFromMaps: workspaceIdsFromMaps,
    softDeleteTeamOffer: softDeleteTeamOffer,
    restoreTeamOffer: restoreTeamOffer,
    softDeleteParentTeamMapping: softDeleteParentTeamMapping,
    restoreParentTeamMapping: restoreParentTeamMapping,
    softDeleteAdvertiserTeamMapping: softDeleteAdvertiserTeamMapping,
    restoreAdvertiserTeamMapping: restoreAdvertiserTeamMapping,
    cascadeSoftDeleteTeamOffersForParent: cascadeSoftDeleteTeamOffersForParent,
    softDeleteParentOffer: softDeleteParentOffer,
    handleA360TeamUpdate: handleA360TeamUpdate,
    handleA360TeamDelete: handleA360TeamDelete
  };
})(window);
