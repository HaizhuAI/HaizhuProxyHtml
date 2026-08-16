export interface ApiProfile {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  timeoutSeconds: number;
  models: string[];
  updatedAt: string;
}

export interface LabMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'haizhu_model_lab_profiles_v1';
const API_ROOT = '/api/model-lab';

export function loadProfiles(): ApiProfile[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export function saveProfiles(profiles: ApiProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail || data));
  }
  return data as T;
}

export const discoverModels = (profile: Pick<ApiProfile, 'baseUrl' | 'apiKey' | 'timeoutSeconds'>) =>
  request<{ models: { id: string; owned_by: string }[]; count: number; latency_ms: number }>('/models', {
    base_url: profile.baseUrl, api_key: profile.apiKey, timeout_seconds: profile.timeoutSeconds,
  });

export const probeModel = (profile: ApiProfile, model: string) =>
  request<{ ok: boolean; content: string; latency_ms: number; usage?: Record<string, number> }>('/probe', {
    base_url: profile.baseUrl, api_key: profile.apiKey, timeout_seconds: profile.timeoutSeconds, model,
  });

export const sendChat = (profile: ApiProfile, model: string, messages: LabMessage[], temperature: number) =>
  request<{ content: string; latency_ms: number; usage?: Record<string, number>; model: string }>('/chat', {
    base_url: profile.baseUrl, api_key: profile.apiKey, timeout_seconds: profile.timeoutSeconds,
    model, messages, temperature,
  });
