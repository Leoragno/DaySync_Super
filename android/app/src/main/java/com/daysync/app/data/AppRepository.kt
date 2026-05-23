package com.daysync.app.data

import android.content.Context
import android.content.Intent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

object AppRepository {
    private lateinit var db: AppDatabase
    private val scope = CoroutineScope(Dispatchers.IO)

    private val _events = MutableStateFlow<List<EventEntity>>(emptyList())
    val events: StateFlow<List<EventEntity>> get() = _events

    private val _notes = MutableStateFlow<List<NoteEntity>>(emptyList())
    val notes: StateFlow<List<NoteEntity>> get() = _notes

    private val _tasks = MutableStateFlow<List<TaskEntity>>(emptyList())
    val tasks: StateFlow<List<TaskEntity>> get() = _tasks

    /**
     * Initialise the repository with the Room database instance and the application context.
     * It starts collecting DAO flows and forwards them to the mutable StateFlows. Additionally,
     * any change in the flows triggers a broadcast so that Glance widgets can refresh instantly.
     */
    fun init(context: Context, database: AppDatabase) {
        db = database
        // Forward DAO flows to StateFlows
        scope.launch {
            db.eventDao().getAllEvents().collectLatest { _events.value = it }
        }
        scope.launch {
            db.noteDao().getPinnedNotes().collectLatest { _notes.value = it }
        }
        scope.launch {
            db.taskDao().getAllTasks().collectLatest { _tasks.value = it }
        }
        // Broadcast on any data change to trigger widget updates
        val broadcastAction = "com.daysync.ACTION_DATA_CHANGED"
        scope.launch {
            _events.collect { context.sendBroadcast(Intent(broadcastAction)) }
        }
        scope.launch {
            _notes.collect { context.sendBroadcast(Intent(broadcastAction)) }
        }
        scope.launch {
            _tasks.collect { context.sendBroadcast(Intent(broadcastAction)) }
        }
    }

    // ------- CRUD helpers used by the UI and widgets --------
    suspend fun insertEvent(event: EventEntity) = db.eventDao().insert(event)
    suspend fun updateEvent(event: EventEntity) = db.eventDao().update(event)
    suspend fun deleteEvent(event: EventEntity) = db.eventDao().delete(event)

    suspend fun insertNote(note: NoteEntity) = db.noteDao().insert(note)
    suspend fun updateNote(note: NoteEntity) = db.noteDao().update(note)
    suspend fun deleteNote(note: NoteEntity) = db.noteDao().delete(note)

    suspend fun insertTask(task: TaskEntity) = db.taskDao().insert(task)
    suspend fun updateTask(task: TaskEntity) = db.taskDao().update(task)
    suspend fun deleteTask(task: TaskEntity) = db.taskDao().delete(task)
}
