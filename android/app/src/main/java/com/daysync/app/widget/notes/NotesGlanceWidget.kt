package com.daysync.app.widget.notes

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceTheme
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.layout.height
import androidx.glance.layout.width
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.dp
import com.daysync.app.data.AppRepository
import com.daysync.app.widget.base.BaseGlanceWidget
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class NotesGlanceWidget : BaseGlanceWidget<List<com.daysync.app.data.NoteEntity>>(AppRepository.notes) {
    @Composable
    override fun Content(context: Context, data: List<com.daysync.app.data.NoteEntity>) {
        Column(modifier = GlanceModifier.fillMaxWidth().padding(8.dp)) {
            Text(
                text = "Appunti",
                style = TextStyle(fontSize = 18.dp, color = GlanceTheme.colors.onSurface)
            )
            Spacer(GlanceModifier.height(4.dp))
            if (data.isEmpty()) {
                Text(text = "Nessun appunto", style = TextStyle(fontSize = 14.dp, color = GlanceTheme.colors.onSurfaceVariant))
            } else {
                data.take(3).forEach { note ->
                    NoteRow(note)
                }
            }
        }
    }

    @Composable
    private fun NoteRow(note: com.daysync.app.data.NoteEntity) {
        Row(modifier = GlanceModifier.fillMaxWidth().padding(vertical = 2.dp)) {
            Text(
                text = note.title,
                style = TextStyle(fontSize = 14.dp, color = GlanceTheme.colors.onSurface)
            )
            Spacer(GlanceModifier.width(4.dp))
            // Show a preview of content or checklist summary
            val preview = note.content?.take(20) ?: ""
            if (preview.isNotEmpty()) {
                Text(text = preview, style = TextStyle(fontSize = 12.dp, color = GlanceTheme.colors.onSurfaceVariant))
            }
        }
    }
}

class NotesGlanceWidgetReceiver : androidx.glance.appwidget.GlanceAppWidgetReceiver() {
    override val glanceAppWidget = NotesGlanceWidget()
}
