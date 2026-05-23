package com.daysync.app;

import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * DaySyncNotificationPlugin - Capacitor native bridge.
 * Exposes methods to TypeScript for manual rescheduling, exact alarm permissions management,
 * and battery optimization exemptions to bypass OEM task killers and Doze Mode.
 */
@CapacitorPlugin(name = "DaySyncNotification")
public class DaySyncNotificationPlugin extends Plugin {
    private static final String TAG = "DaySyncNotifPlugin";

    /**
     * Manually triggers rescheduling of all active exact alarms from TypeScript.
     */
    @PluginMethod
    public void rescheduleAll(PluginCall call) {
        try {
            NotificationRescheduler.rescheduleAll(getContext());
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error in rescheduleAll from JS call", e);
            call.reject("Failed to reschedule: " + e.getMessage());
        }
    }

    /**
     * Checks if exact alarm permission is granted.
     */
    @PluginMethod
    public void checkExactAlarmPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            boolean granted = alarmManager != null && alarmManager.canScheduleExactAlarms();
            ret.put("granted", granted);
            Log.d(TAG, "checkExactAlarmPermission: S+ check returned " + granted);
        } else {
            ret.put("granted", true);
            Log.d(TAG, "checkExactAlarmPermission: Pre-S default returned true");
        }
        call.resolve(ret);
    }

    /**
     * Launches the system settings screen to request exact alarm permission from the user.
     */
    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                ret.put("triggered", true);
                Log.d(TAG, "requestExactAlarmPermission: Opened exact alarm settings screen");
            } catch (Exception e) {
                Log.e(TAG, "Failed to launch exact alarm settings intent. Trying general settings.", e);
                try {
                    Intent intent = new Intent(Settings.ACTION_SETTINGS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                    ret.put("triggered", true);
                } catch (Exception ex) {
                    call.reject("Failed to open settings: " + ex.getMessage());
                    return;
                }
            }
        } else {
            ret.put("triggered", false);
            Log.d(TAG, "requestExactAlarmPermission: Pre-S, no request needed");
        }
        call.resolve(ret);
    }

    /**
     * Checks if the app is exempt from system battery optimizations (Doze Mode and OEM task killers).
     */
    @PluginMethod
    public void checkBatteryOptimizations(PluginCall call) {
        JSObject ret = new JSObject();
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            boolean ignoring = pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
            ret.put("ignoring", ignoring);
            Log.d(TAG, "checkBatteryOptimizations: ignoring standard optimizations = " + ignoring);
        } else {
            ret.put("ignoring", true);
        }
        call.resolve(ret);
    }

    /**
     * Directs the user to the battery optimizations settings list to exempt the app.
     * This is safe and compliant with Play Store guidelines, bypassing harsh OEM task killers.
     */
    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                // Open the standard ignore battery optimization settings page
                // This is 100% compliant with Google Play policy
                Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                ret.put("triggered", true);
                Log.d(TAG, "requestIgnoreBatteryOptimizations: Opened battery optimization settings");
            } catch (Exception e) {
                Log.e(TAG, "Failed to launch ignore battery settings", e);
                call.reject("Failed to open battery optimization settings: " + e.getMessage());
                return;
            }
        } else {
            ret.put("triggered", false);
        }
        call.resolve(ret);
    }
}
