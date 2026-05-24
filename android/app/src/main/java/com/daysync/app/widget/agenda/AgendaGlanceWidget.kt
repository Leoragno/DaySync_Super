package com.daysync.app.widget.agenda

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.updateAll
import androidx.glance.appwidget.provideContent
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.layout.height
import androidx.glance.layout.width
import androidx.glance.background
import androidx.glance.GlanceTheme
import androidx.glance.layout.size
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.action.actionParametersOf
import androidx.glance.appwidget.state.getAppWidgetState
import androidx.glance.appwidget.state.updateAppWidgetState
import com.daysync.app.R
import com.daysync.app.data.AppRepository
import kotlinx.coroutines.flow.first
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Glance widget displaying the next few upcoming events.
 * It observes AppRepository.events StateFlow and updates the UI instantly.
 */
class AgendaGlanceWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            Content(context)
        }
    }

    @Composable
    private fun Content(context: Context) {
        // Get the latest events from the repository (already collected in StateFlow)
        // In a real app we'd use collectAsState, but for Glance simplicity:
        val events = AppRepository.events.value
        // Keep only the next three upcoming events
        val now = System.currentTimeMillis()
        val upcoming = events.filter { it.startTime >= now }.sortedBy { it.startTime }.take(3)

        Column(modifier = GlanceModifier.fillMaxWidth().background(GlanceTheme.colors.surface)) {
            Text(
                text = "Agenda",
                style = TextStyle(fontSize = 18.sp, color = GlanceTheme.colors.onSurface),
                modifier = GlanceModifier.padding(8.dp)
            )
            Spacer(GlanceModifier.height(4.dp))
            if (upcoming.isEmpty()) {
                Text(
                    text = "No upcoming events",
                    style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurfaceVariant),
                    modifier = GlanceModifier.padding(horizontal = 8.dp)
                )
            } else {
                upcoming.forEach { event ->
                    EventRow(context, event)
                }
            }
        }
    }

    @Composable
    private fun EventRow(context: Context, event: com.daysync.app.data.EventEntity) {
        val formatter = DateTimeFormatter.ofPattern("HH:mm")
            .withZone(ZoneId.systemDefault())
        Row(
            modifier = GlanceModifier.fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp)
                .clickable(actionStartActivity<com.daysync.app.MainActivity>(
                    actionParametersOf()
                ))
        ) {
            Text(
                text = formatter.format(Instant.ofEpochMilli(event.startTime)),
                style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.primary)
            )
            Spacer(GlanceModifier.width(8.dp))
            Text(
                text = event.title,
                style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurface)
            )
        }
    }

    private fun eventDetailIntent(context: Context, eventId: Long) = android.content.Intent(context, com.daysync.app.MainActivity::class.java).apply {
        putExtra("EVENT_ID", eventId)
        flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
    }
}

// Optional receiver – you can register this in the manifest instead of the default GlanceAppWidgetReceiver.
class AgendaGlanceWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget = AgendaGlanceWidget()
}
