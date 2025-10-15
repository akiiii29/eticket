// Profile cache utility to reduce database queries
import { createClient } from '@/utils/supabase/server';

interface ProfileCache {
  [userId: string]: {
    role: string;
    timestamp: number;
  };
}

// In-memory cache (in production, consider Redis)
const profileCache: ProfileCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
