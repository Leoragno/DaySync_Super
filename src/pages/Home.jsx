import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, isTomorrow, isAfter, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarDays, Clock, StickyNote, Bell, Sunrise, Sun, Sunset, Moon, Pin } from 'lucide-react';
import { motion } from 'framer-motion';

import { useSchedules } from '@/hooks/useSchedules';
import { useEvents } from '@/hooks/useEvents';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import { DAY_ABBR_MAP } from '@/lib/constants';
import Section from '@/components/common/Section';
import Modal from '@/components/Modal';
import Notifiche from '@/pages/Notifiche';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import UpcomingCountdown from '@/components/schedule/UpcomingCountdown';

export default function Home() {
  const todayName = format(new Date(), 'EEE', { locale: it }).toLowerCase();
  const todayKey = DAY_ABBR_MAP[todayName] || 'Lun';
  const { data: schedules, isLoading: sLoading } = useSchedules();
  const { data: events, isLoading: eLoading } = useEvents();
  const { data: quickNotes, isLoading: qLoading } = useQuickNotes({ limit: 24 });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const previewQuickNotes = useMemo(() => {
    if (!quickNotes?.length) return [];
    return [...quickNotes]
      .sort((a, b) => {
        const pinDiff = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        if (pinDiff !== 0) return pinDiff;
        return new Date(b.created_at) - new Date(a.created_at);
      })
      .slice(0, 4);
  }, [quickNotes]);
  const todaySchedule = useMemo(() => {
    if (!schedules) return [];
    return schedules
      .filter(s => s.day === todayKey)
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [schedules, todayKey]);

  const upcomingEvents = useMemo(() => {
    if (!events) return [];
    const now = startOfDay(new Date());
    return events
      .filter(e => !e.completed && isAfter(new Date(e.date), new Date(now.getTime() - 86400000)))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [events]);

  const isLoading = sLoading || eLoading || qLoading;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Buongiorno', Icon: Sunrise };
    if (h < 18) return { text: 'Buon pomeriggio', Icon: Sun };
    if (h < 22) return { text: 'Buonasera', Icon: Sunset };
    return { text: 'Buonasera', Icon: Moon };
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="px-5 py-6 space-y-2">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <greeting.Icon className="text-primary shrink-0" size={22} strokeWidth={2} aria-hidden />
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">{greeting.text}</p>
          </div>
          {/* Settings modal is placed here */}
          <h1 className="text-2xl font-extrabold mt-0.5 text-gradient capitalize">
            {format(new Date(), 'EEEE d MMMM', { locale: it })}
          </h1>
        </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl bg-secondary shrink-0 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Impostazioni notifiche"
          >
            <Bell size={18} strokeWidth={2} />
          </button>
          {/* Settings Modal */}
          {isSettingsOpen && (
            <Modal isOpen={true} onClose={() => setIsSettingsOpen(false)}>
              <Notifiche />
            </Modal>
          )}
      </motion.div>

      {/* Today's Schedule */}
      <Section title="Orario di oggi" linkTo="/Orario">
        {todaySchedule.length === 0 ? (
          <EmptyState label="Nessuna lezione oggi" icon={<Clock size={20} className="text-muted-foreground" />} />
        ) : (
          <div className="space-y-2">
            {todaySchedule.map((slot, i) => (
              <motion.div key={slot.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 active-scale">
                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: slot.color || '#6366f1' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{slot.title}</p>
                  <p className="text-xs text-muted-foreground/75">{slot.hour}{slot.end_hour ? ` – ${slot.end_hour}` : ''}</p>
                </div>
                {slot.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-background text-muted-foreground">{slot.category}</span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Section>

      {/* Upcoming Events */}
      <Section title="Prossimi eventi" linkTo="/Agenda" className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 shadow-lg">
        {upcomingEvents.length === 0 ? (
          <EmptyState label="Nessun evento in programma" icon={<CalendarDays size={20} className="text-muted-foreground" />} />
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((evt, i) => {
              const evtDate = new Date(evt.date);
              let dateLabel = format(evtDate, 'd MMM', { locale: it });
              if (isToday(evtDate)) dateLabel = 'Oggi';
              else if (isTomorrow(evtDate)) dateLabel = 'Domani';

              const bgColor = evt.color || '#6366f1';

              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 120 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-center gap-4 bg-gradient-to-r from-white/10 to-white/20 backdrop-blur-sm rounded-xl border border-white/15 p-3 hover:border-white/30 transition-colors"
                >
                  {/* Event date badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `${bgColor}22`, color: bgColor }}
                  >
                    <span className="text-sm font-medium">{dateLabel}</span>
                  </div>
                  {/* Optional type icon */}
                  <div className="flex-shrink-0 text-muted-foreground">
                    {evt.type ? (
                      <CalendarDays size={20} />
                    ) : (
                      <CalendarDays size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-white truncate">{evt.title}</p>
                    <p className="text-xs text-white/70">
                      {evt.time || 'Tutto il giorno'}{evt.type ? ` · ${evt.type}` : ''}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Quick Notes Preview */}
      <Section title="Note rapide" linkTo="/Note">
        {!quickNotes || quickNotes.length === 0 ? (
          <EmptyState label="Nessuna nota rapida" icon={<StickyNote size={20} className="text-muted-foreground" />} />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {previewQuickNotes.map((n) => (
              <div
                key={n.id}
                className="relative rounded-2xl p-4 text-[11px] leading-relaxed line-clamp-4 border border-white/5 active-scale"
                style={{ backgroundColor: `${n.color || '#6366f1'}12`, color: n.color || '#6366f1' }}
              >
                {n.pinned && (
                  <Pin size={11} className="absolute top-2.5 right-2.5 text-primary fill-primary/25" aria-label="Appuntato" />
                )}
                {n.content}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}