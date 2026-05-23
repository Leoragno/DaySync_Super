import { useMemo, useState, useCallback } from 'react';
import { Plus, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useQuickNotes, useCreateQuickNote, useUpdateQuickNote, useDeleteQuickNote } from '@/hooks/useQuickNotes';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import QuickNoteForm from '@/components/quicknotes/QuickNoteForm';
import { useToast } from '@/hooks/use-toast';

export default function Note() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);

  const { data: quickNotes, isLoading } = useQuickNotes();
  const createQN = useCreateQuickNote();
  const updateQN = useUpdateQuickNote();
  const deleteQN = useDeleteQuickNote();

  const sortedNotes = useMemo(() => {
    if (!quickNotes) return [];
    return [...quickNotes].sort((a, b) => {
      const pinDiff = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      if (pinDiff !== 0) return pinDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [quickNotes]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(null);
  }, []);

  const openForm = useCallback((note = null) => {
    if (note) {
      setEditingId(note.id);
      setFormData({
        content: note.content,
        color: note.color || '#6366f1',
        pinned: Boolean(note.pinned),
      });
    } else {
      setEditingId(null);
      setFormData(null);
    }
    setFormOpen(true);
  }, []);

  const handleSave = async (data) => {
    try {
      if (editingId) {
        await updateQN.mutateAsync({ id: editingId, data });
      } else {
        await createQN.mutateAsync(data);
      }
      closeForm();
    } catch (err) {
      toast({
        title: 'Errore durante il salvataggio',
        description: err.message || 'Si è verificato un errore.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteQN.mutateAsync(id);
      closeForm();
    } catch (err) {
      toast({
        title: "Errore durante l'eliminazione",
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="px-5 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Note rapide</h1>
        <button onClick={() => openForm()} className="p-2 rounded-xl bg-primary text-white">
          <Plus size={16} />
        </button>
      </div>

      {!quickNotes || quickNotes.length === 0 ? (
        <EmptyState label="Nessuna nota rapida — Tocca + per crearne una" />
      ) : (
        <div className="columns-2 gap-3 space-y-3">
          <AnimatePresence>
            {sortedNotes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => openForm(note)}
                className="break-inside-avoid rounded-2xl p-4 cursor-pointer active:scale-[0.97] transition-transform relative"
                style={{ backgroundColor: `${note.color || '#6366f1'}15` }}
              >
                {note.pinned && (
                  <Pin
                    size={13}
                    className="absolute top-3 right-3 text-primary fill-primary/20"
                    aria-label="Appuntata"
                  />
                )}
                <p
                  className="text-sm leading-relaxed whitespace-pre-wrap pr-5"
                  style={{ color: note.color || '#6366f1' }}
                >
                  {note.content}
                </p>
                {note.created_at && (
                  <p className="text-[10px] mt-2 opacity-50" style={{ color: note.color || '#6366f1' }}>
                    {new Date(note.created_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <QuickNoteForm
        open={formOpen}
        onClose={closeForm}
        initial={formData}
        editingId={editingId}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
