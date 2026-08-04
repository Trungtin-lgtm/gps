package org.gps.client

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import androidx.preference.PreferenceManager

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val launchIntent = Intent(context, MainActivity::class.java)
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
//            context.startActivity(launchIntent)
        }
        val prefs = PreferenceManager.getDefaultSharedPreferences(context)
        if (prefs.getBoolean(MainFragment.KEY_STATUS, false)) {
            val mainServiceIntent = Intent(context, MainService::class.java)
            ContextCompat.startForegroundService(context, mainServiceIntent)
        }
    }
}
