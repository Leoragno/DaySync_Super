import { useState, useMemo, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

import { useSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule } from '@/hooks/useSchedules';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { DAYS, SCHEDULE_HOURS, SCHEDULE_START_HOUR, HOUR_HEIGHT_PX, DEFAULT_SCHEDULE } from '@/lib/constants';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import ScheduleForm from '@/components/schedule/ScheduleForm';
import CategoryManager from '@/components/schedule/CategoryManager';
import { useToast } from '@/hooks/use-toast';

export default function Orario() {
  const { toast } = useToast();
  const [dayIdx, setDayIdx] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });
  const [filterCat, setFilterCat] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_SCHEDULE);
  const [catMgrOpen, setCatMgrOpen] = useState(false);

  const { data: schedules, isLoading } = useSchedules();
  const { data: categories = [] } = useCategories();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const currentDay = DAYS[dayIdx];

  const daySlots = useMemo(() => {
    if (!schedules) return [];
    let filtered = schedules.filter(s => s.day === currentDay);
    if (filterCat) filtered = filtered.filter(s => s.category === filterCat);
    return filtered.sort((a, b) => a.hour.localeCompare(b.hour));
  }, [schedules, currentDay, filterCat]);

  const handleOpenForm = useCallback((slot = null) => {
    if (slot) {
      setEditingId(slot.id);
      setFormData({ title: slot.title, day: slot.day, hour: slot.hour, end_hour: slot.end_hour || '', category: slot.category || '', color: slot.color || '#6366f1' });
    } else {
      setEditingId(null);
      setFormData({ ...DEFAULT_SCHEDULE, day: currentDay });
    }
    setFormOpen(true);
  }, [currentDay]);

  const handleSave = async (data) => {
    try {
      if (editingId) {
        await updateSchedule.mutateAsync({ id: editingId, data });
      } else {
        await createSchedule.mutateAsync(data);
      }
      setFormOpen(false);
    } catch (err) {
      toast({
        title: "Errore durante il salvataggio",
        description: err.message || "Si è verificato un errore.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSchedule.mutateAsync(id);
      setFormOpen(false);
    } catch (err) {
      toast({
        title: "Errore durante l'eliminazione",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleCreateCategory = async (data) => {
    try {
      await createCategory.mutateAsync(data);
    } catch (err) {
      toast({
        title: "Errore creazione categoria",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory.mutateAsync(id);
    } catch (err) {
      toast({
        title: "Errore eliminazione categoria",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const getSlotTop = (hour) => {
    const [h, m] = hour.split(':').map(Number);
    return (h - SCHEDULE_START_HOUR) * HOUR_HEIGHT_PX + (m / 60) * HOUR_HEIGHT_PX;
  };
  const getSlotHeight = (start, end) => {
    if (!end) return HOUR_HEIGHT_PX;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(((eh * 60 + em) - (sh * 60 + sm)) / 60 * HOUR_HEIGHT_PX, 28);
  };

  return (
    <div className="px-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Orario</h1>
        <div className="flex gap-2">
          <button onClick={() => setCatMgrOpen(true)} className="p-2 rounded-xl bg-secondary">
            <Settings size={16} />
          </button>
          <button onClick={() => handleOpenForm()} className="p-2 rounded-xl bg-primary text-white">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setDayIdx(p => (p - 1 + 7) % 7)} className="p-1.5 rounded-lg bg-secondary">
          <ChevronLeft size={14} />
        </button>
        <div className="flex-1 flex gap-1 justify-center">
          {DAYS.map((d, i) => (
            <button key={d} onClick={() => setDayIdx(i)}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${i === dayIdx ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
              {d}
            </button>
          ))}
        </div>
        <button onClick={() => setDayIdx(p => (p + 1) % 7)} className="p-1.5 rounded-lg bg-secondary">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setFilterCat(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${!filterCat ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
            Tutte
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setFilterCat(filterCat === c.name ? null : c.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${filterCat === c.name ? 'text-white' : 'bg-secondary text-muted-foreground'}`}
              style={filterCat === c.name ? { backgroundColor: c.color } : {}}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />{c.name}
            </button>
          ))}
        </div>
      )}

      {/* Schedule grid */}
      <div className="relative overflow-y-auto rounded-2xl bg-secondary/50" style={{ height: '60vh' }}>
        <div className="relative" style={{ height: SCHEDULE_HOURS.length * HOUR_HEIGHT_PX }}>
          {/* Hour lines */}
          {SCHEDULE_HOURS.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 flex items-start border-t border-border/30"
              style={{ top: i * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}>
            <span className="text-[10px] text-muted-foreground/60 w-10 pl-2 pt-0.5 tabular-nums">{h}</span>
            </div>
          ))}
          {/* Slots */}
          {daySlots.map(slot => (
            <motion.div key={slot.id} layoutId={slot.id}
              onClick={() => handleOpenForm(slot)}
              className="absolute left-12 right-3 rounded-xl px-3 py-1.5 cursor-pointer overflow-hidden active:scale-[0.98] transition-transform"
              style={{
                top: getSlotTop(slot.hour),
                height: getSlotHeight(slot.hour, slot.end_hour),
                backgroundColor: `${slot.color || '#6366f1'}cc`,
              }}>
              <p className="text-xs font-bold text-white truncate">{slot.title}</p>
              <p className="text-[10px] text-white/65 tabular-nums">{slot.hour}{slot.end_hour ? ` – ${slot.end_hour}` : ''}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Schedule form modal */}
      <ScheduleForm 
        key={editingId || 'new'}
        open={formOpen} onClose={() => setFormOpen(false)}
        initial={formData} editingId={editingId}
        categories={categories} onSave={handleSave}
        onDelete={handleDelete} onOpenCategoryMgr={() => setCatMgrOpen(true)} />

      {/* Category manager modal */}
      <CategoryManager open={catMgrOpen} onClose={() => setCatMgrOpen(false)}
        categories={categories}
        onCreate={handleCreateCategory}
        onDelete={handleDeleteCategory} />
    </div>
  );
}