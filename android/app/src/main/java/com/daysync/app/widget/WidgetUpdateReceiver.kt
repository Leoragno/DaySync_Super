package com.daysync.app.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import com.daysync.app.widget.agenda.AgendaGlanceWidget
import com.daysync.app.widget.schedule.ScheduleGlanceWidget
import com.daysync.app.widget.notes.NotesGlanceWidget
import com.daysync.app.widget.quicknote.QuickNoteGlanceWidget
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Receives app‑wide data‑change broadcasts and triggers an immediate refresh of all widgets.
 * The app should send an intent with action "com.daysync.ACTION_DATA_CHANGED" whenever
 * events, notes or tasks are inserted/updated/deleted.
 */
class WidgetUpdateReceiver : BroadcastReceiver() {
    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onReceive(context: Context, intent: Intent?) {
        // Guard against null
        if (intent?.action != "com.daysync.ACTION_DATA_CHANGED") return
        // Update each widget type
        scope.launch {
            AgendaGlanceWidget().updateAll(context)
            ScheduleGlanceWidget().updateAll(context)
            NotesGlanceWidget().updateAll(context)
            QuickNoteGlanceWidget().updateAll(context)
        }
    }
}
