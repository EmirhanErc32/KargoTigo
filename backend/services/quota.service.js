import { getSupabase, isSupabaseConfigured } from "../config/supabase.js";

/** AI fotograf analizi — 5 hak, her kullanim 3 saat bloklar, 3 saat sonra 1 hak geri gelir */
const MAX_QUOTA = 5;
const REFILL_INTERVAL_MS = 3 * 60 * 60 * 1000;
const memoryLog = new Map();

async function getAiAnalyzeTimestamps(userId) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("api_query_log")
      .select("created_at")
      .eq("user_id", userId)
      .eq("endpoint", "ai-analyze")
      .order("created_at", { ascending: false })
      .limit(20);
    return (data || []).map((r) => new Date(r.created_at).getTime());
  }
  return memoryLog.get(userId) || [];
}

async function logQuery(userId, endpoint) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    await supabase.from("api_query_log").insert({ user_id: userId, endpoint });
    return;
  }
  if (endpoint === "ai-analyze") {
    const arr = memoryLog.get(userId) || [];
    arr.unshift(Date.now());
    memoryLog.set(userId, arr);
  }
}

async function isPremium(userId) {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabase();
  const { data } = await supabase.from("users").select("is_premium").eq("id", userId).single();
  return Boolean(data?.is_premium);
}

function computeQuota(timestamps, premium) {
  if (premium) {
    return {
      limited: false,
      used: 0,
      limit: null,
      remaining: null,
      premium: true,
      intervalHours: 3,
      nextAvailableAt: null,
      msUntilNext: 0,
    };
  }

  const now = Date.now();
  const active = timestamps.filter((t) => now - t < REFILL_INTERVAL_MS);
  const used = active.length;
  const remaining = Math.max(0, MAX_QUOTA - used);

  let msUntilNext = 0;
  let nextAvailableAt = null;
  let oldestActiveAt = null;

  if (active.length > 0) {
    const oldestActive = Math.min(...active);
    oldestActiveAt = new Date(oldestActive).toISOString();
    const nextAt = oldestActive + REFILL_INTERVAL_MS;
    if (nextAt > now) {
      msUntilNext = nextAt - now;
      nextAvailableAt = new Date(nextAt).toISOString();
    }
  }

  return {
    limited: true,
    used,
    limit: MAX_QUOTA,
    remaining,
    premium: false,
    intervalHours: 3,
    oldestActiveAt,
    nextAvailableAt,
    msUntilNext,
  };
}

export async function getQuotaStatus(userId) {
  if (!userId) return computeQuota([], false);
  const premium = await isPremium(userId);
  const timestamps = premium ? [] : await getAiAnalyzeTimestamps(userId);
  return computeQuota(timestamps, premium);
}

export async function consumeQueryQuota(userId, endpoint = "ai-analyze") {
  if (!userId || endpoint !== "ai-analyze") {
    return { allowed: true, ...(await getQuotaStatus(userId)) };
  }

  const status = await getQuotaStatus(userId);
  if (status.premium) {
    await logQuery(userId, endpoint);
    return { allowed: true, ...status };
  }
  if (status.remaining <= 0) {
    return { allowed: false, ...status };
  }

  await logQuery(userId, endpoint);
  return { allowed: true, ...(await getQuotaStatus(userId)) };
}
