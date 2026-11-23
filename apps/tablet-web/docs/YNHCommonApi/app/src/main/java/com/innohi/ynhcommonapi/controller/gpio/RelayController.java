package com.innohi.ynhcommonapi.controller.gpio;

import android.content.Context;

import androidx.preference.Preference;
import androidx.preference.SwitchPreferenceCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

/**
 * @author David Chow
 * @since 2021/5/28
 */
public class RelayController extends PreferenceController implements Preference.OnPreferenceChangeListener {
    public RelayController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        YNHAPI.GpioState state = mYNHAPI.getGpioState(YNHAPI.RELAY);
        ((SwitchPreferenceCompat) preference).setChecked(state == YNHAPI.GpioState.HIGH);
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        return mYNHAPI.setGpioState(YNHAPI.RELAY, ((boolean) newValue) ? YNHAPI.GpioState.HIGH : YNHAPI.GpioState.LOW);
    }
}
