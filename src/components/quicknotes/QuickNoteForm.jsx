import { useState, useEffect } from 'react';
import { X, Pin } from 'lucide-react';
import { motion } from 'framer-motion';
import { NAMED_COLORS, DEFAULT_QUICK_NOTE } from '@/lib/constants';

export default function QuickNoteForm({ open, onClose, initial, editingId, onSave, onDelete }) {
  const [form, setForm] = useState(DEFAULT_QUICK_NOTE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...DEFAULT_QUICK_NOTE, ...initial } : { ...DEFAULT_QUICK_NOTE });
    } else {
      setForm({ ...DEFAULT_QUICK_NOTE });
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave({ content: form.content.trim(), color: form.color, pinned: Boolean(form.pinned) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onDelete(editingId);
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
        className="w-full max-w-md mx-auto bg-card rounded-t-2xl p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{editingId ? 'Modifica nota' : 'Nuova nota rapida'}</h3>
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
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-secondary">
              <X size={16} />
            </button>
          </div>
        </div>

        <textarea
          className="w-full bg-secondary rounded-xl px-4 py-3 text-sm placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 resize-none h-32 mb-3"
          placeholder="Scrivi una nota..."
          value={form.content}
          onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
          autoFocus
        />

        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, pinned: !p.pinned }))}
          className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-3 text-sm transition-colors ${
            form.pinned ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
          }`}
        >
          <span className="flex items-center gap-2 font-medium">
            <Pin size={16} className={form.pinned ? 'fill-primary/30' : ''} />
            Appunta in alto
          </span>
          <span className="text-xs font-bold uppercase">{form.pinned ? 'Sì' : 'No'}</span>
        </button>

        <div className="flex gap-2 mb-4">
          {NAMED_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => setForm((p) => ({ ...p, color: c.hex }))}
              className={`w-7 h-7 rounded-full transition-transform ${form.color === c.hex ? 'scale-125 ring-2 ring-white' : ''}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className={`w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70' : ''}`}
        >
          {isSubmitting && (
            <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" role="status" />
          )}
          {editingId ? 'Salva' : 'Aggiungi'}
        </button>
      </motion.div>
    </motion.div>
  );
}
