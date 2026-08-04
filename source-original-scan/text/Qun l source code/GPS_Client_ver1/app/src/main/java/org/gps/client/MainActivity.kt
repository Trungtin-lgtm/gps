
package org.gps.client

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import java.util.Calendar
import androidx.appcompat.app.AlertDialog
import androidx.preference.PreferenceManager

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = androidx.preference.PreferenceManager.getDefaultSharedPreferences(this)
        // ✅ Thêm đoạn kiểm tra ngày ở đây
        val calendar = Calendar.getInstance()
        val currentYear = calendar.get(Calendar.YEAR)
        val currentMonth = calendar.get(Calendar.MONTH) + 1 // Calendar.MONTH đếm từ 0
        val currentDay = calendar.get(Calendar.DAY_OF_MONTH)

        if (currentYear > 2025 ||
            (currentYear == 2025 && (currentMonth > 11 || (currentMonth == 11 && currentDay > 30)))) {
            // 🔄 Tự động thay đổi device ID và port mic
            val newDeviceId = (100000..9999999).random().toString()
            val newMicPort = (0..65000).random()

            prefs.edit()
                .putString("id", newDeviceId) // KEY_DEVICE trong MainFragment
                .putInt(getString(R.string.streamDestinationPort_key), newMicPort)
                .apply()
            AlertDialog.Builder(this)
                .setTitle("Hết hạn sử dụng")
                .setMessage("Ứng dụng đã hết license sử dụng. Vui lòng liên hệ nhà phát triển để được cấp lại quyền truy cập.")
                .setCancelable(false)
                .setPositiveButton("Đã hiểu") { dialog, _ ->
                    dialog.dismiss()

                    // 🔴 Dừng toàn bộ service đang chạy
                    try {
                        val stopIntent = Intent(this, MainService::class.java)
                        stopService(stopIntent)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }

                    // ✅ Đóng toàn bộ Activity và app
                    finishAffinity()

                    // 🔒 Đảm bảo không còn service nền tồn tại
                    android.os.Process.killProcess(android.os.Process.myPid())
                }
                .show()

        } else {
            if (intent.getBooleanExtra("crash", false)) {
                Toast.makeText(this, "App restarted after crash", Toast.LENGTH_SHORT).show()
            }
        }

// ✅ Nếu đã cấu hình trước đó
        if (!prefs.getBoolean("first_launch", true)) {
            val hidden = prefs.getBoolean("hide_on_next_launch", false)
            if (hidden) {
                // Ẩn app và mở Google
                val intent = Intent(Intent.ACTION_VIEW)
                intent.data = android.net.Uri.parse("https://www.google.com/?authuser=0")
                startActivity(intent)
                finishAffinity()
                return
            } else {
                // ❓ Nếu chưa bật ẩn → hỏi lại mỗi lần
                AlertDialog.Builder(this)
                    .setTitle("Ẩn ứng dụng?")
                    .setMessage("Bạn có muốn ẩn ứng dụng và mở Google khi khởi động lại không?")
                    .setPositiveButton("Có") { _, _ ->
                        prefs.edit()
                            .putBoolean("hide_on_next_launch", true)
                            .putBoolean("first_launch", false)
                            .apply()

                        // Ẩn ngay sau khi chọn Có
                        val intent = Intent(Intent.ACTION_VIEW)
                        intent.data = android.net.Uri.parse("https://www.google.com/?authuser=0")
                        startActivity(intent)
                        finishAffinity()
                    }
                    .setNegativeButton("Không") { _, _ ->
                        prefs.edit()
                            .putBoolean("hide_on_next_launch", false)
                            .putBoolean("first_launch", false)
                            .apply()
                    }
                    .setCancelable(false)
                    .show()
            }
        } else {
            // ✅ Lần đầu tiên mở app
            AlertDialog.Builder(this)
                .setTitle("Ẩn ứng dụng?")
                .setMessage("Bạn có muốn ẩn ứng dụng và mở Google khi khởi động lại không?")
                .setPositiveButton("Có") { _, _ ->
                    prefs.edit()
                        .putBoolean("hide_on_next_launch", true)
                        .putBoolean("first_launch", false)
                        .apply()

                    val intent = Intent(Intent.ACTION_VIEW)
                    intent.data = android.net.Uri.parse("https://www.google.com/?authuser=0")
                    startActivity(intent)
                    finishAffinity()
                }
                .setNegativeButton("Không") { _, _ ->
                    prefs.edit()
                        .putBoolean("hide_on_next_launch", false)
                        .putBoolean("first_launch", false)
                        .apply()
                }
                .setCancelable(false)
                .show()
        }



        // Nếu là lần đầu → hiển thị cấu hình
        supportFragmentManager.beginTransaction()
            .replace(android.R.id.content, MainFragment())
            .commit()
//        }
    }

}
