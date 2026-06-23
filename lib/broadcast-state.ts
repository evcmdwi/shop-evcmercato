/**
 * In-memory pause flags for broadcast campaigns.
 * Maps campaignId → isPaused (boolean).
 *
 * Note: This works within a single Node.js process.
 * For multi-instance deployments, use Redis or Supabase status polling.
 */
export const broadcastPauseFlags = new Map<string, boolean>()
