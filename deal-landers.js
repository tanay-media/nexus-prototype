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
      variants: [{ name: "Cozy warm palette", split: "100%", updated: "3w ago", by: "Maya", visits: 620, impressions: 412, clicks: 118, conversions: 21, score: 0.05 }]
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
      id: "vin-search-hero", name: "VIN Search Hero", url: "https://offers.acme.com/vin-search-hero",
      split: "60/40%", updated: "3h ago", by: "Kyle", teamOfferId: "to-bv-vin", status: "published",
      visits: 42000, impressions: 35200, clicks: 9100, conversions: 1420, score: 0.18,
      variants: [
        { name: "Plate lookup hero", split: "60%", updated: "3h ago", by: "Kyle", visits: 25200, impressions: 21120, clicks: 5460, conversions: 852, score: 0.19 },
        { name: "Trust badges", split: "40%", updated: "4h ago", by: "Maya", visits: 16800, impressions: 14080, clicks: 3640, conversions: 568, score: 0.16 }
      ]
    },
    {
      id: "vehicle-report-q2", name: "Vehicle Report Q2", url: "https://offers.acme.com/vehicle-report-q2",
      split: "50/30/20%", updated: "1d ago", by: "Maya", teamOfferId: "to-bv-vin", status: "published",
      visits: 28500, impressions: 24100, clicks: 6200, conversions: 980, score: 0.14,
      variants: [
        { name: "Full history", split: "50%", updated: "1d ago", by: "Maya", visits: 14250, impressions: 12050, clicks: 3100, conversions: 490, score: 0.15 },
        { name: "Accident focus", split: "30%", updated: "1d ago", by: "Sam", visits: 8550, impressions: 7230, clicks: 1860, conversions: 294, score: 0.13 },
        { name: "Mileage check", split: "20%", updated: "2d ago", by: "Dana", visits: 5700, impressions: 4820, clicks: 1240, conversions: 196, score: 0.12 }
      ]
    },
    {
      id: "dealer-locator", name: "Dealer Locator", url: "https://offers.acme.com/dealer-locator",
      split: "100%", updated: "2d ago", by: "Sam", teamOfferId: "to-bv-vin", status: "published",
      visits: 9800, impressions: 8100, clicks: 2100, conversions: 310, score: 0.09,
      variants: [{ name: "Map-first", split: "100%", updated: "2d ago", by: "Sam", visits: 9800, impressions: 8100, clicks: 2100, conversions: 310, score: 0.09 }]
    },
    {
      id: "trade-in-value", name: "Trade-in Value", url: "https://offers.acme.com/trade-in-value",
      split: "70/30%", updated: "6h ago", by: "Dana", teamOfferId: "to-bv-vin", status: "published",
      visits: 15600, impressions: 13200, clicks: 3400, conversions: 520, score: 0.11,
      variants: [
        { name: "Instant estimate", split: "70%", updated: "6h ago", by: "Dana", visits: 10920, impressions: 9240, clicks: 2380, conversions: 364, score: 0.12 },
        { name: "Photo upload", split: "30%", updated: "7h ago", by: "Kyle", visits: 4680, impressions: 3960, clicks: 1020, conversions: 156, score: 0.10 }
      ]
    },
    {
      id: "recall-check", name: "Recall Check", url: "https://offers.acme.com/recall-check",
      split: "100%", updated: "4d ago", by: "Maya", teamOfferId: "to-bv-vin", status: "published",
      visits: 7200, impressions: 6100, clicks: 1400, conversions: 210, score: 0.08,
      variants: [{ name: "Safety alert hero", split: "100%", updated: "4d ago", by: "Maya", visits: 7200, impressions: 6100, clicks: 1400, conversions: 210, score: 0.08 }]
    },
    {
      id: "ownership-cost", name: "Ownership Cost", url: "https://offers.acme.com/ownership-cost",
      split: "100%", updated: "1w ago", by: "Kyle", teamOfferId: "to-bv-vin", status: "published",
      visits: 5400, impressions: 4600, clicks: 980, conversions: 145, score: 0.07,
      variants: [{ name: "TCO calculator", split: "100%", updated: "1w ago", by: "Kyle", visits: 5400, impressions: 4600, clicks: 980, conversions: 145, score: 0.07 }]
    },
    {
      id: "insurance-quote-vin", name: "Insurance Quote VIN", url: "https://offers.acme.com/insurance-quote-vin",
      split: "55/45%", updated: "3d ago", by: "Sam", teamOfferId: "to-bv-vin", status: "published",
      visits: 18900, impressions: 15800, clicks: 4100, conversions: 640, score: 0.13,
      variants: [
        { name: "Compare rates", split: "55%", updated: "3d ago", by: "Sam", visits: 10395, impressions: 8690, clicks: 2255, conversions: 352, score: 0.14 },
        { name: "Single carrier", split: "45%", updated: "3d ago", by: "Dana", visits: 8505, impressions: 7110, clicks: 1845, conversions: 288, score: 0.12 }
      ]
    },
    {
      id: "mileage-verifier", name: "Mileage Verifier", url: "https://offers.acme.com/mileage-verifier",
      split: "100%", updated: "5d ago", by: "Dana", teamOfferId: "to-bv-vin", status: "published",
      visits: 6300, impressions: 5200, clicks: 1100, conversions: 168, score: 0.06,
      variants: [{ name: "Odometer scan", split: "100%", updated: "5d ago", by: "Dana", visits: 6300, impressions: 5200, clicks: 1100, conversions: 168, score: 0.06 }]
    },
    {
      id: "auction-history", name: "Auction History", url: "https://offers.acme.com/auction-history",
      split: "100%", updated: "2w ago", by: "Maya", teamOfferId: "to-bv-vin", status: "published",
      visits: 4100, impressions: 3500, clicks: 720, conversions: 98, score: 0.05,
      variants: [{ name: "Bid timeline", split: "100%", updated: "2w ago", by: "Maya", visits: 4100, impressions: 3500, clicks: 720, conversions: 98, score: 0.05 }]
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

  function publishedForTeamOffer(teamOfferId) {
    return forTeamOffer(teamOfferId).filter(function (l) { return l.status === "published"; });
  }

  function forParentOffer(parentOfferId, teamOffers) {
    var ids = {};
    (teamOffers || []).forEach(function (to) {
      if (to.parentOfferId === parentOfferId) ids[to.id] = true;
    });
    return CATALOG.filter(function (l) { return ids[l.teamOfferId]; });
  }

  function publishedForParentOffer(parentOfferId, teamOffers) {
    return forParentOffer(parentOfferId, teamOffers).filter(function (l) { return l.status === "published"; });
  }

  global.NexusDealLanders = {
    catalog: CATALOG,
    forTeamOffer: forTeamOffer,
    publishedForTeamOffer: publishedForTeamOffer,
    forParentOffer: forParentOffer,
    publishedForParentOffer: publishedForParentOffer
  };
})(window);
