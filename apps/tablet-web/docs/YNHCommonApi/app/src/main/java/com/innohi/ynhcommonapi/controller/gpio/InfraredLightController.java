package com.innohi.ynhcommonapi.controller.gpio;

import android.content.Context;

import androidx.preference.Preference;
import androidx.preference.SwitchPreferenceCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.LightBrightnessPreferenceController;

public class InfraredLightController extends LightBrightnessPreferenceController implements Preference.OnPreferenceChangeListener {
    public InfraredLightController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        ((SwitchPreferenceCompat) preference).setChecked(mYNHAPI.getGpioState(YNHAPI.LIGHT_INFRARED) == YNHAPI.GpioState.HIGH);
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        boolean on = (boolean) newValue;
        mYNHAPI.setLightBrightness(YNHAPI.LIGHT_INFRARED, on ? 204 : 0);
        if (on) {
            showBrightnessDialog(YNHAPI.LIGHT_INFRARED);
        }
        return true;
    }


}
