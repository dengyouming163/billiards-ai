package com.innohi.ynhcommonapi.fragment;

import android.app.DatePickerDialog;
import android.app.Dialog;
import android.os.Bundle;
import android.widget.DatePicker;

import androidx.fragment.app.DialogFragment;

import com.innohi.ynhcommonapi.utils.L;

import java.util.Calendar;

/**
 * @author David Chow
 * @since 2021/3/23
 */
public class DatePickerFragment extends DialogFragment
        implements DatePickerDialog.OnDateSetListener {
    private Callback mCallback;

    public interface Callback {
        void onDateSet(int year, int month, int day);
    }

    public DatePickerFragment callback(Callback callback) {
        mCallback = callback;
        return this;
    }

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        final Calendar c = Calendar.getInstance();
        int year = c.get(Calendar.YEAR);
        int month = c.get(Calendar.MONTH);
        int day = c.get(Calendar.DAY_OF_MONTH);

        return new DatePickerDialog(getActivity(), this, year, month, day);
    }

    public void onDateSet(DatePicker view, int year, int month, int day) {
        L.d("date: year = " + year + ", month = " + month + ", day = " + day);
        if (mCallback != null) {
            // 注意：这里的month是从0计数的
            mCallback.onDateSet(year, month + 1, day);
        }
    }
}