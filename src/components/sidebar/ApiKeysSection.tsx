import { useCallback } from 'react';
import { useApiKeyStore } from '@/stores/api-key-store';
import { ApiKeyInput } from './ApiKeyInput';

/**
 * API Keys sidebar section.
 *
 * Composes three ApiKeyInput groups for Finnhub, Alpaca (Key ID + Secret),
 * and Massive.com. Reads from and writes to apiKeyStore.
 *
 * Alpaca coordinated update: each field change passes the current store value
 * of the other field to `setAlpacaKeys(keyId, secretKey)`.
 */
export function ApiKeysSection() {
  const finnhubKey = useApiKeyStore((s) => s.finnhubKey);
  const alpacaKeyId = useApiKeyStore((s) => s.alpacaKeyId);
  const alpacaSecretKey = useApiKeyStore((s) => s.alpacaSecretKey);
  const massiveKey = useApiKeyStore((s) => s.massiveKey);
  const status = useApiKeyStore((s) => s.status);

  const setFinnhubKey = useApiKeyStore((s) => s.setFinnhubKey);
  const setAlpacaKeys = useApiKeyStore((s) => s.setAlpacaKeys);
  const setMassiveKey = useApiKeyStore((s) => s.setMassiveKey);

  const handleAlpacaKeyId = useCallback(
    (value: string) => {
      setAlpacaKeys(value, useApiKeyStore.getState().alpacaSecretKey);
    },
    [setAlpacaKeys],
  );

  const handleAlpacaSecret = useCallback(
    (value: string) => {
      setAlpacaKeys(useApiKeyStore.getState().alpacaKeyId, value);
    },
    [setAlpacaKeys],
  );

  return (
    <div className="flex flex-col gap-3">
      <ApiKeyInput
        label="Finnhub"
        value={finnhubKey}
        onChange={setFinnhubKey}
        status={status.finnhub}
        placeholder="Enter Finnhub API key…"
        helpText="Free tier: 60 calls/min"
      />

      <div className="flex flex-col gap-2">
        <ApiKeyInput
          label="Alpaca Key ID"
          value={alpacaKeyId}
          onChange={handleAlpacaKeyId}
          status={status.alpaca}
          placeholder="Enter Key ID…"
        />
        <ApiKeyInput
          label="Alpaca Secret Key"
          value={alpacaSecretKey}
          onChange={handleAlpacaSecret}
          status={status.alpaca}
          placeholder="Enter Secret Key…"
        />
      </div>

      <ApiKeyInput
        label="Massive.com"
        value={massiveKey}
        onChange={setMassiveKey}
        status={status.massive}
        placeholder="Enter Massive API key…"
      />
    </div>
  );
}
