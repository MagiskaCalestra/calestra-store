// Central konfig för C-Core i web-appen.
// Byt bas-URL när backend är live. Feature flags styr gradvis aktivering.
export const CCORE = {
  baseUrl: "https://api.calestra.local", // mock nu
  env: "dev",
  features: {
    booking: true,
    table: true,
    wish: true,
    queue: false,
    pricing: true,
  },
  privacy: {
    defaultPersonalization: false,
  },
  timeouts: {
    holdSeconds: 600, // 10 min standard-hold
  },
};
