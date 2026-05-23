import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Grid3X3, List, Pin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes';
import { useCategories } from '@/hooks/useCategories';
import { NOTE_STATUSES } from '@/lib/constants';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import NoteForm from '@/components/notes/NoteForm';
import { useToast } from '@/hooks/use-toast';

export default function Appunti() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { data: notes, isLoading } = useNotes();
  const { data: sharedCategories = [] } = useCategories();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const mergedFilterTags = useMemo(() => {
    const fromSchedule = sharedCategories.map((c) => c.name);
    const fromNotes = notes?.map((n) => n.category).filter(Boolean) || [];
    return [...new Set([...fromSchedule, ...fromNotes])];
  }, [notes, sharedCategories]);

  const filtered = useMemo(() => {
    if (!notes) return [];
    let result = [...notes];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q),
      );
    }
    if (filterTag) result = result.filter((n) => n.category === filterTag);
    return result.sort((a, b) => {
      const pin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      if (pin !== 0) return pin;
      const da = new Date(a.updated_at || a.created_at || 0).getTime();
      const db = new Date(b.updated_at || b.created_at || 0).getTime();
      return db - da;
    });
  }, [notes, search, filterTag]);

  const grouped = useMemo(() => {
    const groups = {};
    NOTE_STATUSES.forEach((s) => {
      groups[s.value] = [];
    });
    filtered.forEach((n) => {
      if (groups[n.status]) groups[n.status].push(n);
    });
    return groups;
  }, [filtered]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(null);
  }, []);

  const openForm = useCallback((note = null) => {
    if (note) {
      setEditingId(note.id);
      setFormData({
        title: note.title,
        content: note.content || '',
        color: note.color,
        category: note.category || '',
        pinned: note.pinned,
        status: note.status,
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
        await updateNote.mutateAsync({ id: editingId, data });
      } else {
        await createNote.mutateAsync(data);
      }
      closeForm();
    } catch (err) {
      toast({
        title: 'Errore durante il salvataggio',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote.mutateAsync(id);
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

  const togglePin = async (e, note) => {
    e.stopPropagation();
    try {
      await updateNote.mutateAsync({ id: note.id, data: { pinned: !note.pinned } });
    } catch (err) {
      toast({
        title: 'Impossibile aggiornare il pin',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="px-5 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Appunti</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode((v) => (v === 'list' ? 'kanban' : 'list'))}
            className="p-2 rounded-xl bg-secondary"
          >
            {viewMode === 'list' ? <Grid3X3 size={16} /> : <List size={16} />}
          </button>
          <button onClick={() => openForm()} className="p-2 rounded-xl bg-primary text-white">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full bg-secondary rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-muted-foreground outline-none"
          placeholder="Cerca appunti..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {mergedFilterTags.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterTag(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              !filterTag ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
            }`}
          >
            Tutti
          </button>
          {mergedFilterTags.map((t) => {
            const colored = sharedCategories.find((c) => c.name === t);
            return (
              <button
                key={t}
                onClick={() => setFilterTag(filterTag === t ? null : t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${
                  filterTag === t ? 'text-white' : 'bg-secondary text-muted-foreground'
                }`}
                style={filterTag === t && colored ? { backgroundColor: colored.color } : {}}
              >
                {colored && <span className="w-2 h-2 rounded-full shrink-0 bg-white/90" />}
                {!colored && <Tag size={10} />}
                {t}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState label={search ? 'Nessun risultato' : 'Nessun appunto'} />
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
                className={`bg-secondary rounded-xl px-4 py-3 active:scale-[0.98] transition-all cursor-pointer ${
                  expandedId === note.id ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-1 h-full min-h-[2rem] rounded-full mt-0.5"
                    style={{ backgroundColor: note.color || '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-semibold flex items-center gap-1.5 min-w-0">
                      {note.pinned && (
                        <Pin size={12} className="text-primary shrink-0 fill-primary/25" aria-hidden />
                      )}
                      <span className="truncate">{note.title}</span>
                    </p>
                    {note.content && (
                      <div
                        className={`text-xs text-muted-foreground mt-1 ${
                          expandedId === note.id ? '' : 'line-clamp-2'
                        }`}
                      >
                        {note.content}
                      </div>
                    )}

                    {expandedId === note.id && (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/20 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openForm(note);
                          }}
                          className="text-[10px] font-bold text-primary uppercase tracking-wider"
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={(e) => togglePin(e, note)}
                          className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                        >
                          {note.pinned ? 'Togli pin' : 'Pin'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(note.id);
                          }}
                          className="text-[10px] font-bold text-destructive uppercase tracking-wider"
                        >
                          Elimina
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1.5">
                      {note.category && (
                        <span className="text-[10px] bg-background px-2 py-0.5 rounded-full text-muted-foreground">
                          {note.category}
                        </span>
                      )}
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${
                            NOTE_STATUSES.find((s) => s.value === note.status)?.color || '#6366f1'
                          }22`,
                          color: NOTE_STATUSES.find((s) => s.value === note.status)?.color,
                        }}
                      >
                        {NOTE_STATUSES.find((s) => s.value === note.status)?.label}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => togglePin(e, note)}
                    className={`p-2 rounded-lg shrink-0 transition-colors ${
                      note.pinned ? 'bg-primary/15 text-primary' : 'bg-background/50 text-muted-foreground'
                    }`}
                    aria-label={note.pinned ? 'Togli pin' : 'Appunta'}
                  >
                    <Pin size={14} className={note.pinned ? 'fill-primary/25' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(expandedId === note.id ? null : note.id);
                    }}
                    className="p-1.5 rounded-lg bg-background/50 text-muted-foreground transition-colors shrink-0"
                  >
                    <motion.div animate={{ rotate: expandedId === note.id ? 180 : 0 }}>
                      <Plus size={13} />
                    </motion.div>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide max-w-full" style={{ minHeight: '50vh' }}>
          {NOTE_STATUSES.map((status) => (
            <div key={status.value} className="w-[min(260px,78vw)] shrink-0 flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{status.label}</h3>
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground">
                  {grouped[status.value]?.length || 0}
                </span>
              </div>
              <div className="space-y-2 min-w-0">
                {(grouped[status.value] || []).map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    onClick={() => openForm(note)}
                    className="bg-secondary rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-transform overflow-hidden max-w-full"
                  >
                    <div className="flex items-center gap-2 mb-1 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: note.color || '#6366f1' }}
                      />
                      <p className="text-sm font-semibold truncate min-w-0 flex-1">{note.title}</p>
                      {note.pinned && <Pin size={10} className="text-primary shrink-0 fill-primary/25" />}
                    </div>
                    {note.content && (
                      <p className="text-xs text-muted-foreground line-clamp-3 break-words">{note.content}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteForm
        open={formOpen}
        onClose={closeForm}
        initial={formData}
        editingId={editingId}
        onSave={handleSave}
        allTags={mergedFilterTags}
        sharedCategories={sharedCategories}
      />
    </div>
  );
}
