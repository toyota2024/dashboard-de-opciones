import { buildMockExpirations, createMockOptionChain } from "./createMockOptionChain";

const expirations = buildMockExpirations([16, 23, 30]);

// MU mock chain with a strong call wall near 1200, put wall near 1000, and max-pain pressure near 850.
export const mockOptionChain = createMockOptionChain({
  ticker: "MU",
  spot: 1190.02,
  expirations,
  strikeMin: 800,
  strikeMax: 1450,
  strikeStep: 50,
  callWallStrike: 1200,
  putWallStrike: 1000,
  maxPainBiasStrike: 850,
  baseIv: 0.29,
  callSkew: 1.05,
  putSkew: 1,
  volumeMultiplier: 1,
});
