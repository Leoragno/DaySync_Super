import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Clock, Smartphone, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { checkPermission, requestPermission } from '@/lib/notifications';
import { getNotificationSettings, saveNotificationSettings } from '@/lib/notificationSettings';
import { syncDailyReminders } from '@/lib/dailyReminders';
import { useToast } from '@/hooks/use-toast';

function pad2(n) {
  return String(n).padStart(2, '0');
}

export default function Notifiche() {
  const { toast } = useToast();
  const [granted, setGranted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => getNotificationSettings());

  useEffect(() => {
    checkPermission().then(setGranted);
  }, []);

  const reload = () => setForm(getNotificationSettings());

  useEffect(() => {
    const h = () => reload();
    window.addEventListener('daysync-notification-settings', h);
    return () => window.removeEventListener('daysync-notification-settings', h);
  }, []);

  const apply = async () => {
    setBusy(true);
    try {
      saveNotificationSettings(form);
      await syncDailyReminders();
      const ok = await checkPermission();
      setGranted(ok);
      toast({ title: 'Impostazioni salvate', description: 'I promemoria giornalieri sono stati aggiornati.' });
    } catch (e) {
      toast({
        title: 'Salvataggio non riuscito',
        description: e?.message || 'Riprova tra poco.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const askPerm = async () => {
    const ok = await requestPermission();
    setGranted(ok);
    if (ok) await syncDailyReminders();
  };

  return (
    <div className="px-5 py-6 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-xl bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Notifiche</h1>
          <p className="text-xs text-muted-foreground">Promemoria giornalieri e suoni</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass border border-white/5 rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-start gap-3">
          <Smartphone className="text-primary shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-muted-foreground leading-relaxed">
            I promemoria ricorrenti usano le notifiche locali su dispositivo (Capacitor). Sul browser le
            notifiche dipendono dal supporto del sistema.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Permesso notifiche</span>
          <span className={`text-xs font-bold uppercase ${granted ? 'text-emerald-500' : 'text-amber-500'}`}>
            {granted ? 'Concesso' : 'Non concesso'}
          </span>
        </div>
        {!granted && (
          <button
            type="button"
            onClick={askPerm}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            Richiedi permesso
          </button>
        )}
      </motion.div>

      <section className="space-y-3">
        <h2 className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
          <Bell size={12} />
          Promemoria mattutino
        </h2>
        <div className="bg-secondary/60 rounded-2xl p-4 space-y-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-sm">Attiva</span>
            <input
              type="checkbox"
              className="w-10 h-6 accent-primary rounded-lg"
              checked={form.dailyMorningEnabled}
              onChange={(e) => setForm((p) => ({ ...p, dailyMorningEnabled: e.target.checked }))}
            />
          </label>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground shrink-0" />
            <input
              type="time"
              lang="it"
              step={60}
              disabled={!form.dailyMorningEnabled}
              className="flex-1 bg-background/80 rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-50"
              value={`${pad2(form.morningHour)}:${pad2(form.morningMinute)}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                setForm((p) => ({ ...p, morningHour: h || 0, morningMinute: m || 0 }));
              }}
            />
          </div>
          <input
            className="w-full bg-background/80 rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Titolo"
            disabled={!form.dailyMorningEnabled}
            value={form.morningTitle}
            onChange={(e) => setForm((p) => ({ ...p, morningTitle: e.target.value }))}
          />
          <textarea
            className="w-full bg-background/80 rounded-xl px-3 py-2 text-sm outline-none resize-none h-16 placeholder:text-muted-foreground"
            placeholder="Messaggio"
            disabled={!form.dailyMorningEnabled}
            value={form.morningBody}
            onChange={(e) => setForm((p) => ({ ...p, morningBody: e.target.value }))}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
          <Bell size={12} />
          Promemoria serale
        </h2>
        <div className="bg-secondary/60 rounded-2xl p-4 space-y-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-sm">Attiva</span>
            <input
              type="checkbox"
              className="w-10 h-6 accent-primary rounded-lg"
              checked={form.dailyEveningEnabled}
              onChange={(e) => setForm((p) => ({ ...p, dailyEveningEnabled: e.target.checked }))}
            />
          </label>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground shrink-0" />
            <input
              type="time"
              lang="it"
              step={60}
              disabled={!form.dailyEveningEnabled}
              className="flex-1 bg-background/80 rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-50"
              value={`${pad2(form.eveningHour)}:${pad2(form.eveningMinute)}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                setForm((p) => ({ ...p, eveningHour: h || 0, eveningMinute: m || 0 }));
              }}
            />
          </div>
          <input
            className="w-full bg-background/80 rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Titolo"
            disabled={!form.dailyEveningEnabled}
            value={form.eveningTitle}
            onChange={(e) => setForm((p) => ({ ...p, eveningTitle: e.target.value }))}
          />
          <textarea
            className="w-full bg-background/80 rounded-xl px-3 py-2 text-sm outline-none resize-none h-16 placeholder:text-muted-foreground"
            placeholder="Messaggio"
            disabled={!form.dailyEveningEnabled}
            value={form.eveningBody}
            onChange={(e) => setForm((p) => ({ ...p, eveningBody: e.target.value }))}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
          <Volume2 size={12} />
          Audio
        </h2>
        <div className="bg-secondary/60 rounded-2xl p-4 space-y-3">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-sm">Suono promemoria giornalieri</span>
            <input
              type="checkbox"
              className="w-10 h-6 accent-primary rounded-lg"
              checked={form.dailySound}
              onChange={(e) => setForm((p) => ({ ...p, dailySound: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-sm">Suono promemoria eventi (Agenda)</span>
            <input
              type="checkbox"
              className="w-10 h-6 accent-primary rounded-lg"
              checked={form.eventSound}
              onChange={(e) => setForm((p) => ({ ...p, eventSound: e.target.checked }))}
            />
          </label>
        </div>
      </section>

      <button
        type="button"
        disabled={busy}
        onClick={apply}
        className="w-full py-3.5 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-60"
      >
        {busy ? 'Salvataggio…' : 'Salva e applica'}
      </button>
    </div>
  );
}
