import { useState, useEffect, useMemo } from 'react';
import { X, Tag, Pin } from 'lucide-react';
import { motion } from 'framer-motion';
import { COLORS, NOTE_STATUSES, DEFAULT_NOTE } from '@/lib/constants';

export default function NoteForm({
  open,
  onClose,
  initial,
  editingId,
  onSave,
  allTags,
  sharedCategories = [],
}) {
  const [form, setForm] = useState(DEFAULT_NOTE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { extraTags, sharedByName } = useMemo(() => {
    const names = new Set((sharedCategories || []).map((c) => c.name));
    const extra = [...new Set((allTags || []).filter((t) => t && !names.has(t)))];
    const byName = Object.fromEntries((sharedCategories || []).map((c) => [c.name, c]));
    return { extraTags: extra, sharedByName: byName };
  }, [allTags, sharedCategories]);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...DEFAULT_NOTE, ...initial } : { ...DEFAULT_NOTE });
    } else {
      setForm({ ...DEFAULT_NOTE });
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.title?.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave({
        title: form.title.trim(),
        content: form.content || '',
        color: form.color,
        category: form.category || '',
        pinned: form.pinned,
        status: form.status,
      });
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
      className="fixed inset-0 z-50 bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="absolute bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-card rounded-t-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-6 pb-0">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold">{editingId ? 'Modifica appunto' : 'Nuovo appunto'}</h3>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-secondary">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Titolo"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
            <textarea
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 resize-none h-28"
              placeholder="Contenuto..."
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            />

            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, pinned: !p.pinned }))}
              className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                form.pinned ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <Pin size={16} className={form.pinned ? 'fill-primary/30' : ''} />
                Appunta in alto
              </span>
              <span className="text-xs font-bold uppercase">{form.pinned ? 'Sì' : 'No'}</span>
            </button>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Stato</p>
              <div className="flex gap-2">
                {NOTE_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, status: s.value }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                      form.status === s.value ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Categoria</p>
              <input
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Tag o nome categoria (anche nuovo)"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              />
              {(sharedCategories.length > 0 || extraTags.length > 0) && (
                <div className="flex gap-2 flex-wrap mt-2">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, category: '' }))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      !form.category ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    Nessuna
                  </button>
                  {sharedCategories.map((cat) => (
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
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        form.category === cat.name ? 'text-white' : 'bg-secondary text-muted-foreground'
                      }`}
                      style={form.category === cat.name ? { backgroundColor: cat.color } : {}}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </button>
                  ))}
                  {extraTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          category: p.category === tag ? '' : tag,
                          ...(sharedByName[tag]?.color ? { color: sharedByName[tag].color } : {}),
                        }))
                      }
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        form.category === tag ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <Tag size={9} />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {COLORS.slice(0, 7).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    form.color === c ? 'scale-125 ring-2 ring-white' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 pt-4" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className={`w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-70' : ''
            }`}
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {editingId ? 'Salva modifiche' : 'Salva'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
