package com.innohi.ynhcommonapi.controller.system_time;

import android.content.Context;
import android.os.Message;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.ThreadCommPreferenceController;
import com.innohi.ynhcommonapi.fragment.DatePickerFragment;
import com.innohi.ynhcommonapi.fragment.TimePickerFragment;
import com.innohi.ynhcommonapi.utils.L;

import java.text.DateFormat;
import java.util.Calendar;
import java.util.Date;

/**
 * @author David Chow
 * @since 2021/3/27
 */

public class SetSystemTimeController extends ThreadCommPreferenceController {
    private PreferenceFragmentCompat mFragment;
    private static final int MSG_UPDATE_CURRENT_TIME = 0x01;
    private final DateFormat mDateFormat;

    public SetSystemTimeController(Context context, String key, boolean available, PreferenceFragmentCompat fragmentCompat, DateFormat dateFormat) {
        super(context, key, available);
        mFragment = fragmentCompat;
        mDateFormat = dateFormat;
    }

    @Override
    public boolean onClick(Preference preference) {
        L.d("time set");
        new DatePickerFragment().callback((year, month, day) ->
                new TimePickerFragment().callback((hour, minute) -> {
                            L.d("set time : year = " + year + ", month = " + month + ", day = " + day + ", hour = " + hour + ", minute = " + minute);
                            Calendar calendar = Calendar.getInstance();
                            calendar.set(year, month, day, hour, minute);
                            mYNHAPI.setSystemTime(calendar.getTimeInMillis());
                            // There is no broadcast in system to handle time set action, so we only
                            // update current 1000ms delay.
                            Message message = mUIHandler.obtainMessage();
                            message.what = MSG_UPDATE_CURRENT_TIME;
                            message.obj = preference;
                            mUIHandler.sendMessageDelayed(message, 1000);

                        }
                ).show(mFragment.getChildFragmentManager(), "time_set_time_picker"))
                .show(mFragment.getChildFragmentManager(), "time_set_date_picker");
        return true;
    }

    @Override
    public void handleUIMessage(Message msg) {
        if (msg.what == MSG_UPDATE_CURRENT_TIME) {
            Preference preference = (Preference) msg.obj;
            Preference currentTimePreference = preference.getPreferenceManager().findPreference("key_current_time");
            if (currentTimePreference != null) {
                L.d("update current time.");
                currentTimePreference.setSummary((mDateFormat.format(new Date())));
            }
            new AlertDialog.Builder(mContext)
                    .setMessage("请观察当前时间是否与设置的时间一致！")
                    .setPositiveButton(android.R.string.ok, null)
                    .show();
        }
    }
}
