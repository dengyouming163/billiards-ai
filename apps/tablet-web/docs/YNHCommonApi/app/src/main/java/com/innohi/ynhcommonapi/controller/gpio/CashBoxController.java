package com.innohi.ynhcommonapi.controller.gpio;

import android.content.Context;
import android.os.Build;

import androidx.annotation.RequiresApi;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * @author David Chow
 * @since 2021/11/10
 */
public class CashBoxController extends PreferenceController {
    public CashBoxController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @RequiresApi(api = Build.VERSION_CODES.N)
    @Override
    protected boolean onClick(Preference preference) {
        CompletableFuture.runAsync(() -> {
            mYNHAPI.setGpioState(YNHAPI.CASHBOX_0, YNHAPI.GpioState.LOW);
            mYNHAPI.setGpioState(YNHAPI.CASHBOX_1, YNHAPI.GpioState.LOW);
            try {
                TimeUnit.MILLISECONDS.sleep(500);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).thenAccept(u -> {
            mYNHAPI.setGpioState(YNHAPI.CASHBOX_0, YNHAPI.GpioState.HIGH);
            mYNHAPI.setGpioState(YNHAPI.CASHBOX_1, YNHAPI.GpioState.HIGH);
        });
        return true;
    }
}
