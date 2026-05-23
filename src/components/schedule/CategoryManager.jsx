import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { COLORS } from '@/lib/constants';

/**
 * Bottom-sheet modal for managing categories (create & delete).
 */
export default function CategoryManager({
  open, onClose, categories,
  onCreate, onDelete,
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), color });
    setName('');
    setColor('#6366f1');
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-md mx-auto bg-card rounded-t-2xl p-6 pb-10 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Gestisci categorie</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-secondary"><X size={16} /></button>
        </div>

        {/* Create new category */}
        <div className="bg-secondary rounded-xl p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-3 font-medium">Nuova categoria</p>
          <input
            className="w-full bg-background rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 mb-3"
            placeholder="Nome categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap mb-3">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={handleCreate}
            className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold"
          >
            Crea categoria
          </button>
        </div>

        {/* Existing categories */}
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nessuna categoria creata</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                </div>
                <button
                  onClick={() => onDelete(cat.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
