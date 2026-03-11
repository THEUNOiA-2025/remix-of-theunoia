import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, Gavel, Briefcase, Clock, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';

interface CalendarEvent {
  id: string;
  type: 'bid_made' | 'project_created' | 'bidding_deadline';
  date: Date;
  title: string;
  projectId?: string;
  amount?: number;
}

const CalendarPage = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch user's bids
  const { data: bids } = useQuery({
    queryKey: ['calendar-bids', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('bids')
        .select(`
          id,
          created_at,
          amount,
          project_id,
          user_projects (
            id,
            title,
            bidding_deadline
          )
        `)
        .eq('freelancer_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user's created projects
  const { data: projects } = useQuery({
    queryKey: ['calendar-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_projects')
        .select('id, title, created_at, bidding_deadline')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Transform data into calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Add bid events
    bids?.forEach((bid) => {
      allEvents.push({
        id: `bid-${bid.id}`,
        type: 'bid_made',
        date: new Date(bid.created_at),
        title: bid.user_projects?.title || 'Unknown Project',
        projectId: bid.project_id,
        amount: bid.amount,
      });

      // Add deadline from bid's project
      if (bid.user_projects?.bidding_deadline) {
        allEvents.push({
          id: `deadline-bid-${bid.id}`,
          type: 'bidding_deadline',
          date: new Date(bid.user_projects.bidding_deadline),
          title: bid.user_projects.title || 'Unknown Project',
          projectId: bid.project_id,
        });
      }
    });

    // Add project created events
    projects?.forEach((project) => {
      allEvents.push({
        id: `project-${project.id}`,
        type: 'project_created',
        date: new Date(project.created_at),
        title: project.title,
        projectId: project.id,
      });

      // Add deadline from own project
      if (project.bidding_deadline) {
        allEvents.push({
          id: `deadline-project-${project.id}`,
          type: 'bidding_deadline',
          date: new Date(project.bidding_deadline),
          title: project.title,
          projectId: project.id,
        });
      }
    });

    return allEvents;
  }, [bids, projects]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Pad the beginning to start on Sunday
    const startDay = start.getDay();
    const paddedDays: (Date | null)[] = Array(startDay).fill(null);
    
    return [...paddedDays, ...days];
  }, [currentMonth]);

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };

  // Get events for selected date
  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const eventTypeConfig = {
    bid_made: {
      icon: Gavel,
      label: 'Bid Made',
      bgColor: 'bg-primary',
      textColor: 'text-primary',
      lightBg: 'bg-primary-light',
    },
    project_created: {
      icon: Briefcase,
      label: 'Project Created',
      bgColor: 'bg-green',
      textColor: 'text-green-foreground',
      lightBg: 'bg-green/20',
    },
    bidding_deadline: {
      icon: Clock,
      label: 'Bidding Deadline',
      bgColor: 'bg-secondary',
      textColor: 'text-secondary-foreground',
      lightBg: 'bg-secondary/30',
    },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your bids, projects, and deadlines</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(eventTypeConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.bgColor}`} />
            <span className="text-sm text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg px-3 text-sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              const uniqueEventTypes = Array.from(new Set(dayEvents.map(e => e.type)));
              const eventCount = dayEvents.length;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[80px] p-1.5 rounded-xl transition-all flex flex-col items-center justify-start gap-1 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isCurrentDay
                      ? 'bg-primary-light text-primary font-semibold'
                      : isCurrentMonth
                      ? 'hover:bg-muted/50 text-foreground'
                      : 'text-muted-foreground/50'
                  }`}
                >
                  <span className="text-sm font-medium">{format(day, 'd')}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex flex-col gap-0.5 w-full px-0.5">
                      {/* Show event type badges */}
                      {uniqueEventTypes.slice(0, 2).map((type) => {
                        const typeCount = dayEvents.filter(e => e.type === type).length;
                        const shortLabel = type === 'bid_made' ? 'Bid' : type === 'project_created' ? 'Project' : 'Deadline';
                        
                        return (
                          <div
                            key={type}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold truncate text-center ${
                              isSelected 
                                ? 'bg-primary-foreground/20 text-primary-foreground' 
                                : `${eventTypeConfig[type].bgColor} text-white`
                            }`}
                          >
                            {typeCount > 1 ? `${typeCount} ${shortLabel}s` : shortLabel}
                          </div>
                        );
                      })}
                      {uniqueEventTypes.length > 2 && (
                        <div className={`text-[9px] font-medium ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          +{uniqueEventTypes.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Event Details Panel */}
        <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </h3>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">Click on a day to see events</p>
            </div>
          ) : selectedDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No events on this day</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedDayEvents.map((event) => {
                const config = eventTypeConfig[event.type];
                const Icon = config.icon;

                return (
                  <a
                    key={event.id}
                    href={event.projectId ? `/projects/${event.projectId}` : '#'}
                    className={`flex items-start gap-3 p-3 rounded-xl ${config.lightBg} hover:opacity-90 transition-opacity`}
                  >
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {event.title}
                      </p>
                      <p className={`text-xs ${config.textColor} font-medium`}>
                        {config.label}
                        {event.amount && ` • ₹${event.amount.toLocaleString()}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(event.date, 'h:mm a')}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
