package org.gps.client;


import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.net.wifi.WifiManager;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;
import androidx.preference.PreferenceManager;

import android.util.Log;
import android.widget.Toast;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.zip.Deflater;

public class MainService extends Service {
    private final static String TAG = "MainService";

    // This is the object that receives interactions from clients.
    private final IBinder mBinder = new LocalBinder();
    // Objects used for streaming thread
    private AtomicBoolean run = new AtomicBoolean(false);
    private AtomicInteger dataBytes = new AtomicInteger(0);
    private AtomicLong dataBytesResetTime = new AtomicLong(0);
    private Thread thread;
    // the audio recording options
    private static final int CHANNEL = AudioFormat.CHANNEL_IN_MONO;
    // the audio recorder
    private AudioRecord recorder;
    // Streaming objects
    String streamDestinationIP;
    int streamDestinationPort;
    int sampleRate;
    PayloadType payloadType;
    private static final int PAYLOAD_SIZE = 512;
    private boolean voiceDetectionEnabled = true;
    int voiceThreshold = 0;

    SharedPreferences sharedPreferences;
    private Thread micControlThread;
    private AtomicBoolean micControlRunning = new AtomicBoolean(false);

    public String getStreamDestinationIP() {
        return streamDestinationIP;
    }
    public int getVoiceThreshold() {
        return voiceThreshold;
    }

    public void setStreamDestinationIP(String streamDestinationIP) {
        this.streamDestinationIP = streamDestinationIP;
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(getString(R.string.streamDestinationIP_key), streamDestinationIP);
        editor.apply();
    }

    public int getStreamDestinationPort() {
        return streamDestinationPort;
    }

    public void setStreamDestinationPort(int streamDestinationPort) {
        this.streamDestinationPort = streamDestinationPort;
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putInt(getString(R.string.streamDestinationPort_key), streamDestinationPort);
        editor.apply();
    }

    public PayloadType getPayloadType() { return payloadType;}

    public void setPayloadType(PayloadType payloadType) {
        this.payloadType = payloadType;
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(getString(R.string.payloadType_key), payloadType.toString());
        editor.apply();
    }
    public void setVoiceThreshold(int voiceThreshold) {
        this.voiceThreshold = voiceThreshold;
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putInt(getString(R.string.voiceThreshold_key), voiceThreshold);
        editor.apply();
    }
    public int getSampleRate() { return sampleRate; }

    public void setSampleRate(int sampleRate) {
        this.sampleRate = sampleRate;
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putInt(getString(R.string.sampleRate_key), sampleRate);
        editor.apply();
    }
    public void stopMicControl() {
        micControlRunning.set(false);
        if (micControlThread != null) {
            try {
                micControlThread.join();
            } catch (InterruptedException e) {
                Log.e(TAG, "Error stopping mic control thread: " + e.toString());
            }
        }
    }

    /**
     *  Compute an estimate of the datarate sent over the network based on
     *  number of bytes sent and time elapsed since last call to this function
     * @return estimated datarate
     */
    public int getCurrentDataRate() {
        int ret = dataBytes.get();
        long time = System.currentTimeMillis();
        int deltaTime = (int)(time - dataBytesResetTime.get());
        dataBytes.set(0);
        dataBytesResetTime.set(time);

        if (deltaTime <= 0) return 0; // ✅ tránh chia cho 0
        return (1000 * ret) / deltaTime;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Create");
//        Toast.makeText(this, "Create service", Toast.LENGTH_LONG).show();
//        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
//        sharedPreferences = getSharedPreferences("settings", MODE_PRIVATE);
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);

        streamDestinationIP = sharedPreferences.getString(getString(R.string.streamDestinationIP_key), "27.72.28.3");
        streamDestinationPort = sharedPreferences.getInt(getString(R.string.streamDestinationPort_key), 9124);
        payloadType = PayloadType.valueOf(sharedPreferences.getString(getString(R.string.payloadType_key),
                                            PayloadType.RAW_16BIT.toString()));
        sampleRate = sharedPreferences.getInt(getString(R.string.sampleRate_key), 32000);
        voiceDetectionEnabled = sharedPreferences.getBoolean("voiceDetectionEnabled", true);
        voiceThreshold = sharedPreferences.getInt("voiceThreshold", 0);  // Mặc định là 0
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private String createNotificationChannel(String channelId , String channelName) {
        NotificationChannel chan = new NotificationChannel(channelId,
                channelName, NotificationManager.IMPORTANCE_NONE);
        chan.setLightColor(Color.BLUE);
        chan.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        assert manager != null;
        manager.createNotificationChannel(chan);
        return channelId;
    }
    public void startMicControl(final String deviceId) {
        micControlRunning.set(true);
        micControlThread = new Thread(() -> {
            while (micControlRunning.get()) {
                try {
                    java.net.URL url = new java.net.URL("http://"+ streamDestinationIP+ ":9091/control/" + deviceId);
                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(5000);
                    conn.setReadTimeout(1000);
                    int responseCode = conn.getResponseCode();
                    if (responseCode == 200) {
                        java.io.BufferedReader in = new java.io.BufferedReader(
                                new java.io.InputStreamReader(conn.getInputStream()));
                        String response = in.readLine();
                        in.close();
                        if ("STOP_STREAM".equalsIgnoreCase(response.trim())) {
                            Log.d(TAG, "STOP_STREAM");
                            voiceThreshold = 100000;
                            if (isStreaming())
                                stopStreaming();
                        } else if ("START_STREAM".equalsIgnoreCase(response.trim())) {
                            Log.d(TAG, "START_STREAM");
                            voiceThreshold = 0;
                            if (!isStreaming())
                                startStreaming();
                        }
                    }
                    Thread.sleep(5000); // đợi 5s
                } catch (Exception e) {
                    Log.e(TAG, "Mic control error: " + e.toString());
                    try { Thread.sleep(5000); } catch (InterruptedException ignore) {}
                }
            }
        });
        micControlThread.start();
    }
    @Override
    public int onStartCommand (Intent intent, int flags, int startId){
        sharedPreferences.edit().putBoolean("status", true).apply();
        super.onStartCommand(intent, flags, startId);
        Log.d(TAG, "Start");
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            createNotificationChannel(MainApplication.PRIMARY_CHANNEL, "Background Audio");

        Notification notification = new NotificationCompat.Builder(this, MainApplication.PRIMARY_CHANNEL)
                .setContentTitle("Microphone Service")
                .setContentText("Streaming audio")
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                    1,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            );
        } else {
            startForeground(1, notification);
        }
        String deviceId = sharedPreferences.getString("id", "000000");  // "id" chính là KEY_DEVICE trong MainFragment
//        String deviceId = "363294";
        startMicControl(deviceId);
        if (!isStreaming())
//            run.set(true);
            startStreaming();
//            Log.d(TAG, "Start" + deviceId);
//        return Service.START_REDELIVER_INTENT;

        return Service.START_STICKY;      //START_STICKY đảm bảo service được khởi động lại nếu hệ thống kill khi thiếu tài nguyên.
    }
    private boolean isVoiceDetected(byte[] buffer, int size, int threshold) {
        long sum = 0;
        for (int i = 0; i < size - 1; i += 2) {
            short sample = (short)((buffer[i+1] << 8) | (buffer[i] & 0xff));
            sum += sample * sample;
        }
        double rms = Math.sqrt(sum / (size / 2.0));
        return rms > threshold;
    }
    public void startStreaming(){
        streamDestinationPort = sharedPreferences.getInt(
                getString(R.string.streamDestinationPort_key), 9124);

        streamDestinationIP = sharedPreferences.getString(
                getString(R.string.streamDestinationIP_key), "27.72.28.3");
        payloadType = PayloadType.valueOf(sharedPreferences.getString(getString(R.string.payloadType_key),
                PayloadType.RAW_16BIT.toString()));
        sampleRate = sharedPreferences.getInt(getString(R.string.sampleRate_key), 32000);
        voiceDetectionEnabled = sharedPreferences.getBoolean("voiceDetectionEnabled", true);
        voiceThreshold = sharedPreferences.getInt("voiceThreshold", 0);
        thread = new Thread(new Runnable() {
            public void run() {
                // Initialize the recorder
                int format = payloadType.getAudioFormat();
                int bufferSize = AudioRecord.getMinBufferSize(sampleRate, CHANNEL, format);
                if (bufferSize == AudioRecord.ERROR_BAD_VALUE)
                    return;
                bufferSize = (1+ bufferSize/PAYLOAD_SIZE)*PAYLOAD_SIZE;
                boolean recoderNotInitialized = true;
                do{
                    recorder = null;
                    try {
                        recorder = new AudioRecord(MediaRecorder.AudioSource.DEFAULT,sampleRate, CHANNEL, format, bufferSize * 10);
                    }
                    catch (Exception e) {
                        Log.e(TAG, e.toString());
                        continue;
                    }
                    if (recorder == null) {
                        Log.e(TAG, "Null AudioRecord");
                        continue;
                    }
                    if (recorder == null || recorder.getState() != AudioRecord.STATE_INITIALIZED) {
                        Log.e(TAG, "Recorder not initialized properly");
                        return;
                    }
                    recoderNotInitialized = false;
                } while(recoderNotInitialized);
                Log.d(TAG, "Created AudioRecord, rate :" + sampleRate +
                                ", bufferSize: " + bufferSize + ", threshold: " + voiceThreshold);
                // Initialize the UDP stream
                byte[] buffer = new byte[bufferSize];
                DatagramSocket datagramSocket;
                DatagramPacket datagramPacket = new DatagramPacket(buffer, buffer.length);
                try {
                    datagramSocket = new DatagramSocket();
                    datagramPacket.setAddress(InetAddress.getByName(streamDestinationIP));
                    datagramPacket.setPort(streamDestinationPort);
                    Log.d(TAG, "Created DatagramSocket : " +
                                streamDestinationIP + ":" + streamDestinationPort);
                }
                catch (Exception e) {
                    Log.e(TAG, e.toString());
                    return;
                }
                // recorder and socket are OK so we can wakeLock and WiFiLock
                WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                WifiManager.WifiLock wifiLock = wifiManager.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF  , TAG + ":wifiLock");
                wifiLock.setReferenceCounted(true);
                wifiLock.acquire();
                PowerManager powerManager = (PowerManager) getApplicationContext().getSystemService(Context.POWER_SERVICE);
                PowerManager.WakeLock wakeLock = powerManager.newWakeLock(PowerManager.FULL_WAKE_LOCK, TAG + ":wakeLock");
                wakeLock.acquire();
                // Start recording and stream loop
                recorder.startRecording();
                short frameNb = 0;
                int sampleNb = 0;
                dataBytes.set(0);
                dataBytesResetTime.set(System.currentTimeMillis());
                while(run.get() && (recorder.getState() == AudioRecord.STATE_INITIALIZED)
                        && (recorder.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING)){
                    try {
                        int sizeToSend = recorder.read(buffer, 0, buffer.length);
                        if (voiceDetectionEnabled && voiceThreshold > 0) {
                            if (!isVoiceDetected(buffer, sizeToSend, voiceThreshold)) {
                                if (wakeLock.isHeld()) wakeLock.release();
                                if (wifiLock.isHeld()) wifiLock.release();
                                continue;
                            } else {
                                if (!wakeLock.isHeld()) wakeLock.acquire();
                                if (!wifiLock.isHeld()) wifiLock.acquire();
                            }
                            Log.d(TAG, "bỏ qua âm thanh");
                        }
                        int index = 0;
                        while(sizeToSend>0) {
                            int packetBufferSize = Math.min(sizeToSend, PAYLOAD_SIZE);
                            byte[] bufferToSend = Arrays.copyOfRange(buffer, index, index + packetBufferSize);
                            if (payloadType.compression == PayloadType.Compression.ZIP) {
                                byte[] output = new byte[2*packetBufferSize];
                                Deflater compresser = new Deflater(Deflater.BEST_COMPRESSION);
                                compresser.setInput(bufferToSend);
                                compresser.finish();
                                int compressedDataLength = compresser.deflate(output);
                                compresser.end();
                                bufferToSend = Arrays.copyOfRange(output, 0, compressedDataLength);
                            }
                            StreamPacket rtp_packet = new StreamPacket((byte) payloadType.payloadTypeId,
                                    frameNb++, sampleNb, sampleRate,
                                    bufferToSend,
                                    bufferToSend.length);
                            byte[] packetBuffer = new byte[rtp_packet.getPacketLength()];
                            rtp_packet.getPacket(packetBuffer);
                            sizeToSend -= packetBufferSize;
                            index += packetBufferSize;
                            sampleNb += packetBufferSize/payloadType.sampleByteSize;
                            datagramPacket.setData(packetBuffer);
                            if(!datagramSocket.isClosed()) {
                                datagramSocket.send(datagramPacket);
                                dataBytes.set(dataBytes.get() + packetBuffer.length);
                            }
                        }
                    } catch (Throwable t) {
                        Log.e(TAG, t.toString());// gérer l'exception et arrêter le traitement
                    }
                }
                // Stop and close everything
                if (!datagramSocket.isClosed())
                    datagramSocket.close();
                if (recorder.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING)
                    recorder.stop();
                if (recorder != null && recorder.getState() == AudioRecord.STATE_INITIALIZED) {
                    recorder.release();
                }
                if(wakeLock.isHeld())
                    wakeLock.release();
                if(wifiLock.isHeld())
                    wifiLock.release();
                Log.d(TAG, "Exit Streaming thread");
            }
        });
        run.set(true);
        thread.start();
//        Toast.makeText(this, "Streaming started", Toast.LENGTH_LONG).show();
    }

    public boolean isStreaming(){
        if (recorder == null)
            return false;
        return thread.isAlive()
                && (recorder.getState() == AudioRecord.STATE_INITIALIZED)
                && (recorder.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING);
    }

    public void stopStreaming(){
        /**/
        run.set(false);
//        stopForeground(true);
        try {
            thread.join();
        } catch (Throwable t) {
            // gérer l'exception et arrêter le traitement
        }
//        Toast.makeText(this, "Streaming stopped", Toast.LENGTH_LONG).show();
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "Destroy");
//        Toast.makeText(this, "Service Stopped", Toast.LENGTH_LONG).show();
        stopStreaming();
        stopMicControl();
        // ✅ Tự khởi động lại nếu đang bật
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this);
//        if (prefs.getBoolean("status", false)) {
//                Intent restartIntent = new Intent(getApplicationContext(), MainService.class);
//                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//                    startForegroundService(restartIntent);
//                } else {
//                    startService(restartIntent);
//                }
//        }
        if (prefs.getBoolean("status", false)) {
            Log.d(TAG, "Scheduling service restart after 30s...");
            new android.os.Handler(Looper.getMainLooper()).postDelayed(() -> {
                try {
                    Intent restartIntent = new Intent(getApplicationContext(), MainService.class);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(restartIntent);
                    } else {
                        startService(restartIntent);
                    }
                    Log.d(TAG, "Service restarted after delay");
                } catch (Exception e) {
                    Log.e(TAG, "Failed to restart service: " + e);
                }
            }, 30_000); // 30.000 ms = 30 giây
        }

    }

    public class LocalBinder extends Binder {
        MainService getService() {
            Log.d(TAG, "Binder");
            return MainService.this;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return mBinder;
    }

}
