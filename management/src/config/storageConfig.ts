const STORAGE_UPLOAD_ENDPOINT_KEY = "VITE_STORAGE_UPLOAD_ENDPOINT";
export const DEFAULT_STORAGE_UPLOAD_ENDPOINT = "http://localhost:8080/storage/upload";

type EnvSource = Partial<Record<string, string | undefined>>;

function readRuntimeEnv(): EnvSource {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env as EnvSource;
  }

  if (typeof process !== "undefined" && process?.env) {
    return process.env as EnvSource;
  }

  return {};
}

export interface StorageConfig {
  uploadEndpoint: string;
}

export function resolveStorageConfig(env: EnvSource = readRuntimeEnv()): StorageConfig {
  const uploadEndpoint = env[STORAGE_UPLOAD_ENDPOINT_KEY] ?? DEFAULT_STORAGE_UPLOAD_ENDPOINT;

  return {
    uploadEndpoint,
  };
}

export type { EnvSource as StorageEnvSource };
