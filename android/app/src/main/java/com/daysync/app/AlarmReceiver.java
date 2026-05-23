package com.daysync.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/**
 * AlarmReceiver - Receives intent when an exact alarm fires.
 * Builds and presents a premium native notification styled like Google Calendar,
 * featuring event category-specific colors and background quick actions (Completa, Posticipa).
 */
public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "DaySyncAlarmReceiver";
    private static final String CHANNEL_ID = "daysync-event-reminders";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) {
            return;
        }

        String eventId = intent.getStringExtra("eventId");
        String title = intent.getStringExtra("title");
        String description = intent.getStringExtra("description");
        String colorHex = intent.getStringExtra("color");
        String category = intent.getStringExtra("category");
        String type = intent.getStringExtra("type");
        String dateStr = intent.getStringExtra("date");
        String timeStr = intent.getStringExtra("time");

        if (eventId == null || eventId.isEmpty()) {
            Log.e(TAG, "Received alarm without eventId");
            return;
        }

        Log.i(TAG, "Exact alarm fired for event: " + eventId + " (" + title + ")");

        // 1. Resolve notification icon
        int iconResId = context.getResources().getIdentifier("ic_notification", "drawable", context.getPackageName());
        if (iconResId == 0) {
            iconResId = context.getApplicationInfo().icon; // Fallback to launcher icon
        }

        // 2. Parse category color for notification accent color
        int color = Color.parseColor("#6366f1"); // Default indigo color
        if (colorHex != null && !colorHex.isEmpty()) {
            try {
                color = Color.parseColor(colorHex);
            } catch (IllegalArgumentException e) {
                Log.w(TAG, "Invalid color hex: " + colorHex + ". Using default color.");
            }
        }

        // 3. Create Notification Channel if Android 8.0+ (redundant with Capacitor but safe fallback)
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) {
            Log.e(TAG, "NotificationManager is null. Cannot show notification.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = notificationManager.getNotificationChannel(CHANNEL_ID);
            if (channel == null) {
                channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Promemoria Eventi",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Notifiche per promemoria degli eventi in agenda");
                channel.enableLights(true);
                channel.setLightColor(color);
                channel.enableVibration(true);
                channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
                notificationManager.createNotificationChannel(channel);
            }
        }

        // 4. Generate stable integer alarm ID matching the JS hashing algorithm
        int alarmId = NotificationRescheduler.hashStringToInt(eventId);

        // 5. Build Background Action: "Completa" (Complete event silently)
        Intent completeIntent = new Intent(context, NotificationActionReceiver.class);
        completeIntent.setAction("com.daysync.app.ACTION_COMPLETE");
        completeIntent.putExtra("eventId", eventId);
        completeIntent.putExtra("notificationId", alarmId);
        
        int completeFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            completeFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent completePendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId + 100000,
            completeIntent,
            completeFlags
        );

        // 6. Build Background Action: "Posticipa 10 Min" (Snooze 10 minutes)
        Intent snoozeIntent = new Intent(context, NotificationActionReceiver.class);
        snoozeIntent.setAction("com.daysync.app.ACTION_SNOOZE");
        snoozeIntent.putExtra("eventId", eventId);
        snoozeIntent.putExtra("notificationId", alarmId);
        snoozeIntent.putExtra("snoozeMinutes", 10);
        // Include event details so the ActionReceiver can reschedule it
        snoozeIntent.putExtra("title", title);
        snoozeIntent.putExtra("description", description);
        snoozeIntent.putExtra("color", colorHex);
        snoozeIntent.putExtra("category", category);
        snoozeIntent.putExtra("type", type);
        snoozeIntent.putExtra("date", dateStr);
        snoozeIntent.putExtra("time", timeStr);

        int snoozeFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            snoozeFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId + 200000,
            snoozeIntent,
            snoozeFlags
        );

        // 7. Build Main tap intent: Opens the app and routes to the agenda
        Intent openAppIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (openAppIntent != null) {
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            openAppIntent.putExtra("eventId", eventId);
            openAppIntent.putExtra("deepLink", "/Agenda?date=" + dateStr);
        }
        
        int openFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            openFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent openPendingIntent = PendingIntent.getActivity(
            context,
            alarmId + 300000,
            openAppIntent,
            openFlags
        );

        // 8. Construct custom notification layout
        String timeLabel = (timeStr != null && !timeStr.isEmpty()) ? " alle " + timeStr : "";
        String body = description;
        if (body == null || body.trim().isEmpty()) {
            body = "Promemoria evento" + timeLabel;
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(iconResId)
            .setContentTitle(title)
            .setContentText(body)
            .setSubText(category != null && !category.isEmpty() ? category : null)
            .setColor(color)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(openPendingIntent)
            .addAction(0, "Completa", completePendingIntent)
            .addAction(0, "Posticipa 10 min", snoozePendingIntent);

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setDefaults(NotificationCompat.DEFAULT_ALL);
        }

        // 9. Display the notification
        notificationManager.notify(alarmId, builder.build());
        Log.d(TAG, "Notification posted for alarmId: " + alarmId);
    }
}
