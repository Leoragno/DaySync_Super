package com.daysync.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * NotificationRescheduler - Core scheduling engine.
 * Reads events from Capacitor SharedPreferences, calculates exact trigger times,
 * manages AlarmManager exact alarms, and coordinates background resiliency.
 */
public class NotificationRescheduler {
    private static final String TAG = "DaySyncRescheduler";
    private static final String PREF_FILE = "DaySyncNotificationPrefs";
    private static final String KEY_SCHEDULED_IDS = "scheduled_alarm_ids";

    /**
     * Reschedules all active exact alarms from stored events.
     */
    public static synchronized void rescheduleAll(Context context) {
        Log.i(TAG, "Starting rescheduling of all exact alarms...");
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            Log.e(TAG, "AlarmManager is null. Cannot schedule alarms.");
            return;
        }

        // 1. Cancel all previously scheduled alarms to avoid orphans/duplicates
        cancelAllPreviouslyScheduled(context, alarmManager);

        // 2. Read events from Capacitor SharedPreferences
        SharedPreferences capacitorPrefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String eventsJson = capacitorPrefs.getString("daysync_cache_events", null);

        if (eventsJson == null || eventsJson.isEmpty()) {
            Log.d(TAG, "No cached events found to schedule.");
            return;
        }

        Set<String> newlyScheduledIds = new HashSet<>();
        long now = System.currentTimeMillis();

        try {
            JSONArray eventsArray = new JSONArray(eventsJson);
            Log.d(TAG, "Parsing " + eventsArray.length() + " cached events");

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault());

            for (int i = 0; i < eventsArray.length(); i++) {
                JSONObject eventObj = eventsArray.getJSONObject(i);
                
                String eventId = eventObj.optString("id");
                boolean completed = eventObj.optBoolean("completed", false);

                if (eventId == null || eventId.isEmpty() || completed) {
                    continue;
                }

                String dateStr = eventObj.optString("date");
                String timeStr = eventObj.optString("time");

                if (dateStr == null || dateStr.isEmpty()) {
                    continue;
                }

                // If event doesn't specify time, skip exact scheduling
                if (timeStr == null || timeStr.isEmpty()) {
                    continue;
                }

                try {
                    Date eventDate = sdf.parse(dateStr + " " + timeStr);
                    if (eventDate == null) continue;

                    long eventTimeMs = eventDate.getTime();
                    long reminderMinutes = eventObj.optLong("reminder_minutes", 0);
                    
                    if (reminderMinutes < 0) {
                        reminderMinutes = 0;
                    }

                    long triggerTimeMs = eventTimeMs - (reminderMinutes * 60 * 1000);

                    // Skip if trigger time is in the past
                    if (triggerTimeMs <= now) {
                        Log.d(TAG, "Skipping event " + eventId + " (trigger time " + triggerTimeMs + " is in the past, now is " + now + ")");
                        continue;
                    }

                    // Generate a stable integer ID for the alarm from the UUID string
                    int alarmId = hashStringToInt(eventId);

                    // Create the intent for AlarmReceiver
                    Intent receiverIntent = new Intent(context, AlarmReceiver.class);
                    receiverIntent.putExtra("eventId", eventId);
                    receiverIntent.putExtra("title", eventObj.optString("title", "DaySync Promemoria"));
                    receiverIntent.putExtra("description", eventObj.optString("description", ""));
                    receiverIntent.putExtra("color", eventObj.optString("color", "#6366f1"));
                    receiverIntent.putExtra("category", eventObj.optString("category", ""));
                    receiverIntent.putExtra("type", eventObj.optString("type", ""));
                    receiverIntent.putExtra("date", dateStr);
                    receiverIntent.putExtra("time", timeStr);

                    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        flags |= PendingIntent.FLAG_IMMUTABLE;
                    }

                    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, alarmId, receiverIntent, flags);

                    // Schedule exact alarm with allowWhileIdle to override battery optimization restrictions
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        if (alarmManager.canScheduleExactAlarms()) {
                            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                            Log.d(TAG, "Scheduled EXACT alarm for event " + eventId + " at " + triggerTimeMs);
                        } else {
                            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                            Log.w(TAG, "Exact alarm permission missing. Scheduled INEXACT alarm for event " + eventId + " at " + triggerTimeMs);
                        }
                    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                        Log.d(TAG, "Scheduled EXACT alarm (M+) for event " + eventId + " at " + triggerTimeMs);
                    } else {
                        alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                        Log.d(TAG, "Scheduled EXACT alarm (pre-M) for event " + eventId + " at " + triggerTimeMs);
                    }

                    newlyScheduledIds.add(eventId);

                } catch (Exception e) {
                    Log.e(TAG, "Failed to parse or schedule event date/time for event " + eventId, e);
                }
            }

            // Save the newly scheduled IDs to our private preferences
            saveScheduledIds(context, newlyScheduledIds);
            Log.i(TAG, "Rescheduled completed. Scheduled count: " + newlyScheduledIds.size());

        } catch (JSONException e) {
            Log.e(TAG, "JSON parsing error in rescheduleAll", e);
        }
    }

    /**
     * Cancels all previously scheduled alarms saved in private preferences.
     */
    private static void cancelAllPreviouslyScheduled(Context context, AlarmManager alarmManager) {
        SharedPreferences privatePrefs = context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE);
        Set<String> scheduledIds = privatePrefs.getStringSet(KEY_SCHEDULED_IDS, null);

        if (scheduledIds == null || scheduledIds.isEmpty()) {
            return;
        }

        Log.d(TAG, "Cancelling " + scheduledIds.size() + " previously scheduled alarms");

        Intent receiverIntent = new Intent(context, AlarmReceiver.class);
        int flags = PendingIntent.FLAG_NO_CREATE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        for (String eventId : scheduledIds) {
            int alarmId = hashStringToInt(eventId);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, alarmId, receiverIntent, flags);
            
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent);
                pendingIntent.cancel();
                Log.d(TAG, "Cancelled alarm " + alarmId + " for event " + eventId);
            }
        }
    }

    /**
     * Saves the scheduled event IDs to private SharedPreferences.
     */
    private static void saveScheduledIds(Context context, Set<String> ids) {
        SharedPreferences privatePrefs = context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE);
        privatePrefs.edit().putStringSet(KEY_SCHEDULED_IDS, ids).apply();
    }

    /**
     * Convert a UUID string to a stable positive 32-bit integer.
     * Guaranteed to return a positive integer matching the JS hashing algorithm.
     */
    public static int hashStringToInt(String str) {
        if (str == null) return 1;
        int hash = 0;
        for (int i = 0; i < str.length(); i++) {
            char charVal = str.charAt(i);
            hash = ((hash << 5) - hash) + charVal;
            hash = hash & 0x7FFFFFFF; // Ensure positive 32-bit int
        }
        return hash == 0 ? 1 : hash;
    }
}
