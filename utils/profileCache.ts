// Profile cache utility to reduce database queries
import { createClient } from '@/utils/supabase/server';

interface ProfileCacheEntry {
  role: string;
  timestamp: number;
}

interface ProfileCache {
  [userId: string]: ProfileCacheEntry;
}

// In-memory cache (in production, consider Redis)
const profileCache: ProfileCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cleanup expired entries periodically to prevent memory leaks
function cleanupExpiredCache() {
  const now = Date.now();
  Object.keys(profileCache).forEach(userId => {
    if (now - profileCache[userId].timestamp > CACHE_TTL) {
      delete profileCache[userId];
    }
  });
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCache, 60 * 1000);
}

export async function getCachedUserProfile(userId: string) {
  const now = Date.now();

  // Check cache first
  if (profileCache[userId] && (now - profileCache[userId].timestamp) < CACHE_TTL) {
    return profileCache[userId].role;
  }

  // Fetch from database
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return null;
  }

  // Update cache
  profileCache[userId] = {
    role: profile.role,
    timestamp: now,
  };

  return profile.role;
}

export function clearProfileCache(userId?: string) {
  if (userId) {
    delete profileCache[userId];
  } else {
    // Clear all cache
    Object.keys(profileCache).forEach(key => delete profileCache[key]);
  }
}

// Get cache statistics for monitoring
export function getProfileCacheStats() {
  return {
    size: Object.keys(profileCache).length,
    ttl: CACHE_TTL,
  };
}
