import { useState, useEffect } from 'react';
import { X, Bell, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { COLORS, EVENT_TYPES, REMINDER_OPTIONS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { describeError } from '@/lib/describeError';

function buildDefaultEvent(dateOverride) {
  return {
    title: '',
    description: '',
    date: dateOverride || format(new Date(), 'yyyy-MM-dd'),
    time: '',
    end_time: '',
    type: 'impegno',
    category: '',
    color: '#6366f1',
    reminder_minutes: 30,
  };
}

/**
 * Bottom-sheet form for creating/editing agenda events.
 */
export default function EventForm({
  open,
  onClose,
  initial,
  editingId,
  onSave,
  onDelete,
  notifGranted,
  onEnableNotifications,
  categories = [],
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => buildDefaultEvent());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...buildDefaultEvent(), ...initial } : buildDefaultEvent());
    } else {
      setForm(buildDefaultEvent());
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.title?.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description?.trim() || null,
        date: form.date,
        time: form.time || null,
        end_time: form.end_time || null,
        type: form.type,
        category: form.category || null,
        color: form.color,
        reminder_minutes: form.reminder_minutes,
      });
    } catch (err) {
      const { title, description } = describeError(err, 'Salvataggio non riuscito');
      toast({ title, description, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onDelete(editingId);
    } catch (err) {
      const { title, description } = describeError(err, 'Eliminazione non riuscita');
      toast({ title, description, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-md mx-auto bg-card rounded-t-2xl p-6 pb-10 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">
            {editingId ? 'Modifica evento' : 'Nuovo evento'}
          </h3>
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs font-semibold disabled:opacity-50"
              >
                Elimina
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <input
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Titolo evento"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />

          <textarea
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[88px]"
            placeholder="Descrizione dettagliata (opzionale)"
            value={form.description || ''}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />

          <div className="space-y-1">
            <input
              type="date"
              lang="it"
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
            <p className="text-[10px] text-primary/70 px-1 font-medium capitalize">
              {form.date
                ? format(new Date(`${form.date}T12:00:00`), 'EEEE d MMMM yyyy', { locale: it })
                : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Ora inizio (24h)</label>
              <input
                type="time"
                lang="it"
                step="60"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground/85 outline-none focus:ring-2 focus:ring-primary/50"
                value={form.time || ''}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Ora fine (24h)</label>
              <input
                type="time"
                lang="it"
                step="60"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground/85 outline-none focus:ring-2 focus:ring-primary/50"
                value={form.end_time || ''}
                onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
              />
            </div>
          </div>

          <select
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Categoria</label>
            <input
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Nome categoria (anche nuovo)"
              value={form.category || ''}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            />
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, category: '' }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    !form.category ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  Nessuna
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        category: p.category === cat.name ? '' : cat.name,
                        color: p.category === cat.name ? p.color : cat.color || p.color,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      form.category === cat.name ? 'text-white' : 'bg-secondary text-muted-foreground'
                    }`}
                    style={form.category === cat.name ? { backgroundColor: cat.color } : {}}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            <Link
              to="/Orario"
              className="inline-flex items-center gap-1 mt-2 text-[11px] text-primary font-semibold underline-offset-2 hover:underline"
            >
              <Plus size={11} strokeWidth={2.5} />
              Categorie da Orario
            </Link>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Bell size={12} /> Preavviso notifica
            </label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, reminder_minutes: opt.value }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.reminder_minutes === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, reminder_minutes: 0 }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  form.reminder_minutes === 0
                    ? 'bg-destructive/80 text-white'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                Nessuno
              </button>
            </div>
            {!notifGranted && form.reminder_minutes > 0 && (
              <button
                type="button"
                onClick={onEnableNotifications}
                className="mt-2 text-xs text-primary underline"
              >
                Abilita notifiche per ricevere il promemoria →
              </button>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Colore</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.slice(0, 7).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className={`w-full bg-primary text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70' : ''}`}
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {editingId ? 'Salva modifiche' : 'Aggiungi evento'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
