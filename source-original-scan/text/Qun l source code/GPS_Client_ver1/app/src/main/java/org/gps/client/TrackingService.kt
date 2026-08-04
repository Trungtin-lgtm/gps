
package org.gps.client

import android.Manifest
import android.annotation.SuppressLint
import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.PowerManager.WakeLock
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import androidx.preference.PreferenceManager
import java.lang.RuntimeException

class TrackingService : Service() {

    private var wakeLock: WakeLock? = null
    private var trackingController: TrackingController? = null

    @SuppressLint("WakelockTimeout")
    override fun onCreate() {
        val sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this)
        try {
            startForeground(NOTIFICATION_ID, createNotification(this))
            Log.i(TAG, "service create")
            sendBroadcast(Intent(ACTION_STARTED).setPackage(packageName))
            StatusActivity.addMessage(getString(R.string.status_service_create))

            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                if (sharedPreferences.getBoolean(MainFragment.KEY_WAKELOCK, true)) {
                    val powerManager = getSystemService(POWER_SERVICE) as PowerManager
                    wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, javaClass.name)
                    wakeLock?.acquire()
                }
                trackingController = TrackingController(this)
                trackingController?.start()
            }
        } catch (e: RuntimeException) {
            Log.w(TAG, e)
            sharedPreferences.edit().putBoolean(MainFragment.KEY_STATUS, false).apply()
            stopSelf()
        }
    }

    override fun onBind(intent: Intent): IBinder? {
        return null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        WakefulBroadcastReceiver.completeWakefulIntent(intent)
        // ✅ Ghi nhớ trạng thái đang chạy
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        prefs.edit().putBoolean(MainFragment.KEY_STATUS, true).apply()
        return START_STICKY
    }

    override fun onDestroy() {

        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        Log.i(TAG, "service destroy")
        sendBroadcast(Intent(ACTION_STOPPED).setPackage(packageName))
        StatusActivity.addMessage(getString(R.string.status_service_destroy))
        if (wakeLock?.isHeld == true) {
            wakeLock?.release()
        }
        trackingController?.stop()

    }

    companion object {

        // Explicit package name should be specified when broadcasting START/STOP notifications -
        // it is required for manifest-declared receiver of the status widget (when running on Android 8+).
        // Refer to https://developer.android.com/guide/components/broadcasts#manifest-declared-receivers
        const val ACTION_STARTED = "org.gps.action.SERVICE_STARTED"
        const val ACTION_STOPPED = "org.gps.action.SERVICE_STOPPED"
        private val TAG = TrackingService::class.java.simpleName
        private const val NOTIFICATION_ID = 1

        @SuppressLint("UnspecifiedImmutableFlag")
        private fun createNotification(context: Context): Notification {
            val builder = NotificationCompat.Builder(context, MainApplication.PRIMARY_CHANNEL)
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
            val intent = Intent(context, MainActivity::class.java)
            builder
                .setContentTitle(context.getString(R.string.settings_status_on_summary))
                .setTicker(context.getString(R.string.settings_status_on_summary))
                .color = ContextCompat.getColor(context, R.color.primary_dark)
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            builder.setContentIntent(PendingIntent.getActivity(context, 0, intent, flags))
            return builder.build()
        }
    }
}
