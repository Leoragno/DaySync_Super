package com.daysync.app.widget.schedule

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
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
import androidx.glance.GlanceTheme
import com.daysync.app.data.AppRepository
import com.daysync.app.widget.base.BaseGlanceWidget
import kotlinx.coroutines.flow.StateFlow
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class ScheduleGlanceWidget : BaseGlanceWidget<List<com.daysync.app.data.TaskEntity>>(AppRepository.tasks) {
    @Composable
    override fun Content(context: Context, data: List<com.daysync.app.data.TaskEntity>) {
        Column(modifier = GlanceModifier.fillMaxWidth().padding(8.dp)) {
            Text(
                text = "Schedule",
                style = TextStyle(fontSize = 18.sp, color = GlanceTheme.colors.onSurface)
            )
            Spacer(GlanceModifier.height(4.dp))
            if (data.isEmpty()) {
                Text(text = "No tasks", style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurfaceVariant))
            } else {
                val upcoming = data.filter { !it.completed }.sortedBy { it.dueTime }.take(3)
                upcoming.forEach { task ->
                    TaskRow(task)
                }
            }
        }
    }

    @Composable
    private fun TaskRow(task: com.daysync.app.data.TaskEntity) {
        val formatter = DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault())
        Row(modifier = GlanceModifier.fillMaxWidth().padding(vertical = 2.dp)) {
            Text(text = formatter.format(Instant.ofEpochMilli(task.dueTime)), style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.primary))
            Spacer(GlanceModifier.width(4.dp))
            Text(text = task.title, style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurface))
        }
    }
}

class ScheduleGlanceWidgetReceiver : androidx.glance.appwidget.GlanceAppWidgetReceiver() {
    override val glanceAppWidget = ScheduleGlanceWidget()
}
