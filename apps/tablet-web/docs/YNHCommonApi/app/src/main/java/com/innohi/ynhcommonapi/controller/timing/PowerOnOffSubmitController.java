package com.innohi.ynhcommonapi.controller.timing;

import android.content.Context;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class PowerOnOffSubmitController extends PreferenceController {
    private PreferenceFragmentCompat mFragment;

    public PowerOnOffSubmitController(Context context, String key, boolean available, PreferenceFragmentCompat fragment) {
        super(context, key, available);
        mFragment = fragment;
    }

    @Override
    public boolean onClick(Preference preference) {
        int[] shutdownTime = getShutdownTime();
        int[] bootTime = getBootTime();
        L.d("set timing: shutdown time = " + shutdownTime + ", boot time = " + bootTime);
        new AlertDialog.Builder(mContext)
                .setMessage(R.string.submit_timing_data_msg)
                .setPositiveButton(android.R.string.ok, (dialog, which) ->
                        mYNHAPI.setPowerOnOffAlarm(shutdownTime, bootTime))
                .setNegativeButton(android.R.string.cancel, null)
                .show();
        return false;
    }

    private int[] getShutdownTime() {
        return convertTime((String) mFragment.findPreference("key_set_timing_shutdown").getSummary());
    }

    private int[] getBootTime() {
        return convertTime((String) mFragment.findPreference("key_set_timing_boot").getSummary());
    }

    private int[] convertTime(String formatTime) {
        int[] ret = new int[5];
        if (formatTime != null) {
            String[] arr = formatTime.split("/");
            for (int i = 0; i < ret.length; i++) {
                ret[i] = Integer.parseInt(arr[i]);
            }
        }
        return ret;
    }
}
