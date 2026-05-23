package com.daysync.app;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * NotificationActionReceiver - Handles background notification actions.
 * Processes quick action buttons (Completa, Posticipa) instantly in the background without launching the UI.
 * Integrates directly with Capacitor Storage SharedPreferences and handles snooze AlarmManager exact alarms.
 */
public class NotificationActionReceiver extends BroadcastReceiver {
    private static final String TAG = "DaySyncActionReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }

        String action = intent.getAction();
        String eventId = intent.getStringExtra("eventId");
        int notificationId = intent.getIntExtra("notificationId", 0);

        if (eventId == null || eventId.isEmpty()) {
            Log.e(TAG, "Background action received without eventId");
            return;
        }

        Log.i(TAG, "Received background action: " + action + " for event: " + eventId);

        // Cancel the displayed notification immediately for a snappy user experience
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null && notificationId != 0) {
            notificationManager.cancel(notificationId);
            Log.d(TAG, "Dismissed notification ID: " + notificationId);
        }

        if ("com.daysync.app.ACTION_COMPLETE".equals(action)) {
            handleComplete(context, eventId);
        } else if ("com.daysync.app.ACTION_SNOOZE".equals(action)) {
            int snoozeMinutes = intent.getIntExtra("snoozeMinutes", 10);
            
            // Extract other event metadata needed to build the snoozed alarm notification later
            String title = intent.getStringExtra("title");
            String description = intent.getStringExtra("description");
            String color = intent.getStringExtra("color");
            String category = intent.getStringExtra("category");
            String type = intent.getStringExtra("type");
            String dateStr = intent.getStringExtra("date");
            String timeStr = intent.getStringExtra("time");

            handleSnooze(context, eventId, snoozeMinutes, title, description, color, category, type, dateStr, timeStr);
        }
    }

    /**
     * Marks the event as completed locally in Capacitor preferences and appends it to the sync queue.
     */
    private void handleComplete(Context context, String eventId) {
        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        
        // 1. Mark as completed in the event cache
        String eventsJson = prefs.getString("daysync_cache_events", null);
        if (eventsJson != null && !eventsJson.isEmpty()) {
            try {
                JSONArray eventsArray = new JSONArray(eventsJson);
                boolean modified = false;
                for (int i = 0; i < eventsArray.length(); i++) {
                    JSONObject eventObj = eventsArray.getJSONObject(i);
                    if (eventId.equals(eventObj.optString("id"))) {
                        eventObj.put("completed", true);
                        modified = true;
                        break;
                    }
                }
                if (modified) {
                    prefs.edit().putString("daysync_cache_events", eventsArray.toString()).apply();
                    Log.d(TAG, "Marked event completed in local cache");
                }
            } catch (JSONException e) {
                Log.e(TAG, "Error updating event cache in SharedPreferences", e);
            }
        }

        // 2. Add to background completed queue for syncing to Supabase on next app open
        String queueJson = prefs.getString("daysync_background_completed_queue", "[]");
        try {
            JSONArray queueArray = new JSONArray(queueJson);
            
            // Prevent duplicate entries in the queue
            boolean alreadyQueued = false;
            for (int i = 0; i < queueArray.length(); i++) {
                if (eventId.equals(queueArray.getString(i))) {
                    alreadyQueued = true;
                    break;
                }
            }

            if (!alreadyQueued) {
                queueArray.put(eventId);
                prefs.edit().putString("daysync_background_completed_queue", queueArray.toString()).apply();
                Log.d(TAG, "Added event ID " + eventId + " to background completed sync queue");
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error writing to background completed queue", e);
        }
    }

    /**
     * Schedules a new exact alarm in the future (e.g. 10 mins).
     */
    private void handleSnooze(Context context, String eventId, int minutes, String title, String description,
                              String color, String category, String type, String dateStr, String timeStr) {
        
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            Log.e(TAG, "AlarmManager is null. Cannot snooze alarm.");
            return;
        }

        long snoozeTimeMs = System.currentTimeMillis() + (minutes * 60 * 1000);
        int alarmId = NotificationRescheduler.hashStringToInt(eventId);

        Intent receiverIntent = new Intent(context, AlarmReceiver.class);
        receiverIntent.putExtra("eventId", eventId);
        receiverIntent.putExtra("title", title);
        receiverIntent.putExtra("description", description);
        receiverIntent.putExtra("color", color);
        receiverIntent.putExtra("category", category);
        receiverIntent.putExtra("type", type);
        receiverIntent.putExtra("date", dateStr);
        receiverIntent.putExtra("time", timeStr);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, alarmId, receiverIntent, flags);

        // Schedule exact snooze alarm
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (alarmManager.canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, snoozeTimeMs, pendingIntent);
                Log.d(TAG, "Scheduled snoozed EXACT alarm for event " + eventId + " in " + minutes + " minutes");
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, snoozeTimeMs, pendingIntent);
                Log.w(TAG, "Snoozed alarm scheduled inexact because permission is revoked");
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, snoozeTimeMs, pendingIntent);
            Log.d(TAG, "Scheduled snoozed EXACT alarm (M+) for event " + eventId + " in " + minutes + " minutes");
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, snoozeTimeMs, pendingIntent);
            Log.d(TAG, "Scheduled snoozed EXACT alarm (pre-M) for event " + eventId + " in " + minutes + " minutes");
        }
    }
}
