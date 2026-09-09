/**
 * Landers linked to deals (team offers) — shared catalog for Offers + Landers screens.
 */
(function (global) {
  var CATALOG = [
    {
      id: "summer-sale", name: "Summer Sale", url: "https://offers.acme.com/summer-sale-hero",
      split: "50/30/20%", updated: "2h ago", by: "Kyle", teamOfferId: "to-hb-wis", status: "published",
      visits: 200000, impressions: 169700, clicks: 114374, conversions: 78608, score: 0.46,
      variants: [
        { name: "Main hero", split: "50%", updated: "2h ago", by: "Kyle", visits: 100000, impressions: 85000, clicks: 58000, conversions: 40000, score: 0.52 },
        { name: "Urgency countdown", split: "30%", updated: "3h ago", by: "Maya", visits: 60000, impressions: 50000, clicks: 28000, conversions: 15000, score: 0.30 },
        { name: "Social proof strip", split: "20%", updated: "4h ago", by: "Sam", visits: 40000, impressions: 34700, clicks: 28374, conversions: 23608, score: 0.41 }
      ]
    },
    {
      id: "fall-preview", name: "Fall Preview", url: "https://offers.acme.com/fall-preview",
      split: "100%", updated: "3w ago", by: "Maya", teamOfferId: "to-hb-wis", status: "unpublished",
      visits: 620, impressions: 412, clicks: 118, conversions: 21, score: 0.05,
      variants: [
        { name: "Cozy warm palette", split: "100%", updated: "3w ago", by: "Maya", visits: 620, impressions: 412, clicks: 118, conversions: 21, score: 0.05 }
      ]
    },
    {
      id: "referral-q2", name: "Referral Q2", url: "https://refer.acme.com/referral-q2",
      split: "70/30%", updated: "5h ago", by: "Maya", teamOfferId: "to-hb-wit", status: "published",
      visits: 32000, impressions: 25545, clicks: 12973, conversions: 7019, score: 0.27,
      variants: [
        { name: "Single-field entry", split: "70%", updated: "5h ago", by: "Maya", visits: 22400, impressions: 17881, clicks: 9082, conversions: 4913, score: 0.28 },
        { name: "Testimonial strip", split: "30%", updated: "5h ago", by: "Sam", visits: 9600, impressions: 7664, clicks: 3891, conversions: 2106, score: 0.25 }
      ]
    },
    {
      id: "founder-letter", name: "Founder Letter", url: "https://offers.acme.com/founder-letter",
      split: "100%", updated: "6h ago", by: "Sam", teamOfferId: "to-hb-roof", status: "published",
      visits: 28000, impressions: 22104, clicks: 9947, conversions: 3580, score: 0.16,
      variants: [{ name: "Long form", split: "100%", updated: "6h ago", by: "Sam", visits: 28000, impressions: 22104, clicks: 9947, conversions: 3580, score: 0.16 }]
    },
    {
      id: "partner-announce", name: "Partner Announce", url: "https://try.acme.com/partner-announce",
      split: "100%", updated: "1d ago", by: "Kyle", teamOfferId: "to-hb-roof", status: "published",
      visits: 4500, impressions: 3441, clicks: 1307, conversions: 497, score: 0.14,
      variants: [{ name: "Press style", split: "100%", updated: "1d ago", by: "Kyle", visits: 4500, impressions: 3441, clicks: 1307, conversions: 497, score: 0.14 }]
    },
    {
      id: "black-friday", name: "Black Friday", url: "https://offers.acme.com/black-friday-2026",
      split: "100%", updated: "5d ago", by: "Dana", teamOfferId: "to-bv-vin", status: "published",
      visits: 11000, impressions: 8720, clicks: 1570, conversions: 279, score: 0.03,
      variants: [{ name: "Orange bold", split: "100%", updated: "5d ago", by: "Dana", visits: 11000, impressions: 8720, clicks: 1570, conversions: 279, score: 0.03 }]
    },
    {
      id: "holiday-teaser", name: "Holiday Teaser", url: "https://offers.acme.com/holiday-teaser",
      split: "100%", updated: "2mo ago", by: "Sam", teamOfferId: "to-bv-vin", status: "unpublished",
      visits: 180, impressions: 96, clicks: 22, conversions: 3, score: 0.03,
      variants: [{ name: "Gift-led hero", split: "100%", updated: "2mo ago", by: "Sam", visits: 180, impressions: 96, clicks: 22, conversions: 3, score: 0.03 }]
    },
    {
      id: "spring-promo", name: "Spring Promo", url: "https://offers.acme.com/spring-promo",
      split: "100%", updated: "1d ago", by: "Kyle", teamOfferId: "to-sf-auto", status: "published",
      visits: 8200, impressions: 6100, clicks: 2100, conversions: 380, score: 0.12,
      variants: [{ name: "Main promo", split: "100%", updated: "1d ago", by: "Kyle", visits: 8200, impressions: 6100, clicks: 2100, conversions: 380, score: 0.12 }]
    },
    {
      id: "partner-pulse-draft", name: "Partner Pulse", url: "https://try.acme.com/partner-pulse",
      split: "100%", updated: "just now", by: "Kyle", teamOfferId: "to-sf-auto", status: "unpublished",
      visits: 0, impressions: 0, clicks: 0, conversions: 0, score: 0,
      variants: [{ name: "V1 — Draft hero", split: "100%", updated: "just now", by: "Kyle", visits: 0, impressions: 0, clicks: 0, conversions: 0, score: 0 }]
    }
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
