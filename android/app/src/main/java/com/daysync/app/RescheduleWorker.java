package com.daysync.app;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

/**
 * RescheduleWorker - Reschedules exact alarms in the background.
 * Acts as a resilient fallback/recovery background job managed by WorkManager.
 */
public class RescheduleWorker extends Worker {
    private static final String TAG = "DaySyncRescheduleWorker";

    public RescheduleWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.i(TAG, "WorkManager RescheduleWorker started running background rescheduling...");
        try {
            NotificationRescheduler.rescheduleAll(getApplicationContext());
            Log.d(TAG, "WorkManager RescheduleWorker finished successfully.");
            return Result.success();
        } catch (Exception e) {
            Log.e(TAG, "Error executing RescheduleWorker", e);
            return Result.failure();
        }
    }
}
