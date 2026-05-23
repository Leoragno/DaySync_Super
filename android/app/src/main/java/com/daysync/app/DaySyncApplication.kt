package com.daysync.app

import android.app.Application
import com.daysync.app.data.AppDatabase
import com.daysync.app.data.AppRepository
import androidx.room.Room

class DaySyncApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialise Room database
        val db = Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            "daysync-db"
        ).fallbackToDestructiveMigration().build()
        // Initialise repository singleton
        AppRepository.init(db)
    }
}
