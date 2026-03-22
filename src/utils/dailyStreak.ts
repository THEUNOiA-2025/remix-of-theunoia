/**
 * Daily Streak Utility
 * Tracks user activity and calculates daily streak (Snapchat-style)
 * Uses localStorage for frontend-only tracking
 */

interface StreakData {
  currentStreak: number;
  lastActivityDate: string; // ISO date string in user's local timezone
  longestStreak: number;
}

const STREAK_STORAGE_KEY = 'daily_streak_data';
const STREAK_RESET_HOURS = 24; // Reset after 24 hours of inactivity

/**
 * Get streak data from localStorage
 */
export const getStreakData = (userId: string): StreakData | null => {
  try {
    const stored = localStorage.getItem(`${STREAK_STORAGE_KEY}_${userId}`);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading streak data:', error);
    return null;
  }
};

/**
 * Save streak data to localStorage
 */
export const saveStreakData = (userId: string, data: StreakData): void => {
  try {
    localStorage.setItem(`${STREAK_STORAGE_KEY}_${userId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving streak data:', error);
  }
};

/**
 * Get current date in user's local timezone (YYYY-MM-DD format)
 */
export const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current timestamp in milliseconds
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};

/**
 * Check if last activity was within the reset window (24 hours)
 */
export const isWithinStreakWindow = (lastActivityDate: string): boolean => {
  const lastDate = new Date(lastActivityDate);
  const now = new Date();
  const hoursSinceLastActivity = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastActivity < STREAK_RESET_HOURS;
};

/**
 * Check if last activity was yesterday (consecutive day)
 */
export const isYesterday = (lastActivityDate: string): boolean => {
  const lastDate = new Date(lastActivityDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    lastDate.getDate() === yesterday.getDate() &&
    lastDate.getMonth() === yesterday.getMonth() &&
    lastDate.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Check if last activity was today
 */
export const isToday = (lastActivityDate: string): boolean => {
  const lastDate = new Date(lastActivityDate);
  const today = new Date();
  
  return (
    lastDate.getDate() === today.getDate() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Record user activity and update streak
 * Call this whenever user performs an activity
 */
export const recordActivity = (userId: string): StreakData => {
  const currentDate = getLocalDateString();
  const currentTimestamp = new Date().toISOString();
  const existingData = getStreakData(userId);

  let newStreak: StreakData;

  if (!existingData) {
    // First time - start streak at 1
    newStreak = {
      currentStreak: 1,
      lastActivityDate: currentTimestamp,
      longestStreak: 1,
    };
  } else {
    const lastDate = existingData.lastActivityDate;
    
    if (isToday(lastDate)) {
      // Already active today - no change to streak
      newStreak = {
        ...existingData,
        lastActivityDate: currentTimestamp, // Update timestamp but keep streak
      };
    } else if (isYesterday(lastDate) && isWithinStreakWindow(lastDate)) {
      // Consecutive day - increment streak
      const newCurrentStreak = existingData.currentStreak + 1;
      newStreak = {
        currentStreak: newCurrentStreak,
        lastActivityDate: currentTimestamp,
        longestStreak: Math.max(existingData.longestStreak, newCurrentStreak),
      };
    } else {
      // More than 24 hours passed or not consecutive - reset to 1
      newStreak = {
        currentStreak: 1,
        lastActivityDate: currentTimestamp,
        longestStreak: existingData.longestStreak, // Keep longest streak record
      };
    }
  }

  saveStreakData(userId, newStreak);
  return newStreak;
};

/**
 * Get current streak without recording activity
 * Useful for displaying streak without triggering an update
 */
export const getCurrentStreak = (userId: string): number => {
  const data = getStreakData(userId);
  if (!data) return 0;

  // Check if streak is still valid (within 24 hours)
  if (isWithinStreakWindow(data.lastActivityDate)) {
    // If last activity was today or yesterday, streak is valid
    if (isToday(data.lastActivityDate) || isYesterday(data.lastActivityDate)) {
      return data.currentStreak;
    }
  }

  // Streak expired - return 0
  return 0;
};

/**
 * Clear streak data (useful for testing or logout)
 */
export const clearStreakData = (userId: string): void => {
  try {
    localStorage.removeItem(`${STREAK_STORAGE_KEY}_${userId}`);
  } catch (error) {
    console.error('Error clearing streak data:', error);
  }
};

