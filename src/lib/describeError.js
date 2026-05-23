/**
 * Short Italian copy for toast / UI from Supabase, EntityError, or network failures.
 */
export function describeError(err, fallbackTitle = 'Operazione non riuscita') {
  if (err == null) {
    return {
      title: fallbackTitle,
      description: 'Si è verificato un errore imprevisto. Riprova.',
    };
  }

  const code = err.code;
  const raw = String(err.message || err.details || err.hint || '');
  const msg = raw.toLowerCase();

  if (code === 'PGRST116' || /contains 0 rows|0 rows/.test(msg)) {
    return {
      title: 'Elemento non trovato',
      description:
        'Non è stato possibile applicare la modifica. Aggiorna l’elenco o verifica di essere ancora connesso.',
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      title: 'Nessuna connessione',
      description: 'Sembri offline. Controlla la rete e riprova.',
    };
  }

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) {
    return {
      title: 'Connessione non riuscita',
      description: 'Impossibile contattare il server. Verifica la rete e riprova tra poco.',
    };
  }

  if (/permission denied|row-level security|\brls\b/i.test(msg)) {
    return {
      title: 'Accesso negato',
      description: 'Non puoi modificare questo dato. Prova a uscire e accedere di nuovo.',
    };
  }

  if (code === '22P02' || /invalid.*uuid/i.test(msg)) {
    return {
      title: 'Dato non valido',
      description: 'L’elemento non è più valido. Chiudi questa schermata e riprova.',
    };
  }

  if (code === '23505' || /unique constraint|duplicate key/i.test(msg)) {
    return {
      title: 'Già esistente',
      description: 'Esiste già un record uguale. Modifica i dati e riprova.',
    };
  }

  if (/schema cache|could not find ['"]?\w+['"]? column|column .* does not exist/i.test(raw)) {
    return {
      title: 'Database non aggiornato',
      description:
        'Manca una colonna sul server (es. completed per gli eventi). Apri Supabase → SQL Editor ed esegui lo script in supabase/patch_events_completed.sql, poi riprova.',
    };
  }

  // Prefer Postgres message after our EntityError prefix
  const postgresDetail = raw.replace(/^Failed to \w+ \w+(?:\/[^:\s]+)?:\s*/i, '').trim();
  return {
    title: fallbackTitle,
    description: postgresDetail || raw || 'Riprova tra poco.',
  };
}
