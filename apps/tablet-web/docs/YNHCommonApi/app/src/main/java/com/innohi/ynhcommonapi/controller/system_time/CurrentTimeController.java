package com.innohi.ynhcommonapi.controller.system_time;

import android.content.Context;

import androidx.preference.Preference;

import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.text.DateFormat;
import java.util.Date;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class CurrentTimeController extends PreferenceController {
    private final DateFormat mDateFormat;

    public CurrentTimeController(Context context, String key, boolean available, DateFormat dateFormat) {
        super(context, key, available);
        mDateFormat = dateFormat;
    }


    @Override
    public void updateState(Preference preference) {
        preference.setSummary(mDateFormat.format(new Date()));
    }
}
