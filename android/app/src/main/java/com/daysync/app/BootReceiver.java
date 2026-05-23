package com.daysync.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * BootReceiver - Handles device boot events to restore notifications.
 * When the device restarts, this receiver silently restores all exact alarms in the background
 * without launching the app UI (non-intrusive).
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "DaySyncBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }

        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(intent.getAction())) {
            
            Log.i(TAG, "Device boot completed. Silently restoring all exact alarms in the background.");
            
            // Invoke background rescheduling silently
            NotificationRescheduler.rescheduleAll(context);
        }
    }
}
