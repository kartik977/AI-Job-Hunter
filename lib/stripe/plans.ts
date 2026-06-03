export const STRIPE_PLANS = {
  pro: {
    name: "Pro",
    priceLabel: "$19/mo",
    priceId: process.env.STRIPE_PRICE_PRO,
    plan: "pro" as const,
    seatLimit: 1,
  },
  team: {
    name: "Team",
    priceLabel: "$49/mo",
    priceId: process.env.STRIPE_PRICE_TEAM,
    plan: "team" as const,
    seatLimit: 3,
  },
};
