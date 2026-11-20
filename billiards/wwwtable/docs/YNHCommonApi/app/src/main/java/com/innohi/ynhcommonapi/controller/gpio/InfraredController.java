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
public class InfraredController extends PreferenceController implements Preference.OnPreferenceChangeListener {
    public InfraredController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        ((SwitchPreferenceCompat) preference).setChecked(mYNHAPI.getGpioState(YNHAPI.LIGHT_INFRARED) == YNHAPI.GpioState.HIGH);
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        return mYNHAPI.setGpioState(YNHAPI.LIGHT_INFRARED, ((boolean) newValue) ? YNHAPI.GpioState.HIGH : YNHAPI.GpioState.LOW);
    }
}
