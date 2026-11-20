package com.innohi.ynhcommonapi.controller.timing;

import android.content.Context;

import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;

import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.fragment.DatePickerFragment;
import com.innohi.ynhcommonapi.fragment.TimePickerFragment;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class PowerOffTimeController extends PreferenceController {
    private PreferenceFragmentCompat mFragment;

    public PowerOffTimeController(Context context, String key, boolean available, PreferenceFragmentCompat fragment) {
        super(context, key, available);
        mFragment = fragment;
    }


    @Override
    public boolean onClick(Preference preference) {
        new DatePickerFragment()
                .callback((year, month, day) ->
                        new TimePickerFragment()
                                .callback((hourOfDay, minute) -> {
                                            String formatTime = year + "/" + month + "/" + day + "/" + hourOfDay + "/" + minute;
                                            preference.setSummary(formatTime);
                                        }
                                ).show(mFragment.getChildFragmentManager(), "timing_shutdown_time_picker"))
                .show(mFragment.getChildFragmentManager(), "timing_shutdown_date_picker");
        return true;
    }
}
