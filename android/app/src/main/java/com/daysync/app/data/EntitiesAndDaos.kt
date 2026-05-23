package com.daysync.app.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

/**
 * Entity representing a calendar event.
 */
@Entity(tableName = "events")
data class EventEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val description: String?,
    val startTime: Long, // epoch millis
    val endTime: Long,
    val colorKey: Int?,
    val lastModified: Long = System.currentTimeMillis()
)

/**
 * Entity representing a note (pinable, checklist capable).
 * For checklist items we store a JSON string of items (id,text,checked).
 */
@Entity(tableName = "notes")
data class NoteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val content: String?, // plain text for quick notes
    val checklistJson: String?, // JSON array of checklist items
    val pinned: Boolean = false,
    val lastModified: Long = System.currentTimeMillis()
)

/**
 * Entity representing a scheduled task (used by schedule widget).
 */
@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val dueTime: Long,
    val completed: Boolean = false,
    val lastModified: Long = System.currentTimeMillis()
)

/**
 * DAO for events.
 */
@Dao
interface EventDao {
    @Query("SELECT * FROM events ORDER BY startTime ASC")
    fun getAllEvents(): Flow<List<EventEntity>>

    @Query("SELECT * FROM events WHERE id = :eventId LIMIT 1")
    suspend fun getEventById(eventId: Long): EventEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(event: EventEntity): Long

    @Update
    suspend fun update(event: EventEntity)

    @Delete
    suspend fun delete(event: EventEntity)
}

/**
 * DAO for notes.
 */
@Dao
interface NoteDao {
    @Query("SELECT * FROM notes WHERE pinned = 1 ORDER BY lastModified DESC")
    fun getPinnedNotes(): Flow<List<NoteEntity>>

    @Query("SELECT * FROM notes ORDER BY lastModified DESC")
    fun getAllNotes(): Flow<List<NoteEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(note: NoteEntity): Long

    @Update
    suspend fun update(note: NoteEntity)

    @Delete
    suspend fun delete(note: NoteEntity)
}

/**
 * DAO for tasks.
 */
@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY dueTime ASC")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(task: TaskEntity): Long

    @Update
    suspend fun update(task: TaskEntity)

    @Delete
    suspend fun delete(task: TaskEntity)
}
