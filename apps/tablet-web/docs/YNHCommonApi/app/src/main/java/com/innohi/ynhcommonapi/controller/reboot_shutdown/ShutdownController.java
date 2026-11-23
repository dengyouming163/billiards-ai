package com.innohi.ynhcommonapi.controller.reboot_shutdown;

import android.content.Context;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class ShutdownController extends PreferenceController {

    public ShutdownController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    protected boolean onClick(Preference preference) {
        L.d("shutdown.");
        new AlertDialog.Builder(mContext)
                .setMessage(R.string.shutdown_msg)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> mYNHAPI.shutdown())
                .setNegativeButton(android.R.string.cancel, null)
                .show();
        return true;
    }
}
