
package org.gps.client

import android.content.Context
import android.content.Intent
import androidx.preference.PreferenceManager

class AutostartReceiver : WakefulBroadcastReceiver() {

    @Suppress("UnsafeProtectedBroadcastReceiver")
    override fun onReceive(context: Context, intent: Intent) {
        val sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context)
        if (sharedPreferences.getBoolean(MainFragment.KEY_STATUS, false)) {
            startWakefulForegroundService(context, Intent(context, TrackingService::class.java))
            startWakefulForegroundService(context, Intent(context, MainService::class.java)) // thêm dòng này
        }
    }

}
