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
public class RebootController extends PreferenceController {

    public RebootController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    protected boolean onClick(Preference preference) {
        L.d("reboot.");
        new AlertDialog.Builder(mContext)
                .setMessage(R.string.reboot_msg)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> mYNHAPI.reboot())
                .setNegativeButton(android.R.string.cancel, null)
                .show();
        return true;
    }
}
