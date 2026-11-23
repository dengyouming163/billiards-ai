package com.innohi.ynhcommonapi.controller.watchdog;

import android.content.Context;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.Preference;
import androidx.preference.SwitchPreferenceCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class FeedWatchdog extends PreferenceController {

    public FeedWatchdog(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public boolean onClick(Preference preference) {
        mYNHAPI.feedWatchDog();
        return true;
    }
}
