package com.innohi.ynhcommonapi.controller.timing;

import android.content.Context;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class CancelPowerOnOffController extends PreferenceController {
    private PreferenceFragmentCompat mFragment;

    public CancelPowerOnOffController(Context context, String key, boolean available, PreferenceFragmentCompat fragment) {
        super(context, key, available);
        mFragment = fragment;
    }

    @Override
    public boolean onClick(Preference preference) {
        new AlertDialog.Builder(mContext)
                .setMessage(R.string.clear_timing_msg)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> {
                    mYNHAPI.cancelPowerOnOffAlarm();
                    clear();
                })
                .setNegativeButton(android.R.string.cancel, null)
                .show();
        return true;
    }

    public void clear() {
        mFragment.findPreference("key_set_timing_shutdown").setSummary("");
        mFragment.findPreference("key_set_timing_boot").setSummary("");
    }
}
