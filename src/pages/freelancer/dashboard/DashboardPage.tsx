import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Target, Calendar, CheckSquare2, Eye,
  Rocket,
  Flame, Quote, ArrowRight, Plus,
  Wallet, Package, FileCheck, Gavel, Rss,
  GraduationCap, Briefcase, Star, Users, Clock, TrendingUp,
  DollarSign, TrendingDown, BarChart3, PieChart,
  CheckCircle2, RotateCw, Hourglass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { recordActivity } from '@/utils/dailyStreak';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, getDay } from 'date-fns';
import { X, GripVertical, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardService } from '@/services/dashboardService';
import { ProjectService } from '@/services/projectService';
import { getRandomProjectVideo } from "@/utils/randomVideo";

const DASHBOARD_VIDEO_1 = getRandomProjectVideo();
const DASHBOARD_VIDEO_2 = getRandomProjectVideo();
const DASHBOARD_VIDEO_3 = getRandomProjectVideo();
const DASHBOARD_VIDEO_4 = getRandomProjectVideo();
import { UserWeeklyPlan, UserTodo, WeeklyTask, TodoPriority, WeeklyFocus } from '@/types/dashboard';

interface Project {
  id: string;
  title: string;
  status: string;
  budget: number | null;
  created_at: string;
  bidding_deadline: string | null;
  user_profiles?: {
    first_name: string;
    last_name: string;
  };
}

type Priority = TodoPriority;

// Helper functions
const getCurrentWeek = () => {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const sunday = endOfWeek(today, { weekStartsOn: 1 });
  return { monday, sunday, days: Array.from({ length: 7 }, (_, i) => addDays(monday, i)) };
};

const formatWeekDateRange = (): string => {
  const week = getCurrentWeek();
  const mondayDate = format(week.monday, 'MMMM d');
  const sundayDate = format(week.sunday, 'MMMM d');
  const year = format(week.sunday, 'yyyy');

  return `${mondayDate} to ${sundayDate}, ${year}`;
};

const formatDateWithOrdinal = (date: Date): string => {
  const day = date.getDate();
  const month = format(date, 'MMMM');
  const year = date.getFullYear();

  const getOrdinalSuffix = (n: number): string => {
    if (n >= 11 && n <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary';
    case 'medium': return 'bg-secondary/50 text-secondary-foreground dark:bg-secondary/30 dark:text-secondary-foreground';
    case 'low': return 'bg-accent/50 text-accent-foreground dark:bg-accent/30 dark:text-accent-foreground';
    default: return 'bg-accent/50 text-accent-foreground dark:bg-accent/30 dark:text-accent-foreground';
  }
};

const getPriorityLabel = (priority: string) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { streak } = useDailyStreak(true); // Auto-record activity on dashboard visit
  const [profile, setProfile] = useState<{ first_name: string; last_name: string; user_type?: string } | null>(null);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [currentTechCardIndex, setCurrentTechCardIndex] = useState(0);

  // Our Top Picks For Your Skills – 3 mock items, swap every 3s, loop
  const topPicksSkills = [
    {
      id: '1',
      image: '/images/class1.png',
      title: 'The Ultimate Python Bootcamp: Learn by Building 50 Projects',
      description: 'Only Python course that you need',
      author: 'By Hitesh Choudhary',
      updated: 'Updated November 2025',
      hours: '30.5 total hours',
      lectures: '153 lectures',
      level: 'All Levels',
      rating: 4.7,
      ratingCount: '1,874',
    },
    {
      id: '2',
      image: '/images/class3.png',
      title: 'React & Node.js: Full-Stack Web Development Mastery',
      description: 'Build real-world apps from scratch',
      author: 'By Hitesh Choudhary',
      updated: 'Updated January 2026',
      hours: '42 total hours',
      lectures: '220 lectures',
      level: 'Intermediate',
      rating: 4.8,
      ratingCount: '2,341',
    },
    {
      id: '3',
      image: '/images/dashboard-hero.png',
      title: 'Data Science & Machine Learning with Python',
      description: 'From zero to deployment in one course',
      author: 'By Hitesh Choudhary',
      updated: 'Updated December 2025',
      hours: '28 total hours',
      lectures: '180 lectures',
      level: 'All Levels',
      rating: 4.6,
      ratingCount: '956',
    },
  ];
  const [topPicksSkillIndex, setTopPicksSkillIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setTopPicksSkillIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const [stats, setStats] = useState({
    successful: 0,
    ongoing: 0,
    pending: 0,
  });

  // Earnings & Profit – count-up animation when section scrolls into view
  const [calculatedEarnings, setCalculatedEarnings] = useState({ total: 0, avg: 0 });
  const [displayTotal, setDisplayTotal] = useState(0);
  const [displayAvg, setDisplayAvg] = useState(0);
  const earningsSectionRef = useRef<HTMLDivElement>(null);
  const earningsAnimatedRef = useRef(false);

  useEffect(() => {
    const el = earningsSectionRef.current;
    if (!el || (calculatedEarnings.total === 0 && calculatedEarnings.avg === 0)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || earningsAnimatedRef.current) return;
        earningsAnimatedRef.current = true;
        const duration = 1500;
        const start = performance.now();
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const tick = (now: number) => {
          const elapsed = now - start;
          const p = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(p);
          setDisplayTotal(Math.round(calculatedEarnings.total * eased));
          setDisplayAvg(Math.round(calculatedEarnings.avg * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.2, rootMargin: '0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [calculatedEarnings]);

  const formatEarnings = (n: number) => n.toLocaleString('en-IN');

  // Weekly Roadmap Widget state (separate from planner dialog)
  const [roadmapSelectedDay, setRoadmapSelectedDay] = useState<Date>(new Date());

  // Tech news items data
  const techNewsItems = [
    { source: "TechCrunch", time: "2h ago", icon: "T", iconBg: "bg-black", headline: "Apple releases new M4 chips with focus on AI capabilities." },
    { source: "The Verge", time: "5h ago", icon: "V", iconBg: "bg-blue-600", headline: "Google's Project Astra: The future of multimodal AI assistants." },
    { source: "Wired", time: "1d ago", icon: "W", iconBg: "bg-red-600", headline: "How Decentralized Computing is Changing the Freelance Economy." },
    { source: "Hacker News", time: "3h ago", icon: "H", iconBg: "bg-emerald-600", headline: "The Best Open Source Tools for Freelance Project Management in 2024." },
    { source: "Ars Technica", time: "4h ago", icon: "A", iconBg: "bg-purple-600", headline: "Microsoft announces breakthrough in quantum computing with new Azure Quantum platform." },
    { source: "Engadget", time: "6h ago", icon: "E", iconBg: "bg-orange-600", headline: "OpenAI releases GPT-5 with enhanced reasoning capabilities and multimodal understanding." },
    { source: "MIT Tech Review", time: "8h ago", icon: "M", iconBg: "bg-indigo-600", headline: "Breakthrough in neural interfaces enables direct brain-to-computer communication." },
    { source: "CNET", time: "12h ago", icon: "C", iconBg: "bg-pink-600", headline: "Tesla unveils next-generation autonomous driving system with improved safety features." },
  ];

  // Fetch Latest in Tech news
  const { data: latestTechCards = [], isLoading: isLoadingNews } = useQuery({
    queryKey: ['tech-news'],
    queryFn: async () => {
      try {
        const response = await fetch('https://newsapi.org/v2/top-headlines?category=technology&language=en&apiKey=ce5d12daf5534deea0bb7ee8d88b8916');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();

        // Map the articles to the format expected by the cards
        if (data.articles && data.articles.length > 0) {
          type NewsArticle = {
            title?: string;
            author?: string;
            source?: { name?: string };
            description?: string;
            urlToImage?: string;
            url?: string;
          };
          return data.articles.filter((article: NewsArticle) => article.title && article.title !== '[Removed]').map((article: NewsArticle, index: number) => ({
            id: index + 1,
            author: article.author || article.source?.name || "Tech News",
            category: "Technology",
            title: article.title,
            description: article.description || "Read more about this article by clicking the link.",
            backgroundImage: article.urlToImage || "/images/dashboard-hero.png",
            url: article.url
          })).slice(0, 10); // Limit to top 10 articles
        }
        return [];
      } catch (error) {
        console.error("Error fetching tech news:", error);
        // Fallback to static data if API fails
        return [
          {
            id: 1,
            author: "James Clear",
            category: "Technology",
            title: "30 One-Sentence Stories From People Who Have Built Better Habits",
            description: "But no matter what, keep taking action in small ways each day. It is so gratifying for me to see people making real changes in their life b...",
            backgroundImage: "/images/auth-slide-1.png",
            url: "#"
          },
          {
            id: 2,
            author: "Tyler Cowen",
            category: "Technology",
            title: "Who gains new AI?",
            description: "One striking systems is th to use them. Stable Diffus",
            backgroundImage: "/images/auth-slide-2.png",
            url: "#"
          },
          {
            id: 3,
            author: "Sarah Johnson",
            category: "Technology",
            title: "The Future of Remote Work",
            description: "Exploring how technology is reshaping the way we work and collaborate in distributed teams.",
            backgroundImage: "/images/auth-slide-3.png",
            url: "#"
          },
          {
            id: 4,
            author: "Michael Chen",
            category: "Technology",
            title: "AI Revolution in 2024",
            description: "Understanding the latest breakthroughs in artificial intelligence and their impact on everyday life.",
            backgroundImage: "/images/dashboard-hero.png",
            url: "#"
          }
        ];
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Combined suggested items (classes and projects mixed)
  const suggestedItems = [
    {
      id: 1,
      type: "class",
      title: "Advanced React Development",
      instructor: "Sarah Johnson",
      duration: "8 weeks",
      students: 1240,
      rating: 4.8,
      icon: "⚛️",
      color: "bg-blue-50",
      iconColor: "text-blue-600",
      badge: "Best Ratings",
      animation: "slide-in-left"
    },
    {
      id: 2,
      type: "project",
      title: "E-commerce Website Redesign",
      client: "TechCorp Inc.",
      budget: "₹25,000",
      deadline: "15 days",
      skills: ["React", "UI/UX"],
      icon: "🛒",
      color: "bg-orange-50",
      iconColor: "text-orange-600",
      badge: "Recommended Batch",
      animation: "slide-in-right"
    },
    {
      id: 3,
      type: "class",
      title: "UI/UX Design Masterclass",
      instructor: "Michael Chen",
      duration: "6 weeks",
      students: 890,
      rating: 4.9,
      icon: "🎨",
      color: "bg-purple-50",
      iconColor: "text-purple-600",
      badge: "Top Recommended",
      animation: "bounce-in"
    },
    {
      id: 4,
      type: "project",
      title: "Mobile App Development",
      client: "StartupXYZ",
      budget: "₹45,000",
      deadline: "30 days",
      skills: ["React Native", "Node.js"],
      icon: "📱",
      color: "bg-indigo-50",
      iconColor: "text-indigo-600",
      badge: "Recommended Batch",
      animation: "slide-in-left"
    },
    {
      id: 5,
      type: "class",
      title: "Full Stack Web Development",
      instructor: "David Williams",
      duration: "12 weeks",
      students: 2100,
      rating: 4.7,
      icon: "💻",
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
      badge: "Best Ratings",
      animation: "slide-in-right"
    },
    {
      id: 6,
      type: "project",
      title: "Brand Identity Design",
      client: "Creative Studio",
      budget: "₹15,000",
      deadline: "10 days",
      skills: ["Figma", "Illustration"],
      icon: "✨",
      color: "bg-pink-50",
      iconColor: "text-pink-600",
      badge: "Recommended Batch",
      animation: "bounce-in"
    },
  ];

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, user_type')
          .eq('user_id', user.id)
          .single();

        if (error) console.warn('Profile fetch error (e.g. after DB migration):', error);
        setProfile(data ?? null);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch stats and active projects
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Get completed projects with budgets for earnings calculation
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const role = profile?.user_type === 'client' ? 'client' : 'freelancer';
        const completedProjectsData = await ProjectService.getCompletedProjects(user.id, role);

        let totalEarningsThisMonth = 0;
        let completedThisMonthCount = 0;

        if (completedProjectsData) {
          completedProjectsData.forEach((project) => {
            // Fallback to updated_at if completed_at doesn't exist.
            const completionDateStr = project.completed_at || project.updated_at;
            if (completionDateStr) {
              if (completionDateStr >= startOfCurrentMonth && completionDateStr <= endOfCurrentMonth) {
                totalEarningsThisMonth += Number(project.budget) || 0;
                completedThisMonthCount++;
              }
            }
          });
        }

        setCalculatedEarnings({
          total: totalEarningsThisMonth,
          avg: completedThisMonthCount > 0 ? Math.round(totalEarningsThisMonth / completedThisMonthCount) : 0
        });

        const successfulCount = completedProjectsData?.length || 0;

        // Get ongoing projects
        const ongoingProjectsData = await ProjectService.getWorkingProjects(user.id, role);
        const ongoingCount = ongoingProjectsData?.length || 0;

        // Get pending projects (open with bids)
        const { count: pendingCount } = await supabase
          .from('user_projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'open');

        setStats({
          successful: successfulCount,
          ongoing: ongoingCount || 0,
          pending: pendingCount || 0,
        });

        // Fetch active projects (in_progress)
        setActiveProjects((ongoingProjectsData as any[])?.slice(0, 3) || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [user, profile?.user_type]);

  const firstName = profile?.first_name ?? (user?.user_metadata?.firstName as string | undefined) ?? user?.email?.split('@')[0] ?? 'User';
  const userName = `${firstName}`.trim() || 'User';

  // React Query Client
  const queryClient = useQueryClient();

  // --- Todo List Implementation ---
  const { data: todos = [], isLoading: isLoadingTodos } = useQuery({
    queryKey: ['todos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await DashboardService.getTodos(user.id);
    },
    enabled: !!user?.id,
  });

  const addTodoMutation = useMutation({
    mutationFn: async ({ text, priority }: { text: string; priority: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await DashboardService.addTodo(user.id, text, priority);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', user?.id] });
      toast.success('Task added successfully');
      setAddTaskDialogOpen(false);
      setNewTaskText('');
      setNewTaskPriority('medium');
      // Record activity
      if (user?.id) recordActivity(user.id);
    },
    onError: (error) => {
      toast.error('Failed to add task');
      console.error(error);
    }
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return await DashboardService.toggleTodo(id, completed);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todos', user?.id] });
      if (!variables.completed && user?.id) recordActivity(user.id);
    },
    onError: (error) => {
      toast.error('Failed to update task');
      console.error(error);
    }
  });

  // Calculate today's goal progress (using real todos)
  // Replaced by Weekly Roadmap integration below

  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');

  const handleAddTask = () => {
    if (!newTaskText.trim()) {
      toast.error('Please enter a task');
      return;
    }
    addTodoMutation.mutate({ text: newTaskText.trim(), priority: newTaskPriority });
  };

  const toggleTodo = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      toggleTodoMutation.mutate({ id, completed: !todo.completed });
    }
  };

  // --- Weekly Planner Implementation ---
  const [weeklyPlannerOpen, setWeeklyPlannerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Weekly Planner Mutation
  const upsertWeeklyPlanMutation = useMutation({
    mutationFn: async ({ date, tasks, focus }: { date: Date; tasks: WeeklyTask[]; focus: 'work' | 'learning' | 'personal' | null }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const dateStr = format(date, 'yyyy-MM-dd');
      return await DashboardService.upsertWeeklyPlan(user.id, dateStr, tasks, focus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-plans', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to update weekly plan');
      console.error(error);
    }
  });

  // Helper to get formatted date string
  const getDayKey = (date: Date) => format(date, 'yyyy-MM-dd');

  // Defines DayData locally or uses the one from types if needed, but since we had it local:
  interface DayData {
    date: Date;
    tasks: WeeklyTask[];
    focus: 'work' | 'learning' | 'personal' | null;
  }

  // Helper to get day data from cached query data
  const getDayData = (date: Date): DayData => {
    const dateStr = getDayKey(date);
    const plans = queryClient.getQueryData<UserWeeklyPlan[]>(['weekly-plans', user?.id]) || [];
    const plan = plans.find(p => p.date === dateStr);

    return {
      date,
      tasks: plan?.tasks || [],
      focus: (plan?.focus as 'work' | 'learning' | 'personal' | null) || null
    };
  };

  // Use Query for Weekly Plans
  const { data: weeklyPlans = [] } = useQuery({
    queryKey: ['weekly-plans', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const week = getCurrentWeek();
      const start = format(week.monday, 'yyyy-MM-dd');
      const end = format(week.sunday, 'yyyy-MM-dd');
      return await DashboardService.getWeeklyPlans(user.id, start, end);
    },
    enabled: !!user?.id,
  });

  // Calculate today's goal progress (using Weekly Roadmap)
  const todayDate = new Date();
  const todayKey = format(todayDate, 'yyyy-MM-dd');
  const todaysWeeklyPlan = weeklyPlans.find(p => p.date === todayKey);
  const todaysWeeklyTasks = todaysWeeklyPlan?.tasks || [];

  const todayGoalProgress = todaysWeeklyTasks.length > 0
    ? Math.round((todaysWeeklyTasks.filter(t => t.completed).length / todaysWeeklyTasks.length) * 100)
    : 0;
  const todayTasksCompleted = todaysWeeklyTasks.filter(t => t.completed).length;
  const todayTasksTotal = todaysWeeklyTasks.length;

  const [newWeeklyTaskText, setNewWeeklyTaskText] = useState('');
  const [newWeeklyTaskPriority, setNewWeeklyTaskPriority] = useState<Priority>('medium');
  const [selectedFocus, setSelectedFocus] = useState<'work' | 'learning' | 'personal' | null>('work');

  // Weekly Roadmap Widget state
  // roadmapSelectedDay is defined at the top of the component

  const updateDayData = (date: Date, updates: Partial<DayData>) => {
    const currentData = getDayData(date);
    const newData = { ...currentData, ...updates };

    upsertWeeklyPlanMutation.mutate({
      date: date,
      tasks: newData.tasks,
      focus: newData.focus
    });
  };

  const addWeeklyTask = () => {
    if (!newWeeklyTaskText.trim()) {
      toast.error('Please enter a task');
      return;
    }
    const currentData = getDayData(selectedDay);
    const newTask: WeeklyTask = {
      id: Date.now().toString(),
      text: newWeeklyTaskText.trim(),
      completed: false,
      priority: newWeeklyTaskPriority,
    };

    updateDayData(selectedDay, {
      tasks: [...currentData.tasks, newTask]
    });

    setNewWeeklyTaskText('');
    setNewWeeklyTaskPriority('medium');
    if (user?.id) recordActivity(user.id);
  };

  const toggleWeeklyTask = (date: Date, taskId: string) => {
    const currentData = getDayData(date);
    const updatedTasks = currentData.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    updateDayData(date, { tasks: updatedTasks });

    if (user?.id) {
      const task = currentData.tasks.find(t => t.id === taskId);
      if (task && !task.completed) recordActivity(user.id);
    }
  };

  const deleteWeeklyTask = (date: Date, taskId: string) => {
    const currentData = getDayData(date);
    updateDayData(date, {
      tasks: currentData.tasks.filter(task => task.id !== taskId),
    });
  };

  const clearDay = (date: Date) => {
    updateDayData(date, { tasks: [], focus: null });
  };

  // Auto-swipe Latest in Tech cards every 5 seconds
  useEffect(() => {
    if (!latestTechCards.length) return;

    const totalPairs = Math.ceil(latestTechCards.length / 2);
    const interval = setInterval(() => {
      setCurrentTechCardIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % totalPairs;
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [latestTechCards.length]);

  // Set roadmap to show today's day by default
  useEffect(() => {
    const today = new Date();
    const week = getCurrentWeek();
    const todayInWeek = week.days.find(day => isSameDay(day, today));
    if (todayInWeek) {
      setRoadmapSelectedDay(today);
    } else {
      setRoadmapSelectedDay(week.days[0]);
    }
  }, []);

  // Fetch open projects for bidding
  const { data: openProjects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['open-projects'],
    queryFn: async () => {
      return await ProjectService.getOpenProjects();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="flex-1 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 p-5 overflow-y-auto">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 mb-5">
          <div>
            <h2 className="text-5xl font-black text-foreground tracking-tight animate-bounce-welcome">
              Welcome back, {userName}
            </h2>
            <p className="text-muted-foreground mt-1 font-medium text-xs">
              Here's what's new for you today
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-green text-green-foreground px-4 py-2 rounded-xl font-bold text-xs shadow-sm">
              <Flame className="w-3 h-3 text-orange-600 fill-orange-600" />
              Daily Streak: {streak} {streak === 1 ? 'Day' : 'Days'}
            </div>
          </div>
        </div>

        {/* Daily Motivation & Today's Goal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-5">
          {/* Daily Motivation Card */}
          <Card className="lg:col-span-2 group relative overflow-hidden rounded-xl border border-black/20 shadow-sm p-5 flex flex-col md:flex-row gap-5 items-center bg-[#FDF8F3]">
            <div className="w-full md:w-1/3 aspect-video md:aspect-square bg-cover bg-center rounded-xl shadow-inner bg-gradient-to-br from-orange-200 via-blue-200 to-gray-300">
              {/* Placeholder for motivation image */}
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Daily Motivation
                </span>
                <div className="flex items-center gap-1 bg-yellow px-1.5 py-0.5 rounded text-[9px] font-black">
                  <Quote className="w-2.5 h-2.5" />
                  <span className="font-black">QUOTE OF THE DAY</span>
                </div>
                <span className="text-[9px] font-bold text-accent-foreground bg-accent px-1.5 py-0.5 rounded">
                  {formatDateWithOrdinal(new Date())}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2.5 leading-tight italic text-foreground">
                "Success is not final, failure is not fatal: it is the courage to continue that counts."
              </h3>
              <p className="text-muted-foreground text-xs font-medium">— Winston Churchill</p>
            </div>
          </Card>

          {/* Today's Goal Card */}
          <Card className="bg-[#FDF8F3] rounded-xl border border-black/20 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">Today's Goal</h4>
                  <Badge className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-md">
                    CURRENT PROJECT
                  </Badge>
                </div>
                <Target className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-end">
                  <p className="text-xl font-black">{todayGoalProgress}%</p>
                  <p className="text-[11px] text-muted-foreground mb-1">{todayTasksCompleted} of {todayTasksTotal} tasks</p>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${todayGoalProgress}%` }}></div>
                </div>
              </div>

              {/* Project Progress Section */}
              <div className="pt-4 border-t border-border/50">
                <h5 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">Project Progress</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 p-2 rounded-full bg-green-50">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">Successful Projects</p>
                    <p className="text-base font-black">{stats.successful}</p>
                  </div>
                  <div className="flex flex-col items-center text-center border-x border-border/50">
                    <div className="mb-2 p-2 rounded-full bg-primary/10">
                      <RotateCw className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">In Progress</p>
                    <p className="text-base font-black">{stats.ongoing}</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 p-2 rounded-full bg-orange-50">
                      <Hourglass className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">Pending Projects</p>
                    <p className="text-base font-black">{stats.pending}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
          <Card
            className="bg-primary/55 p-3.5 rounded-xl border border-primary/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center gap-2.5"
            onClick={() => navigate('/projects')}
          >
            <div className="size-9 rounded-full bg-primary/30 text-black flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-black">Browse Projects</span>
          </Card>
          <Card
            className="bg-secondary/55 p-3 rounded-xl border border-secondary-foreground/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center gap-2"
            onClick={() => navigate('/bids')}
          >
            <div className="size-9 rounded-full bg-secondary-foreground/15 text-black flex items-center justify-center">
              <Gavel className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-black">My Bids</span>
          </Card>
          <Card
            className="bg-accent/55 p-3 rounded-xl border border-accent-foreground/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center gap-2"
            onClick={() => navigate('/projects')}
          >
            <div className="size-9 rounded-full bg-accent-foreground/15 text-black flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-black">Deliverables</span>
          </Card>
          <Card
            className="bg-primary/55 p-3 rounded-xl border border-primary/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center gap-2"
            onClick={() => navigate('/freelancer/contracts')}
          >
            <div className="size-9 rounded-full bg-primary/30 text-black flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-black">Contracts</span>
          </Card>
          <Card
            className="bg-secondary/55 p-3 rounded-xl border border-secondary-foreground/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center gap-2"
            onClick={() => navigate('/buy-credits')}
          >
            <div className="size-9 rounded-full bg-secondary-foreground/15 text-black flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-black">Wallet</span>
          </Card>
        </div>

        {/* Suggested for You */}
        <div className="mb-5 w-full">
          <h3 className="text-base font-bold mb-4 flex items-center gap-1.5 animate-fade-in-up">
            <TrendingUp className="w-4 h-4 text-primary animate-pulse-glow" />
            <span>Suggested for you</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {isLoadingProjects ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-[9px] h-[300px]" />
              ))
            ) : openProjects.length > 0 ? (
              openProjects.slice(0, 4).map((project, index) => {
                const videoSource = [DASHBOARD_VIDEO_1, DASHBOARD_VIDEO_2, DASHBOARD_VIDEO_3, DASHBOARD_VIDEO_4][index % 4];
                const deadlineDate = project.bidding_deadline ? new Date(project.bidding_deadline) : null;
                const formattedDeadline = deadlineDate
                  ? deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Flexible';
                const createdDate = new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div key={project.id} className="group bg-white rounded-[9px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#f1f0f5] flex flex-col h-full">
                    <div className="relative h-[126px] overflow-hidden">
                      <video
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      >
                        <source src={encodeURI(videoSource)} type="video/mp4" />
                      </video>
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-bold text-sm leading-snug truncate pr-2 group-hover:text-primary transition-colors text-black" title={project.title}>
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <Badge className="px-1 py-0.25 bg-secondary text-[#121118] text-[7px] font-bold uppercase tracking-tight rounded-md shadow-sm">
                            {index % 2 === 0 ? 'Skillbridge Choice' : 'Top Choice'}
                          </Badge>
                          <span className="text-[9px] font-medium text-[#68608a] whitespace-nowrap">{createdDate}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#68608a] line-clamp-2 mb-2.5">
                        {project.description || 'No description available'}
                      </p>
                      <div className="mt-auto space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-[#68608a] uppercase tracking-tight">Estimated Budget</span>
                            <span className="text-sm font-extrabold text-primary">₹{project.budget?.toLocaleString('en-IN') || 'TBD'}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-[#68608a] uppercase tracking-tight">Deadline</span>
                            <span className="text-[11px] font-bold text-black">{formattedDeadline}</span>
                          </div>
                        </div>
                        <div className="pt-2.5 border-t border-[#f1f0f5] flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-accent-green text-[#052005] text-[9px] font-bold rounded-full flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-[#145214]"></span> Bid Open
                          </span>
                          <button
                            className="text-primary hover:text-primary/80 transition-colors"
                            onClick={() => navigate(`/projects/${project.id}`)}
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-1 md:col-span-4 py-10 text-center border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground text-sm">No projects currently open for bidding. Check back soon!</p>
              </div>
            )}
          </div>
        </div>


        {/* Earnings & Profit Analytics */}
        <div className="mb-5 w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              Earnings & Profit
            </h3>
          </div>
          <div ref={earningsSectionRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Earnings – scattered drift path 1 */}
            <div className="bg-primary/55 rounded-xl border border-primary/30 shadow-sm p-4 hover:shadow-md transition-all animate-earnings-drift-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-primary/30 flex items-center justify-center [color:#000]">
                    <Wallet className="w-4 h-4 [stroke:#000]" stroke="#000" />
                  </div>
                  <span className="text-xs font-bold !text-black uppercase">Total Earnings</span>
                </div>
                <TrendingUp className="w-4 h-4 !text-black [stroke:black]" stroke="black" />
              </div>
              <p className="text-2xl font-black !text-black">₹{formatEarnings(displayTotal)}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold !text-black">this month</span>
              </div>
            </div>

            {/* Average per Project – scattered drift path 3 */}
            <div className="bg-accent/55 rounded-xl border border-accent-foreground/20 shadow-sm p-4 hover:shadow-md transition-all animate-earnings-drift-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold !text-black uppercase">Avg. per Project</span>
                  <p className="text-2xl font-black !text-black mt-1">₹{formatEarnings(displayAvg)}</p>
                </div>
                <div className="size-10 rounded-xl bg-accent-foreground/15 flex items-center justify-center [color:#000]">
                  <DollarSign className="w-5 h-5 [stroke:#000]" stroke="#000" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Top Picks For Your Skills – Coming Soon */}
        <div className="mb-5 w-full">
          <h3 className="text-base font-bold mb-3 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-primary" />
            Our Top Picks For Your Skills
          </h3>
          <Card className="bg-[#FDF8F3] h-[220px] rounded-2xl border border-black/10 border-dashed flex flex-col items-center justify-center text-center p-6 transition-all hover:bg-[#FAF3EA] group">
            <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
              <Rocket className="w-7 h-7 text-primary animate-bounce-slow" />
            </div>
            <h4 className="text-xl font-black text-[#121118] mb-2 uppercase tracking-tight">Coming Soon</h4>
            <p className="text-sm text-[#68608a] max-w-[280px] font-medium">
              We're curating personalized learning paths and top skill picks just for you.
            </p>
          </Card>
        </div>

        {/* Latest in Tech, Weekly Roadmap, To-Do List & Active Snapshots */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column - Latest in Tech, Weekly Roadmap & To-Do List */}
          <div className="lg:col-span-2 space-y-5">
            {/* Latest in Tech */}
            <div>
              <h3 className="text-base font-bold mb-3.5 flex items-center gap-1.5">
                <Rss className="w-3.5 h-3.5 text-primary" />
                Latest in Tech
              </h3>
              <div className="relative overflow-hidden rounded-xl">
                {/* Auto-swiping cards container */}
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{
                    transform: `translateX(-${currentTechCardIndex * 100}%)`
                  }}
                >
                  {/* Render cards in pairs */}
                  {isLoadingNews ? (
                    <div className="flex gap-4 w-full flex-shrink-0 min-w-full">
                      <div className="flex-1 rounded-xl overflow-hidden shadow-lg border border-black/20 relative h-[400px] bg-muted animate-pulse"></div>
                      <div className="flex-1 rounded-xl overflow-hidden shadow-lg border border-black/20 relative h-[400px] bg-muted animate-pulse"></div>
                    </div>
                  ) : latestTechCards.length === 0 ? (
                    <div className="flex gap-4 w-full flex-shrink-0 min-w-full items-center justify-center h-[400px] border border-dashed rounded-xl border-border/50 text-muted-foreground">
                      No tech news available at the moment.
                    </div>
                  ) : (
                    Array.from({ length: Math.ceil(latestTechCards.length / 2) }).map((_, pairIndex) => {
                      const pairCards = latestTechCards.slice(pairIndex * 2, pairIndex * 2 + 2);
                      return (
                        <div key={pairIndex} className="flex gap-4 w-full flex-shrink-0 min-w-full">
                          {pairCards.map((card) => (
                            <a
                              href={card.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              key={card.id}
                              className="flex-1 rounded-xl overflow-hidden shadow-lg border border-black/20 relative h-[400px] group cursor-pointer hover:shadow-xl transition-all block"
                            >
                              {/* Background Image */}
                              <div className="absolute inset-0">
                                <img
                                  src={card.backgroundImage}
                                  alt={card.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/images/dashboard-hero.png";
                                  }}
                                />
                                {/* Gradient overlay for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                              </div>

                              {/* Content */}
                              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                {/* Author and Category */}
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-sm font-semibold truncate max-w-[150px]">{card.author}</span>
                                  <span className="text-xs opacity-70">•</span>
                                  <span className="text-xs opacity-70 whitespace-nowrap">{card.category}</span>
                                </div>

                                {/* Title */}
                                <h4 className="text-xl font-bold mb-3 leading-tight line-clamp-2 md:line-clamp-3 group-hover:text-primary transition-colors">
                                  {card.title}
                                </h4>

                                {/* Description */}
                                <p className="text-sm opacity-90 line-clamp-3 md:line-clamp-2">
                                  {card.description}
                                </p>
                              </div>
                            </a>
                          ))}
                          {/* If odd number of cards, add empty space for the last pair */}
                          {pairCards.length === 1 && (
                            <div className="flex-1" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Roadmap & To-Do List - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Weekly Roadmap */}
              <Card className="bg-[#FDF8F3] rounded-2xl p-6 shadow-sm border border-black/20 flex flex-col h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold flex-shrink-0">Weekly Roadmap</h3>
                    <span className="text-[9px] font-bold text-accent-foreground bg-accent px-2 py-1 rounded flex-shrink-0 whitespace-nowrap">
                      {formatWeekDateRange()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-1">
                    {getCurrentWeek().days.map((day) => {
                      const dayData = getDayData(day);
                      const dayAbbr = format(day, 'EEE').toUpperCase();
                      const dayNum = format(day, 'd');
                      const isSelected = isSameDay(day, roadmapSelectedDay);
                      const isToday = isSameDay(day, new Date());
                      const hasTasks = dayData.tasks.length > 0;
                      const hasCompletedTasks = dayData.tasks.some(t => t.completed);
                      const allTasksCompleted = dayData.tasks.length > 0 && dayData.tasks.every(t => t.completed);

                      return (
                        <button
                          key={getDayKey(day)}
                          onClick={() => setRoadmapSelectedDay(day)}
                          className="flex flex-col items-center gap-2 group flex-1"
                        >
                          <span className={cn(
                            "text-xs font-bold",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )}>{dayAbbr}</span>
                          <div className={cn(
                            "w-full aspect-square rounded-lg border flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-2 border-primary bg-primary/5 shadow-sm"
                              : hasCompletedTasks && !allTasksCompleted
                                ? "border-primary/20 bg-primary/5"
                                : "border-dashed border-border bg-muted/50 hover:border-primary/50"
                          )}>
                            {allTasksCompleted ? (
                              <span className="text-sm text-primary">✓</span>
                            ) : hasCompletedTasks ? (
                              <span className="text-sm text-primary">✓</span>
                            ) : isSelected ? (
                              <span className="text-sm text-primary font-bold">✎</span>
                            ) : (
                              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Display tasks for selected day */}
                  {(() => {
                    const selectedDayData = getDayData(roadmapSelectedDay);
                    return (
                      <div className="mt-4 space-y-1.5 min-h-[54px]">
                        {selectedDayData.tasks.length > 0 ? (
                          <div className="space-y-1">
                            {selectedDayData.tasks.slice(0, 3).map((task) => (
                              <div key={task.id} className="flex items-center gap-1.5 text-[11px]">
                                <Checkbox
                                  checked={task.completed}
                                  className="w-2.5 h-2.5"
                                  disabled
                                />
                                <span className={cn(
                                  "flex-1 text-[11px]",
                                  task.completed ? "line-through text-muted-foreground" : "text-foreground"
                                )}>
                                  {task.text}
                                </span>
                              </div>
                            ))}
                            {selectedDayData.tasks.length > 3 && (
                              <p className="text-[11px] text-muted-foreground">+{selectedDayData.tasks.length - 3} more</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">No tasks for {format(roadmapSelectedDay, 'EEEE')}</p>
                        )}
                      </div>
                    );
                  })()}
                  <div className="mt-6 border-t border-border pt-3">
                    <button
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:gap-2 transition-all"
                      onClick={() => setWeeklyPlannerOpen(true)}
                    >
                      Plan your week
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </Card>

              {/* To-Do List */}
              <Card className="bg-[#FDF8F3] rounded-2xl p-6 shadow-sm border border-black/20 flex flex-col h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <CheckSquare2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold">To-Do List</h3>
                  </div>
                  <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-primary text-primary text-xs font-bold hover:bg-primary/5"
                      >
                        <Plus className="w-4 h-4" />
                        Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>New Task</DialogTitle>
                      </DialogHeader>
                      <Separator className="my-4" />
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="task" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Task Name
                          </Label>
                          <Input
                            id="task"
                            placeholder="What needs to be done?"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddTask();
                              }
                            }}
                            className="rounded-lg"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Priority
                          </Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={newTaskPriority === 'low' ? 'default' : 'outline'}
                              onClick={() => setNewTaskPriority('low')}
                              className={cn(
                                "rounded-lg flex-1",
                                newTaskPriority === 'low'
                                  ? "bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-accent dark:text-accent-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted dark:text-muted-foreground"
                              )}
                            >
                              Low
                            </Button>
                            <Button
                              type="button"
                              variant={newTaskPriority === 'medium' ? 'default' : 'outline'}
                              onClick={() => setNewTaskPriority('medium')}
                              className={cn(
                                "rounded-lg flex-1",
                                newTaskPriority === 'medium'
                                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-secondary dark:text-secondary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted dark:text-muted-foreground"
                              )}
                            >
                              Medium
                            </Button>
                            <Button
                              type="button"
                              variant={newTaskPriority === 'high' ? 'default' : 'outline'}
                              onClick={() => setNewTaskPriority('high')}
                              className={cn(
                                "rounded-lg flex-1",
                                newTaskPriority === 'high'
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted dark:text-muted-foreground"
                              )}
                            >
                              High
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setAddTaskDialogOpen(false);
                              setNewTaskText('');
                              setNewTaskPriority('medium');
                            }}
                            className="text-gray-700 dark:text-gray-300"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddTask}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Add Task
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex-1 space-y-px bg-muted rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                  {todos.length === 0 ? (
                    <div className="p-5 bg-[#FDF8F3] text-center text-sm text-muted-foreground">
                      No tasks yet. Add one to get started!
                    </div>
                  ) : (
                    todos.map((todo, index) => (
                      <div
                        key={todo.id}
                        className={cn(
                          "flex items-center gap-3 p-3 bg-[#FDF8F3]",
                          index < todos.length - 1 && "border-b border-border"
                        )}
                      >
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => toggleTodo(todo.id)}
                          className="size-4 rounded text-primary"
                        />
                        <span
                          className={cn(
                            "text-sm font-medium flex-1",
                            todo.completed
                              ? "text-muted-foreground line-through decoration-muted-foreground"
                              : "text-foreground"
                          )}
                        >
                          {todo.text}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium px-2 py-1 rounded",
                            getPriorityBadge(todo.priority)
                          )}
                        >
                          {getPriorityLabel(todo.priority)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

          </div>

          {/* Right Column - Active Snapshots */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" />
                Active Snapshots
              </h3>
              <span className="text-[11px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-lg">
                {activeProjects.length} Active
              </span>
            </div>
            <div className="space-y-2.5">
              {activeProjects.length > 0 ? (
                activeProjects.map((project) => {
                  const deadline = project.bidding_deadline
                    ? new Date(project.bidding_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : null;
                  const isOverdue = deadline && new Date(project.bidding_deadline) < new Date();

                  return (
                    <Card key={project.id} className="bg-[#FDF8F3] p-5 rounded-xl border border-black/20 shadow-sm group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4 min-w-0">
                          <h4 className="font-bold text-base mb-1.5 text-foreground">{project.title}</h4>
                          <p className="text-xs text-muted-foreground italic">Client: Coming Soon</p>
                        </div>
                        {deadline && (
                          <div className="flex flex-col items-end text-right pl-4 flex-shrink-0">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                              Deadline
                            </span>
                            <span className={cn(
                              "text-sm font-bold",
                              isOverdue ? "text-red-500" : "text-foreground"
                            )}>
                              {deadline}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-xs transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-1.5"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        Open Project
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Card>
                  );
                })
              ) : (
                <Card className="bg-[#FDF8F3] p-5 rounded-xl border border-black/20 shadow-sm">
                  <p className="text-muted-foreground text-center py-3.5 text-xs">No active projects at the moment</p>
                </Card>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Weekly Planner Dialog */}
      <Dialog open={weeklyPlannerOpen} onOpenChange={setWeeklyPlannerOpen}>
        <DialogContent className="max-w-3xl h-[85vh] p-0 bg-[#faf7f1] overflow-hidden [&>button]:hidden" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex flex-col h-full min-h-0">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-200/60 bg-white flex justify-between items-start flex-shrink-0">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h2 className="text-xl font-black tracking-tight text-[#121118]">Plan Your Week</h2>
                  {(() => {
                    const week = getCurrentWeek();
                    return (
                      <Badge className="bg-secondary text-[#121118] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {format(week.monday, 'MMM d')} — {format(week.sunday, 'MMM d')}
                      </Badge>
                    );
                  })()}
                </div>
                <p className="text-gray-500 font-medium text-xs">Add your key tasks for each day. Keep it simple.</p>
              </div>
              <button
                onClick={() => setWeeklyPlannerOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0 flex-shrink">
              {/* Left Column - Select Day & Week Overview */}
              <div className="lg:col-span-5 p-5 border-r border-gray-200/60 bg-gray-50/30">
                {/* Select Day */}
                <div className="mb-7">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3.5">Select Day</h3>
                  <div className="flex justify-between gap-1.5">
                    {getCurrentWeek().days.map((day) => {
                      const dayData = getDayData(day);
                      const isSelected = isSameDay(day, selectedDay);
                      const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                      const hasTasks = dayData.tasks.length > 0;
                      return (
                        <button
                          key={getDayKey(day)}
                          onClick={() => {
                            setSelectedDay(day);
                            setSelectedFocus(dayData.focus || 'work');
                          }}
                          className={cn(
                            "flex-1 aspect-square rounded-xl flex flex-col items-center justify-center gap-1 shadow-md transition-colors",
                            isSelected
                              ? "bg-primary text-white shadow-primary/20"
                              : "bg-white border border-gray-200 text-[#121118] hover:border-primary/40"
                          )}
                        >
                          <span className={cn(
                            "text-[9px] font-bold uppercase opacity-80",
                            !isSelected && isWeekend && "text-red-400",
                            !isSelected && !isWeekend && "text-gray-400"
                          )}>
                            {format(day, 'EEE')}
                          </span>
                          <span className="text-base font-black">{format(day, 'd')}</span>
                          {hasTasks && (
                            <div className="size-1.5 bg-accent rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Week Overview */}
                <div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3.5">Week Overview</h3>
                  <div className="space-y-3.5">
                    {getCurrentWeek().days.map((day) => {
                      const dayData = getDayData(day);
                      const dayName = format(day, 'EEEE').toUpperCase();
                      const isSelected = isSameDay(day, selectedDay);
                      return (
                        <div key={getDayKey(day)} className="bg-white/60 p-3.5 rounded-xl border border-gray-100">
                          <p className={cn(
                            "text-[11px] font-bold mb-1.5",
                            isSelected ? "text-primary" : "text-gray-400"
                          )}>
                            {dayName}
                          </p>
                          {dayData.tasks.length > 0 ? (
                            <ul className="space-y-1">
                              {dayData.tasks.slice(0, 2).map((task) => (
                                <li key={task.id} className="text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
                                  <span className="size-1 bg-accent rounded-full" />
                                  <span className={cn(task.completed && "line-through text-gray-400")}>
                                    {task.text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] font-medium text-gray-400 italic">No tasks scheduled yet...</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column - Daily Plan */}
              <div className="lg:col-span-7 p-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-lg font-bold">{format(selectedDay, 'EEEE, MMM d')}</h4>
                    {(() => {
                      const dayData = getDayData(selectedDay);
                      return (
                        <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-[9px] font-bold text-gray-500 uppercase">
                          {dayData.tasks.length} {dayData.tasks.length === 1 ? 'Task' : 'Tasks'}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="space-y-5">
                    {/* Add Task */}
                    <div className="space-y-2.5">
                      <div className="relative">
                        <Input
                          placeholder="Add a task..."
                          value={newWeeklyTaskText}
                          onChange={(e) => setNewWeeklyTaskText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addWeeklyTask();
                            }
                          }}
                          className="w-full pl-3.5 pr-11 py-2.5 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400"
                        />
                        <button
                          onClick={addWeeklyTask}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Task List */}
                    <div className="space-y-1.5">
                      {getDayData(selectedDay).tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3.5 p-2.5 hover:bg-gray-50 rounded-xl transition-colors group">
                          <GripVertical className="text-gray-300 cursor-grab active:cursor-grabbing w-3.5 h-3.5" />
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleWeeklyTask(selectedDay, task.id)}
                            className="w-4 h-4 rounded-md"
                          />
                          <span className={cn(
                            "flex-1 text-xs font-medium",
                            task.completed ? "line-through text-gray-400" : "text-gray-800"
                          )}>
                            {task.text}
                          </span>
                          <Badge
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                              task.priority === 'high' && "bg-orange-100 text-orange-600",
                              task.priority === 'medium' && "bg-blue-100 text-blue-600",
                              task.priority === 'low' && "bg-accent/30 text-accent-foreground"
                            )}
                          >
                            {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Mid' : 'Low'}
                          </Badge>
                          <button
                            onClick={() => deleteWeeklyTask(selectedDay, task.id)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Separator className="border-gray-100" />

                    {/* Focus for Day */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2.5">Focus for Day</label>
                      <div className="flex gap-1.5">
                        {(['work', 'learning', 'personal'] as const).map((focus) => {
                          const dayData = getDayData(selectedDay);
                          const isSelected = dayData.focus === focus || (!dayData.focus && focus === 'work');
                          return (
                            <Button
                              key={focus}
                              type="button"
                              onClick={() => {
                                updateDayData(selectedDay, { focus });
                                setSelectedFocus(focus);
                              }}
                              className={cn(
                                "flex-1 py-1.5 text-[10px] font-bold rounded-lg shadow-sm",
                                isSelected
                                  ? "bg-primary text-white"
                                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                              )}
                            >
                              {focus.charAt(0).toUpperCase() + focus.slice(1)}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-white border-t border-gray-200/60 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => clearDay(selectedDay)}
                className="text-xs font-bold text-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear day
              </button>
              <div className="flex gap-3.5">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Save draft functionality
                    toast.success('Draft saved');
                  }}
                  className="px-5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Save Draft
                </Button>
                <Button
                  onClick={() => {
                    // Save week plan functionality - data is already saved to localStorage via useEffect
                    // Force roadmap to refresh by updating the selected day
                    const today = new Date();
                    const week = getCurrentWeek();
                    const todayInWeek = week.days.find(day => isSameDay(day, today));
                    if (todayInWeek) {
                      setRoadmapSelectedDay(today);
                    } else {
                      setRoadmapSelectedDay(week.days[0]);
                    }
                    toast.success('Week plan saved successfully');
                    setWeeklyPlannerOpen(false);
                  }}
                  className="px-7 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all active:translate-y-0"
                >
                  Save Week Plan
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
