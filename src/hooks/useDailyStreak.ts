import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardService } from '@/services/dashboardService';
import { isToday, isYesterday, isWithinStreakWindow } from '@/utils/dailyStreak';

/**
 * Hook to manage daily streak
 * Automatically records activity and provides current streak count
 */
export const useDailyStreak = (autoRecordActivity: boolean = true) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch streak data
  const { data: streakData, isLoading } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await DashboardService.getStreak(user.id);
    },
    enabled: !!user?.id,
  });

  // Mutation to update streak
  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const currentTimestamp = new Date().toISOString();
      let newStreakCount = 1;

      if (streakData) {
        const lastDate = streakData.last_activity_date;

        if (isToday(lastDate)) {
          // Already active today - keep current streak
          newStreakCount = streakData.current_streak;
        } else if (isYesterday(lastDate) && isWithinStreakWindow(lastDate)) {
          // Consecutive day - increment streak
          newStreakCount = streakData.current_streak + 1;
        } else {
          // Reset streak
          newStreakCount = 1;
        }
      }

      return await DashboardService.updateStreak(user.id, newStreakCount, currentTimestamp);
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['user-streak', user?.id], newData);
    },
  });

  // Auto-record activity on mount
  useEffect(() => {
    if (autoRecordActivity && user?.id && !isLoading) {
      updateStreakMutation.mutate();
    }
  }, [user?.id, autoRecordActivity, isLoading]);

  /**
   * Manually record an activity
   */
  const recordActivity = () => {
    if (!user?.id) return;
    updateStreakMutation.mutate();
  };

  return {
    streak: streakData?.current_streak || 0,
    recordActivity,
    isLoading,
  };
};

import { useEffect } from 'react';

