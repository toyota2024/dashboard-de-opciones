import { mockUniverse } from "./mockUniverse";

export const mockOptionProjection = mockUniverse.find((item) => item.quote.ticker === "MU") ?? mockUniverse[0];
