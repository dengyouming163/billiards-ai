package com.innohi.ynhcommonapi.utils;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.os.Process;

import androidx.annotation.NonNull;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.ref.WeakReference;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * @author David Chow
 * @since 2021/3/31
 */
public class LogDumper {
    private static LogDumper mInstance;
    private static final String LOG_DIR_PATH = "/sdcard/YNHLog";
    private LogThread mLogThread;
    private static final int MAX_FILE_SIZE = 10 * 1024 * 1024; // 10M
    private final Handler mUIHandler;

    private LogDumper() {
        mUIHandler = new Handler(Looper.getMainLooper()) {
            @Override
            public void handleMessage(@NonNull Message msg) {
                if (mCallback != null) {
                    mCallback.onMaxFileSizeReached();
                }
            }
        };
    }

    public static LogDumper getInstance() {
        if (mInstance == null) {
            synchronized (LogDumper.class) {
                mInstance = new LogDumper();
            }
        }
        return mInstance;
    }

    public interface LogCallback {
        void onMaxFileSizeReached();
    }

    private LogCallback mCallback;

    public LogDumper setCallback(LogCallback callback) {
        mCallback = callback;
        return this;
    }

    public void start() {
        if (mLogThread == null) {
            if (!ensureLogDirCreated()) {
                L.d("Failed to create " + LOG_DIR_PATH + " directory.");
                return;
            }
            File logFile = getLogFile();
            mLogThread = new LogThread(this, Process.myPid(), logFile);
            mLogThread.start();
        }
    }

    public void stop() {
        if (mLogThread != null) {
            mLogThread.stopLog();
            mLogThread = null;
        }
    }


    private boolean ensureLogDirCreated() {
        File dir = new File(LOG_DIR_PATH);
        if (!dir.exists()) {
            return dir.mkdirs();
        }
        return true;
    }

    private File getLogFile() {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd-HH-mm-ss", Locale.US);
        return new File(LOG_DIR_PATH, "YNH-" + dateFormat.format(new Date()) + ".log");
    }

    private static class LogThread extends Thread {
        private java.lang.Process mLogcatProcess;
        private boolean mRunning;
        private final String mCmd;
        private File mLogFile;
        private int mSize; // the bytes already written to file.
        private WeakReference<LogDumper> mHost;

        public LogThread(LogDumper host, int pid, File logFile) {
            mHost = new WeakReference<>(host);
            mLogFile = logFile;
            mCmd = "logcat --pid=" + pid;
        }

        public void run() {
            try {
                L.d("log thread start running.");
                mRunning = true;
                mLogcatProcess = Runtime.getRuntime().exec(mCmd);
                try (BufferedInputStream bis = new BufferedInputStream(mLogcatProcess.getInputStream());
                     FileOutputStream fos = new FileOutputStream(mLogFile)) {
                    byte[] buffer = new byte[1024];
                    int len;
                    while (mRunning && (len = bis.read(buffer, 0, buffer.length)) != -1) {
                        fos.write(buffer, 0, len);
                        mSize += len;
                        if (mSize >= MAX_FILE_SIZE) {
                            L.d("reached max size limit.");
                            mRunning = false;
                            updateUI();
                        }
                    }
                }
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                mLogcatProcess.destroy();
            }
        }

        public void stopLog() {
            L.d("log thread stop running.");
            mRunning = false;
        }

        void updateUI() {
            LogDumper logDumper = mHost.get();
            if (logDumper != null) {
                logDumper.mUIHandler.sendEmptyMessage(0x01);
            }
        }
    }
}
