import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { DAYS, COLORS } from '@/lib/constants';

/**
 * Bottom-sheet form for creating/editing schedule entries.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 * @param {object|null} props.initial - Existing slot data when editing
 * @param {string|null} props.editingId
 * @param {Array} props.categories - Available categories
 * @param {Function} props.onSave - (formData) => void
 * @param {Function} props.onDelete - (id) => void
 * @param {Function} props.onOpenCategoryMgr - Opens category manager
 */
export default function ScheduleForm({
  open, onClose, initial, editingId,
  categories, onSave, onDelete, onOpenCategoryMgr,
}) {
  const [form, setForm] = useState(initial || { day: 'Lun', hour: '08:00', end_hour: '09:00', title: '', category: '', color: '#6366f1' });

  // Sync form when initial changes (opening a different item)
  if (open && initial && form !== initial && !form._synced) {
    setForm({ ...initial, _synced: true });
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!form.title || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { _synced, ...data } = form;
      await onSave(data);
      handleClose();
    } catch (err) {
      // Error is handled by parent's toast but we need to stop loading here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({ ...initial, _synced: false });
    onClose();
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-end"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-md mx-auto bg-card rounded-t-2xl p-6 pb-10 overflow-y-auto max-h-[85vh]"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{editingId ? 'Modifica attività' : 'Nuova attività'}</h3>
          <div className="flex gap-2">
            {editingId && (
              <button
                onClick={() => { onDelete(editingId); handleClose(); }}
                className="p-1.5 rounded-lg bg-destructive/20 text-destructive text-xs px-3"
              >
                Elimina
              </button>
            )}
            <button onClick={handleClose} className="p-1.5 rounded-lg bg-secondary"><X size={16} /></button>
          </div>
        </div>

        <div className="space-y-3">
          <input
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Titolo attività"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <select
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
            value={form.day}
            onChange={(e) => setForm((p) => ({ ...p, day: e.target.value }))}
          >
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Inizio (24h)</label>
              <input
                type="time"
                lang="it"
                step="60"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground/80 outline-none focus:ring-2 focus:ring-primary/50"
                value={form.hour}
                onChange={(e) => setForm((p) => ({ ...p, hour: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Fine (24h)</label>
              <input
                type="time"
                lang="it"
                step="60"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground/80 outline-none focus:ring-2 focus:ring-primary/50"
                value={form.end_hour}
                onChange={(e) => setForm((p) => ({ ...p, end_hour: e.target.value }))}
              />
            </div>
          </div>

          {/* Category selector */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Categoria</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setForm((p) => ({ ...p, category: '' }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!form.category ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
              >
                Nessuna
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setForm((p) => ({ ...p, category: cat.name, color: cat.color }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${form.category === cat.name ? 'text-white' : 'bg-secondary text-muted-foreground'}`}
                  style={form.category === cat.name ? { backgroundColor: cat.color } : {}}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </button>
              ))}
              <button
                onClick={() => { handleClose(); onOpenCategoryMgr(); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground flex items-center gap-1"
              >
                <Plus size={10} /> Nuova
              </button>
            </div>
          </div>

          {/* Color (only if no category) */}
          {!form.category && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Colore</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                    className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold mt-2 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70' : ''}`}
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {editingId ? 'Salva modifiche' : 'Aggiungi'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
