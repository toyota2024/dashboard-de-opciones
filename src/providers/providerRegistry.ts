import { backendDataProvider } from "./backendDataProvider";
import { mockDataProvider } from "./mockDataProvider";
import type { DataProvider } from "./types";

export type ProviderName = "mock" | "backend";

export const providerRegistry: Record<ProviderName, DataProvider> = {
  backend: backendDataProvider,
  mock: mockDataProvider,
};

export function getDataProvider(name: ProviderName): DataProvider {
  return providerRegistry[name];
}
