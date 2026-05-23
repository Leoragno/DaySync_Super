package com.daysync.app.widget.base

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.updateAll
import androidx.glance.appwidget.update
import androidx.glance.appwidget.provideContent
import androidx.glance.unit.ColorProvider
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.layout.height
import androidx.glance.layout.width
import androidx.glance.layout.Arrangement
import androidx.glance.layout.Alignment
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daysync.app.data.AppRepository
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Base class for all Glance widgets in DaySync.
 * It provides a [repo] reference and a helper [launchCollect] to observe StateFlows
 * with a debounce of 300 ms (handled by the repository). Subclass must implement
 * [Content] composable that receives the current data snapshot.
 */
abstract class BaseGlanceWidget<T>(
    private val repoFlow: StateFlow<T>
) : GlanceAppWidget() {
    private val scope = CoroutineScope(Dispatchers.IO)

    /**
     * Subclass provides the UI for the current [data] snapshot.
     */
    @Composable
    abstract fun Content(context: Context, data: T)

    override fun onUpdate(context: Context) {
        scope.launch {
            repoFlow.collectLatest { data ->
                update(context) { Content(context, data) }
            }
        }
    }
}

// Helper extension to simplify widget updates
private fun GlanceAppWidget.update(context: Context, content: @Composable () -> Unit) {
    provideContent { content() }
}
