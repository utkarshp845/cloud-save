"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AWSCredentials, CostExplorerResponse, ForecastResponse, RecommendationsResponse } from "@/types/aws";

interface AWSStore {
  // Credentials
  credentials: AWSCredentials | null;
  roleArn: string | null;
  accountId: string | null;
  externalId: string | null;
  
  // Cost data
  costData: CostExplorerResponse | null;
  forecastData: ForecastResponse | null;
  recommendationsData: RecommendationsResponse | null;
  
  // State
  isConnected: boolean;
  isRefreshing: boolean;
  lastRefresh: number | null;
  
  // Actions
  setCredentials: (credentials: AWSCredentials) => void;
  setRoleInfo: (roleArn: string, accountId: string, externalId: string) => void;
  setCostData: (data: CostExplorerResponse) => void;
  setForecastData: (data: ForecastResponse) => void;
  setRecommendationsData: (data: RecommendationsResponse) => void;
  refreshCredentials: () => Promise<void>;
  clearCredentials: () => void;
  clearAll: () => void;
}

const CREDENTIAL_REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes (refresh before 30min expiration)

export const useAWSStore = create<AWSStore>()(
  persist(
    (set, get) => ({
      credentials: null,
      roleArn: null,
      accountId: null,
      externalId: null,
      costData: null,
      forecastData: null,
      recommendationsData: null,
      isConnected: false,
      isRefreshing: false,
      lastRefresh: null,

      setCredentials: (credentials) => {
        set({
          credentials,
          isConnected: true,
          lastRefresh: Date.now(),
        });
      },

      setRoleInfo: (roleArn, accountId, externalId) => {
        set({ roleArn, accountId, externalId });
      },

      setCostData: (data) => {
        set({ costData: data });
      },

      setForecastData: (data) => {
        set({ forecastData: data });
      },

      setRecommendationsData: (data) => {
        set({ recommendationsData: data });
      },

      refreshCredentials: async () => {
        const { roleArn, externalId, isRefreshing } = get();
        
        if (!roleArn || !externalId || isRefreshing) {
          return;
        }

        set({ isRefreshing: true });

        try {
          const response = await fetch("/api/aws/assume-role", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              roleArn,
              externalId,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to refresh credentials");
          }

          const { credentials } = await response.json();
          get().setCredentials(credentials);
        } catch (error) {
          console.error("Failed to refresh credentials:", error);
          // Don't clear credentials on refresh failure, let them expire naturally
        } finally {
          set({ isRefreshing: false });
        }
      },

      clearCredentials: () => {
        set({
          credentials: null,
          isConnected: false,
          lastRefresh: null,
        });
      },

      clearAll: () => {
        set({
          credentials: null,
          roleArn: null,
          accountId: null,
          externalId: null,
          costData: null,
          forecastData: null,
          recommendationsData: null,
          isConnected: false,
          isRefreshing: false,
          lastRefresh: null,
        });
      },
    }),
    {
      name: "aws-store",
      partialize: (state) => ({
        roleArn: state.roleArn,
        accountId: state.accountId,
        externalId: state.externalId,
        // Don't persist credentials - they expire
      }),
    }
  )
);

// Auto-refresh credentials before expiration
if (typeof window !== "undefined") {
  setInterval(() => {
    const store = useAWSStore.getState();
    const { credentials, lastRefresh, isRefreshing } = store;

    if (
      credentials &&
      lastRefresh &&
      !isRefreshing &&
      Date.now() - lastRefresh > CREDENTIAL_REFRESH_INTERVAL
    ) {
      store.refreshCredentials();
    }
  }, 60000); // Check every minute
}

