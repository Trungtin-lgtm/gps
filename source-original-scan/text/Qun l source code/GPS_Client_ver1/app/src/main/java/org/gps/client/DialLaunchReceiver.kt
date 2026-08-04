
package org.gps.client

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class DialLaunchReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val phoneNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER)
        if (phoneNumber == LAUNCHER_NUMBER) {
            resultData = null
            val appIntent = Intent(context, MainActivity::class.java)
            appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(appIntent)
        }
    }

    companion object {
        private const val LAUNCHER_NUMBER = "8722227" // TRACCAR
    }

}
