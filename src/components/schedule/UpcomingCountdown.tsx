import { useEffect, useState, useMemo } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, Play } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  end_time?: string;
  type: string;
  category?: string;
  color?: string;
  completed?: boolean;
}

interface UpcomingCountdownProps {
  events: Event[] | undefined;
}

export default function UpcomingCountdown({ events }: UpcomingCountdownProps) {
  const [now, setNow] = useState(new Date());

  // Tick the clock every second to drive real-time countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Find the most relevant event: either in progress right now, or the next upcoming one today/tomorrow
  const activeEvent = useMemo(() => {
    if (!events || events.length === 0) return null;

    const parsedEvents = events
      .filter((e) => !e.completed && e.date && e.time)
      .map((e) => {
        const [year, month, day] = e.date.split('-').map(Number);
        const [hour, minute] = e.time!.split(':').map(Number);
        const start = new Date(year, month - 1, day, hour, minute);

        let end = new Date(start.getTime() + 60 * 60 * 1000); // Default to 1 hour duration
        if (e.end_time) {
          const [endHour, endMinute] = e.end_time.split(':').map(Number);
          end = new Date(year, month - 1, day, endHour, endMinute);
        }

        return { ...e, start, end };
      });

    // 1. Check if there's any event in progress right now
    const inProgress = parsedEvents.find((e) => now >= e.start && now <= e.end);
    if (inProgress) {
      return { ...inProgress, state: 'in_progress' as const };
    }

    // 2. Otherwise find the next future event, sorted by start time
    const futureEvents = parsedEvents
      .filter((e) => e.start > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (futureEvents.length > 0) {
      return { ...futureEvents[0], state: 'upcoming' as const };
    }

    return null;
  }, [events, now]);

  // Compute countdown strings and progress bars
  const displayMetrics = useMemo(() => {
    if (!activeEvent) return null;

    const { start, end, state } = activeEvent;

    if (state === 'in_progress') {
      const duration = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      const progressPercent = Math.min(100, Math.max(0, (elapsed / duration) * 100));

      const remainingMs = end.getTime() - now.getTime();
      const remainingMins = Math.ceil(remainingMs / 60000);

      return {
        state: 'in_progress',
        progress: progressPercent,
        label: 'In corso',
        timeString: `Finisce tra ${remainingMins} min`,
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        progressBarColor: 'bg-emerald-500',
      };
    } else {
      const diffMs = start.getTime() - now.getTime();
      const diffSecs = Math.floor(diffMs / 1000);

      let timeString = '';
      if (diffSecs < 60) {
        timeString = `${diffSecs}s`;
      } else if (diffSecs < 3600) {
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        timeString = `${mins}m ${secs}s`;
      } else if (diffSecs < 86400) {
        const hrs = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;
        timeString = `${hrs}h ${mins}m ${secs}s`;
      } else {
        const days = Math.floor(diffSecs / 86400);
        const hrs = Math.floor((diffSecs % 86400) / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        timeString = `${days}g ${hrs}h ${mins}m`;
      }

      // Date labeling
      let dayLabel = '';
      if (isToday(start)) {
        dayLabel = 'Oggi';
      } else if (isTomorrow(start)) {
        dayLabel = 'Domani';
      } else {
        dayLabel = format(start, 'EEEE d MMMM', { locale: it });
      }

      return {
        state: 'upcoming',
        label: `Inizia ${dayLabel.toLowerCase()} alle ${activeEvent.time}`,
        timeString,
        badgeColor: 'bg-primary/20 text-primary border-primary/30',
        progressBarColor: 'bg-primary',
      };
    }
  }, [activeEvent, now]);

  if (!activeEvent || !displayMetrics) {
    return null;
  }

  const themeColor = activeEvent.color || '#6366f1';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeEvent.id + displayMetrics.state}
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-5 backdrop-blur-xl"
        style={{
          boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)`,
        }}
      >
        {/* Category Ambient Glow Effect */}
        <div
          className="absolute -right-20 -top-20 w-44 h-44 rounded-full filter blur-[60px] opacity-25 transition-colors duration-500"
          style={{ backgroundColor: themeColor }}
        />

        {/* Glow Left Border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-full transition-colors duration-500"
          style={{ backgroundColor: themeColor }}
        />

        <div className="flex flex-col gap-4">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wide transition-all ${displayMetrics.badgeColor}`}
              >
                {displayMetrics.label}
              </span>
              {activeEvent.category && (
                <span className="text-[10px] text-muted-foreground bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full">
                  {activeEvent.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              {displayMetrics.state === 'in_progress' ? (
                <Play className="text-emerald-400 shrink-0" size={12} fill="currentColor" />
              ) : (
                <Clock className="text-primary shrink-0" size={12} />
              )}
              <span className="tabular-nums tracking-wide">{displayMetrics.timeString}</span>
            </div>
          </div>

          {/* Title and Time Row */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight text-white line-clamp-1">
              {activeEvent.title}
            </h3>
            {activeEvent.description && (
              <p className="text-xs text-muted-foreground/80 line-clamp-1 leading-relaxed">
                {activeEvent.description}
              </p>
            )}
          </div>

          {/* Dynamic Progress/Countdown Indicator */}
          {displayMetrics.state === 'in_progress' ? (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-all duration-1000 ${displayMetrics.progressBarColor}`}
                  style={{ width: `${displayMetrics.progress}%`, backgroundColor: themeColor }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground/60 font-medium tracking-wide uppercase">
                <span>{activeEvent.time}</span>
                <span>{activeEvent.end_time || 'Fine'}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-white/[0.02] border border-white/5 rounded-2xl px-3.5 py-2">
              <Calendar size={12} className="shrink-0 text-muted-foreground/60" />
              <span className="font-medium">
                {format(activeEvent.start, "d MMMM yyyy 'alle' HH:mm", { locale: it })}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
