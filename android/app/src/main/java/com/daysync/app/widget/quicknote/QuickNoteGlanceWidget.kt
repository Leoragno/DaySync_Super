// File: QuickNoteGlanceWidget.kt
package com.daysync.app.widget.quicknote

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.updateAll
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.layout.height
import androidx.glance.layout.width
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.provideContent
import com.daysync.app.data.AppRepository
import com.daysync.app.data.NoteEntity
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first

/**
 * Glance widget that displays pinned quick notes.
 * Supports plain text notes and checklist notes (stored as JSON in checklistJson).
 * The widget observes AppRepository.notes StateFlow for real‑time updates.
 */
class QuickNoteGlanceWidget : GlanceAppWidget() {
    private val notesFlow: StateFlow<List<NoteEntity>> = AppRepository.notes

    @Composable
    private fun Content(context: Context, notes: List<NoteEntity>) {
        Column(modifier = GlanceModifier.fillMaxWidth().padding(8.dp)) {
            Text(text = "Quick Notes", style = TextStyle(fontSize = 18.sp, color = ColorProvider(android.graphics.Color.BLACK)))
            Spacer(GlanceModifier.height(4.dp))
            if (notes.isEmpty()) {
                Text(text = "No notes", style = TextStyle(fontSize = 14.sp, color = ColorProvider(android.graphics.Color.DKGRAY)))
            } else {
                notes.forEach { note ->
                    NoteRow(context, note)
                }
            }
        }
    }

    @Composable
    private fun NoteRow(context: Context, note: NoteEntity) {
        Row(modifier = GlanceModifier.fillMaxWidth().padding(vertical = 2.dp)) {
            // Title
            Text(text = note.title, style = TextStyle(fontSize = 14.sp, color = ColorProvider(android.graphics.Color.BLACK)))
            // If checklist present, show a simple indicator
            if (!note.checklistJson.isNullOrBlank()) {
                Spacer(GlanceModifier.width(4.dp))
                Text(text = "✓", style = TextStyle(fontSize = 14.sp, color = ColorProvider(android.graphics.Color.GREEN)))
            }
        }
    }

    override suspend fun provideGlance(context: Context, id: androidx.glance.GlanceId) {
        provideContent {
            val notes = notesFlow.value
            Content(context, notes)
        }
    }
}

// Receiver for the widget – required to be declared in the manifest.
class QuickNoteGlanceWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget = QuickNoteGlanceWidget()
}
