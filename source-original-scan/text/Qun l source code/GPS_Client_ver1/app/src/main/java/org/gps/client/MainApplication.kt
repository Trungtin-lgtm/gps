package org.gps.client

import androidx.multidex.MultiDexApplication
import android.annotation.TargetApi
import android.app.*
import android.content.Context
import android.graphics.Color
import android.os.Build

open class MainApplication : MultiDexApplication() {

    companion object {
        lateinit var instance: MainApplication
            private set

        const val PRIMARY_CHANNEL = "default"
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Thiết lập xử lý ngoại lệ toàn cục
        Thread.setDefaultUncaughtExceptionHandler(MyExceptionHandler(applicationContext))


        System.setProperty("http.keepAliveDuration", (30 * 60 * 1000).toString())
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            registerChannel()
        }
        val prefs = androidx.preference.PreferenceManager.getDefaultSharedPreferences(this)
        if (!prefs.contains(MainFragment.KEY_URL)) {
            // Mở cài đặt lần đầu
            prefs.edit().putBoolean("first_launch", true).apply()
        } else {
            prefs.edit().putBoolean("first_launch", false).apply()
        }
    }

    @TargetApi(Build.VERSION_CODES.O)
    private fun registerChannel() {
        val channel = NotificationChannel(
            PRIMARY_CHANNEL, getString(R.string.channel_default), NotificationManager.IMPORTANCE_LOW
        )
        channel.lightColor = Color.GREEN
        channel.lockscreenVisibility = Notification.VISIBILITY_SECRET
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
    }

    open fun handleRatingFlow(activity: Activity) {}

}
