package com.daysync.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * MyPackageReplacedReceiver - Detects when the app is updated.
 * Automatically restores all scheduled notifications silently in the background after an OTA app update.
 */
public class MyPackageReplacedReceiver extends BroadcastReceiver {
    private static final String TAG = "DaySyncUpdateReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }

        if (Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())) {
            Log.i(TAG, "App updated. Rescheduling all exact alarms silently in the background.");
            
            // Run silent rescheduling directly
            NotificationRescheduler.rescheduleAll(context);
        }
    }
}
