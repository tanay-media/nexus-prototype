/**
 * Landers linked to deals (team offers) — shared catalog for Offers + Landers screens.
 */
(function (global) {
  var CATALOG = [
    { id: "summer-sale", name: "Summer Sale", url: "https://offers.acme.com/summer-sale-hero", teamOfferId: "to-hb-wis", status: "published", variantCount: 2 },
    { id: "fall-preview", name: "Fall Preview", url: "https://offers.acme.com/fall-preview", teamOfferId: "to-hb-wis", status: "unpublished", variantCount: 1 },
    { id: "referral-q2", name: "Referral Q2", url: "https://refer.acme.com/referral-q2", teamOfferId: "to-hb-wit", status: "published", variantCount: 2 },
    { id: "founder-letter", name: "Founder Letter", url: "https://offers.acme.com/founder-letter", teamOfferId: "to-hb-roof", status: "published", variantCount: 1 },
    { id: "partner-announce", name: "Partner Announce", url: "https://try.acme.com/partner-announce", teamOfferId: "to-hb-roof", status: "published", variantCount: 1 },
    { id: "black-friday", name: "Black Friday", url: "https://offers.acme.com/black-friday-2026", teamOfferId: "to-bv-vin", status: "published", variantCount: 1 },
    { id: "holiday-teaser", name: "Holiday Teaser", url: "https://offers.acme.com/holiday-teaser", teamOfferId: "to-bv-vin", status: "unpublished", variantCount: 1 },
    { id: "spring-promo", name: "Spring Promo", url: "https://offers.acme.com/spring-promo", teamOfferId: "to-sf-auto", status: "published", variantCount: 1 },
    { id: "partner-pulse-draft", name: "Partner Pulse", url: "https://try.acme.com/partner-pulse", teamOfferId: "to-sf-auto", status: "unpublished", variantCount: 1 }
  ];

  function forTeamOffer(teamOfferId) {
    return CATALOG.filter(function (l) { return l.teamOfferId === teamOfferId; });
  }

  function forParentOffer(parentOfferId, teamOffers) {
    var ids = {};
    (teamOffers || []).forEach(function (to) {
      if (to.parentOfferId === parentOfferId) ids[to.id] = true;
    });
    return CATALOG.filter(function (l) { return ids[l.teamOfferId]; });
  }

  global.NexusDealLanders = {
    catalog: CATALOG,
    forTeamOffer: forTeamOffer,
    forParentOffer: forParentOffer
  };
})(window);
