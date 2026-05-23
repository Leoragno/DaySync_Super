import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useCategories } from '@/hooks/useCategories';
import { checkPermission, requestPermission, scheduleEventReminder, cancelEventReminder } from '@/lib/notifications';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import EventForm from '@/components/agenda/EventForm';
import { useToast } from '@/hooks/use-toast';
import { describeError } from '@/lib/describeError';

export default function Agenda() {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [notifGranted, setNotifGranted] = useState(false);

  const { data: events, isLoading } = useEvents();
  const { data: agendaCategories = [] } = useCategories();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  useEffect(() => { checkPermission().then(setNotifGranted); }, []);

  const selectedStr = format(selectedDate, 'yyyy-MM-dd');

  const dayEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(e => e.date === selectedStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [events, selectedStr]);

  const eventDates = useMemo(() => {
    if (!events) return new Set();
    return new Set(events.map(e => e.date));
  }, [events]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = [];
    let day = start;
    while (day <= end) { days.push(day); day = addDays(day, 1); }
    return days;
  }, [currentMonth]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(null);
  }, []);

  const openForm = useCallback((event = null) => {
    if (event) {
      setEditingId(event.id);
      setFormData({
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time || '',
        end_time: event.end_time || '',
        type: event.type,
        category: event.category || '',
        color: event.color || '#6366f1',
        reminder_minutes: event.reminder_minutes ?? 30,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        date: selectedStr,
        time: '',
        end_time: '',
        type: 'impegno',
        category: '',
        color: '#6366f1',
        reminder_minutes: 30,
      });
    }
    setFormOpen(true);
  }, [selectedStr]);

  const handleSave = async (data) => {
    let saved;
    if (editingId) {
      await updateEvent.mutateAsync({ id: editingId, data });
      // Cancel old reminder before scheduling new one to prevent duplicates
      try {
        await cancelEventReminder(editingId);
      } catch (e) {
        console.warn('[DaySync] cancelEventReminder failed, continuing:', e);
      }
      saved = { id: editingId, ...data };
    } else {
      const created = await createEvent.mutateAsync(data);
      saved = created;
    }
    if (data.reminder_minutes && data.reminder_minutes > 0 && notifGranted) {
      try {
        await scheduleEventReminder({ ...data, id: saved?.id || editingId });
      } catch (e) {
        console.warn('[DaySync] scheduleEventReminder failed:', e);
      }
    }
    closeForm();
  };

  const handleDelete = async (id) => {
    void cancelEventReminder(id).catch((e) =>
      console.warn('[DaySync] cancelEventReminder (delete)', e)
    );
    await deleteEvent.mutateAsync(id);
    closeForm();
  };

  const toggleComplete = async (event) => {
    const completed = Boolean(event.completed);
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        data: { completed: !completed },
      });
    } catch (err) {
      const { title, description } = describeError(err, 'Impossibile aggiornare l\'evento');
      toast({
        title,
        description,
        variant: 'destructive',
      });
    }
  };

  const enableNotifs = async () => {
    const granted = await requestPermission();
    setNotifGranted(granted);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="px-5 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Agenda</h1>
        <button onClick={() => openForm()} className="p-2 rounded-xl bg-primary text-white"><Plus size={16} /></button>
      </div>

      {/* Calendar */}
      <div className="glass border border-white/5 rounded-3xl p-5 mb-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setCurrentMonth(p => subMonths(p, 1))} className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-base font-bold capitalize">{format(currentMonth, 'MMMM', { locale: it })}</h2>
            <span className="text-[10px] font-medium text-muted-foreground">{format(currentMonth, 'yyyy')}</span>
          </div>
          <button onClick={() => setCurrentMonth(p => addMonths(p, 1))} className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
            <div key={d} className="text-center text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasEvents = eventDates.has(dateStr);
            const selected = isSameDay(day, selectedDate);
            const today = isToday(day);
            const inMonth = isSameMonth(day, currentMonth);
            return (
              <button key={i} onClick={() => setSelectedDate(day)}
                className={`relative w-full aspect-square rounded-xl flex items-center justify-center text-xs font-medium transition-all
                  ${!inMonth ? 'text-muted-foreground/30' : ''}
                  ${selected ? 'bg-primary text-white' : today ? 'bg-primary/20 text-primary' : 'hover:bg-background'}`}>
                {format(day, 'd')}
                {hasEvents && !selected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Info */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {isToday(selectedDate) ? 'Oggi' : format(selectedDate, 'EEEE d MMMM', { locale: it })}
        </h3>
      </div>

      {dayEvents.length === 0 ? (
        <EmptyState label="Nessun evento per questo giorno" />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {dayEvents.map((evt, i) => (
              <motion.div key={evt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 active-scale"
                onClick={() => openForm(evt)}>
                <button onClick={(e) => { e.stopPropagation(); toggleComplete(evt); }}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${evt.completed ? 'border-primary bg-primary' : 'border-border'}`}>
                  {evt.completed && <Check size={10} className="text-white" />}
                </button>
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: evt.color || '#6366f1' }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${evt.completed ? 'line-through text-muted-foreground' : ''}`}>{evt.title}</p>
                  {evt.description && (
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-2 whitespace-pre-wrap">
                      {evt.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/80 tabular-nums mt-1">
                    {evt.time || 'Tutto il giorno'}{evt.end_time ? ` – ${evt.end_time}` : ''}{evt.type ? ` · ${evt.type}` : ''}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <EventForm
        open={formOpen}
        onClose={closeForm}
        initial={formData}
        editingId={editingId}
        onSave={handleSave}
        onDelete={handleDelete}
        notifGranted={notifGranted}
        onEnableNotifications={enableNotifs}
        categories={agendaCategories}
      />
    </div>
  );
}