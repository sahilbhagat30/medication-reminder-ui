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
// Set VITE_API_URL=http://localhost:5001 in .env.local to enable live data.
const BASE = import.meta.env.VITE_API_URL || '';

// ── Helper: fetch JSON with fallback ─────────────────────────────────────────
async function apiFetch(path, fallback) {
  if (!BASE) return fallback;           // No BFF configured — use mock immediately
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),  // 5s timeout
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] BFF unavailable (${path}), using mock data. Reason: ${err.message}`);
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
