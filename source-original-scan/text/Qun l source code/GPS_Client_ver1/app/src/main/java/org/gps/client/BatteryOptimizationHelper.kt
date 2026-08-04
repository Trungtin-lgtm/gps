
package org.gps.client

import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.appcompat.app.AlertDialog
import androidx.preference.PreferenceManager
import com.judemanutd.autostarter.AutoStartPermissionHelper

class BatteryOptimizationHelper {

    private fun showDialog(context: Context, onSuccess: () -> Unit) {
        val builder = AlertDialog.Builder(context)
        builder.setMessage(context.getString(R.string.request_exception))
        builder.setPositiveButton(android.R.string.ok) { _, _ -> onSuccess() }
        builder.setNegativeButton(android.R.string.cancel, null)
        builder.show()
    }

    private fun requestVendorException(context: Context) {
        val vendorIntentList = listOf(
            Intent().setComponent(ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity")),
            Intent().setComponent(ComponentName("com.letv.android.letvsafe", "com.letv.android.letvsafe.AutobootManageActivity")),
            Intent().setComponent(ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity")),
            Intent().setComponent(ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity")),
            Intent().setComponent(ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity")),
            Intent().setComponent(ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity")),
            Intent().setComponent(ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity")),
            Intent().setComponent(ComponentName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity")),
            Intent().setComponent(ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity")),
            Intent().setComponent(ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager")),
            Intent().setComponent(ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity")),
            Intent().setComponent(ComponentName("com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity")),
            Intent().setComponent(ComponentName("com.htc.pitroad", "com.htc.pitroad.landingpage.activity.LandingPageActivity")),
            Intent().setComponent(ComponentName("com.asus.mobilemanager", "com.asus.mobilemanager.MainActivity")),
        )
        for (vendorIntent in vendorIntentList) {
            if (context.packageManager.resolveActivity(vendorIntent, PackageManager.MATCH_DEFAULT_ONLY) != null) {
                try {
                    context.startActivity(vendorIntent)
                    return
                } catch (e: Exception) {
                    continue
                }
            }
        }
    }

    fun requestException(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context)
            if (!sharedPreferences.getBoolean(KEY_EXCEPTION_REQUESTED, false)) {
                sharedPreferences.edit().putBoolean(KEY_EXCEPTION_REQUESTED, true).apply()
                val powerManager = context.getSystemService(PowerManager::class.java)
                if (!powerManager.isIgnoringBatteryOptimizations(context.packageName)) {
                    showDialog(context) {
                        try {
                            context.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
                        } catch (e: ActivityNotFoundException) {
                            requestVendorException(context)
                        }
                    }
                    return true
                }
            } else if (!sharedPreferences.getBoolean(KEY_AUTOSTART_REQUESTED, false)) {
                sharedPreferences.edit().putBoolean(KEY_AUTOSTART_REQUESTED, true).apply()
                try {
                    if (AutoStartPermissionHelper.getInstance().getAutoStartPermission(context)) {
                        return true
                    }
                } catch (e: SecurityException) {
                }
            }
        }
        return false
    }

    companion object {
        private const val KEY_EXCEPTION_REQUESTED = "exceptionRequested"
        private const val KEY_AUTOSTART_REQUESTED = "autostartRequested"
    }
}
