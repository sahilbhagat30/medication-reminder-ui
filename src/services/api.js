/**
 * src/services/api.js
 *
 * Universal data service layer.
 * - When VITE_API_URL is set (or BFF is reachable), fetches from live PostgreSQL via BFF.
 * - Falls back silently to static mockData.js if the BFF is unreachable or disabled.
 */
import {
  prescriptions  as mockPrescriptions,
  eligibilityData as mockEligibility,
  campaigns       as mockCampaigns,
  communicationStatus as mockCommunications,
  summaryMetrics  as mockSummary,
  channelBreakdown as mockChannelBreakdown,
  dailyChartData  as mockDailyChartData,
} from '../data/mockData.js';

// ── Base URL ──────────────────────────────────────────────────────────────────
// In production (Cloud Run), the React app is served by the same Express server
// that hosts /api/* routes, so we use relative paths (no base needed).
// In local dev, set VITE_API_URL=http://localhost:5001 in .env.local to hit the BFF.
// If VITE_API_URL is not set in dev, the app falls back to mock data.
const BASE = import.meta.env.VITE_API_URL ?? null;
const IS_PROD = import.meta.env.PROD; // true when built by vite (npm run build)

// ── Helper: fetch JSON with fallback ─────────────────────────────────────────
async function apiFetch(path, fallback) {
  // In production, always try the live API (same-origin /api/...)
  // In dev, only try if VITE_API_URL is explicitly set
  const shouldFetch = IS_PROD || BASE;
  if (!shouldFetch) {
    console.info(`[API] Dev mode — no VITE_API_URL set, using mock data for ${path}`);
    return fallback;
  }

  const prefix = BASE || ''; // In production: '' (same-origin), in dev: e.g. 'http://localhost:5001'
  try {
    const res = await fetch(`${prefix}/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] BFF error (${path}), falling back to mock data. Reason: ${err.message}`);
    return fallback;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchPrescriptions({ status, search } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'All') params.set('status', status);
  if (search) params.set('search', search);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/prescriptions${qs}`, mockPrescriptions);
}

export async function fetchEligibility({ status, search } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (search) params.set('search', search);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/eligibility${qs}`, mockEligibility);
}

export async function fetchCampaigns({ status, search } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (search) params.set('search', search);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/campaigns${qs}`, mockCampaigns);
}

export async function fetchCommunications({ status, search } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (search) params.set('search', search);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`/communications${qs}`, mockCommunications);
}

export async function fetchSummary() {
  const live = await apiFetch('/summary', null);
  if (!live) {
    // Return full mock summary structure including chart data
    return {
      metrics:       mockSummary,
      channelBreakdown: mockChannelBreakdown,
      dailyChartData:   mockDailyChartData,
    };
  }
  return {
    metrics:          live,
    channelBreakdown: mockChannelBreakdown,  // chart shape data from mock
    dailyChartData:   mockDailyChartData,
  };
}
