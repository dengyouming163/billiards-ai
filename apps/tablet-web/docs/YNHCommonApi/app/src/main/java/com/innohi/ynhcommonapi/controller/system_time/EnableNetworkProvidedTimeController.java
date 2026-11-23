package com.innohi.ynhcommonapi.controller.system_time;

import android.content.Context;
import android.util.Log;

import androidx.preference.Preference;
import androidx.preference.SwitchPreferenceCompat;

import com.innohi.ynhcommonapi.controller.base.PreferenceController;

public class EnableNetworkProvidedTimeController extends PreferenceController implements Preference.OnPreferenceChangeListener {

    private static final String TAG = EnableNetworkProvidedTimeController.class.getSimpleName();
    public EnableNetworkProvidedTimeController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        ((SwitchPreferenceCompat) preference).setChecked(mYNHAPI.isEnableNetworkProvidedTime());
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        Log.d(TAG,"onPreferenceChange "+newValue);
        mYNHAPI.setEnableNetworkProvidedTime((boolean) newValue);
        return true;
    }
}
