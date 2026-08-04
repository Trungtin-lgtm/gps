
package org.gps.client

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.RemoteViews

import androidx.preference.PreferenceManager

class StatusWidget : AppWidgetProvider() {

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (context == null || intent == null) {
            Log.w("StatusWidget", "onReceive() → context hoặc intent null, bỏ qua update")
            return
        }
        if (TrackingService.ACTION_STARTED == intent.action)
            updateWidgets(context, true)
        else if (TrackingService.ACTION_STOPPED == intent.action)
            updateWidgets(context, false)
        else
            super.onReceive(context, intent)
    }

    override fun onUpdate(
        context: Context?,
        appWidgetManager: AppWidgetManager?,
        appWidgetIds: IntArray?
    ) {
        if (context == null || appWidgetManager == null || appWidgetIds == null) {
            Log.w("StatusWidget", "onUpdate() → thiếu context hoặc manager hoặc id, bỏ qua")
            return
        }

        val prefs = PreferenceManager.getDefaultSharedPreferences(context)
        val enabled = prefs.getBoolean(MainFragment.KEY_STATUS, false)
        update(context, appWidgetManager, appWidgetIds, enabled)
    }

    fun updateWidgets(context: Context, enabled: Boolean) {
        val manager = AppWidgetManager.getInstance(context)
        if (manager == null) {
            Log.w("StatusWidget", "AppWidgetManager chưa sẵn sàng → bỏ qua update")
            return
        }

        val thisWidget = ComponentName(context, StatusWidget::class.java)
        val appWidgetIds = manager.getAppWidgetIds(thisWidget)
        if (appWidgetIds == null || appWidgetIds.isEmpty()) {
            Log.w("StatusWidget", "Không tìm thấy widget nào để cập nhật")
            return
        }

        update(context, manager, appWidgetIds, enabled)
    }

    private fun update(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        enabled: Boolean
    ) {
        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.status_widget)
            views.setImageViewResource(
                R.id.image_enabled,
                if (enabled) R.drawable.ic_start_foreground else R.drawable.ic_stop_foreground
            )

            val intent = Intent(context, MainActivity::class.java)
            val clickIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.image_enabled, clickIntent)

            try {
                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Exception) {
                Log.e("StatusWidget", "updateAppWidget lỗi: $appWidgetId", e)
            }
        }
    }


}
