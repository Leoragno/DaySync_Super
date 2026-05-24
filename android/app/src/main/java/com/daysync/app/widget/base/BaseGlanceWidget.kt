package com.daysync.app.widget.base

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.updateAll
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
import androidx.glance.layout.Alignment
import androidx.compose.runtime.Composable
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

    /**
     * Subclass provides the UI for the current [data] snapshot.
     */
    @Composable
    abstract fun Content(context: Context, data: T)

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            // In a real app, you might want to use collectAsState or similar if you had a snapshot-based state.
            // For simplicity in Glance 1.0.0, we just collect the first available or the current value.
            // Note: Continuous collection inside provideContent is tricky in Glance.
            // Usually we trigger updateAll/update from the receiver when data changes.
            val data = repoFlow.value
            Content(context, data)
        }
    }
}
