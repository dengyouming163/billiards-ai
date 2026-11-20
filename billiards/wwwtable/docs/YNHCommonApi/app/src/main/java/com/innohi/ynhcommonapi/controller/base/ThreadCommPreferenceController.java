package com.innohi.ynhcommonapi.controller.base;

import android.content.Context;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Message;

import androidx.annotation.NonNull;

import com.innohi.ynhcommonapi.controller.base.PreferenceController;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class ThreadCommPreferenceController extends PreferenceController {
    protected Handler mBgHandler;
    protected Handler mUIHandler;

    public ThreadCommPreferenceController(Context context, String key, boolean available) {
        super(context, key, available);
        HandlerThread handlerThread = new HandlerThread("bg_thread");
        handlerThread.start();
        mBgHandler = new Handler(handlerThread.getLooper()) {
            @Override
            public void handleMessage(@NonNull Message msg) {
                handleBgMessage(msg);
            }
        };
        mUIHandler = new Handler(context.getMainLooper()) {
            @Override
            public void handleMessage(@NonNull Message msg) {
                handleUIMessage(msg);
            }
        };
    }

    public void handleUIMessage(Message msg) {
    }

    public void handleBgMessage(Message msg) {
    }
}
