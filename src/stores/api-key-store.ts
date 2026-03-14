import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApiKeys } from "@/types";

interface ApiKeyStore extends ApiKeys {
  setFinnhubKey: (key: string) => void;
  setAlpacaKeys: (keyId: string, secretKey: string) => void;
  setMassiveKey: (key: string) => void;
  clearAllKeys: () => void;
}

/** Derive status from key presence — never serialized */
function deriveStatus(state: Pick<ApiKeys, "finnhubKey" | "alpacaKeyId" | "alpacaSecretKey" | "massiveKey">): ApiKeys["status"] {
  return {
    finnhub: state.finnhubKey ? "set" : "not_set",
    alpaca: state.alpacaKeyId && state.alpacaSecretKey ? "set" : "not_set",
    massive: state.massiveKey ? "set" : "not_set",
  };
}

const INITIAL_KEYS = {
  finnhubKey: "",
  alpacaKeyId: "",
  alpacaSecretKey: "",
  massiveKey: "",
};

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set) => ({
      ...INITIAL_KEYS,
      status: deriveStatus(INITIAL_KEYS),

      setFinnhubKey: (key) =>
        set((state) => {
          const next = { ...state, finnhubKey: key };
          return { finnhubKey: key, status: deriveStatus(next) };
        }),

      setAlpacaKeys: (keyId, secretKey) =>
        set((state) => {
          const next = { ...state, alpacaKeyId: keyId, alpacaSecretKey: secretKey };
          return { alpacaKeyId: keyId, alpacaSecretKey: secretKey, status: deriveStatus(next) };
        }),

      setMassiveKey: (key) =>
        set((state) => {
          const next = { ...state, massiveKey: key };
          return { massiveKey: key, status: deriveStatus(next) };
        }),

      clearAllKeys: () =>
        set({ ...INITIAL_KEYS, status: deriveStatus(INITIAL_KEYS) }),
    }),
    {
      name: "wheelscan-api-keys",
      version: 1,
      partialize: (state) => ({
        finnhubKey: state.finnhubKey,
        alpacaKeyId: state.alpacaKeyId,
        alpacaSecretKey: state.alpacaSecretKey,
        massiveKey: state.massiveKey,
      }),
      merge: (persisted, current) => {
        const keys = persisted as Partial<typeof INITIAL_KEYS> | undefined;
        const merged = { ...current, ...keys };
        return { ...merged, status: deriveStatus(merged) };
      },
    },
  ),
);
