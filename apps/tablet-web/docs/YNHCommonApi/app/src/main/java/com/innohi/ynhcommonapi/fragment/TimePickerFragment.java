package com.innohi.ynhcommonapi.fragment;

import android.app.Dialog;
import android.app.TimePickerDialog;
import android.os.Bundle;
import android.text.format.DateFormat;
import android.widget.TimePicker;

import androidx.fragment.app.DialogFragment;

import com.innohi.ynhcommonapi.utils.L;

import java.util.Calendar;

/**
 * @author David Chow
 * @since 2021/3/23
 */
public class TimePickerFragment extends DialogFragment
        implements TimePickerDialog.OnTimeSetListener {

    private Callback mCallback;

    public interface Callback {
        void onTimeSet(int hourOfDay, int minute);
    }

    public TimePickerFragment callback(Callback callback) {
        mCallback = callback;
        return this;
    }

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        final Calendar c = Calendar.getInstance();
        int hour = c.get(Calendar.HOUR_OF_DAY);
        int minute = c.get(Calendar.MINUTE);

        return new TimePickerDialog(getActivity(), this, hour, minute,
                DateFormat.is24HourFormat(getActivity()));
    }

    public void onTimeSet(TimePicker view, int hourOfDay, int minute) {
        L.d("time set = " + " hour = " + hourOfDay + ", minute = " + minute);
        if (mCallback != null) {
            mCallback.onTimeSet(hourOfDay, minute);
        }
    }
}