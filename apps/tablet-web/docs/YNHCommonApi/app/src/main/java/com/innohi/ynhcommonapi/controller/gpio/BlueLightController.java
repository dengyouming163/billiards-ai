package com.innohi.ynhcommonapi.controller.gpio;

import android.content.Context;

import androidx.preference.Preference;
import androidx.preference.SwitchPreferenceCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.LightBrightnessPreferenceController;

/**
 * @author David Chow
 * @since 2021/5/28
 */
public class BlueLightController extends LightBrightnessPreferenceController implements Preference.OnPreferenceChangeListener {
    public BlueLightController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        ((SwitchPreferenceCompat) preference).setChecked(mYNHAPI.getGpioState(YNHAPI.LIGHT_BLUE) == YNHAPI.GpioState.HIGH);
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        boolean on = (boolean) newValue;
//        mYNHAPI.setGpioState(YNHAPI.LIGHT_BLUE, on ? YNHAPI.GpioState.HIGH : YNHAPI.GpioState.LOW);
        mYNHAPI.setLightBrightness(YNHAPI.LIGHT_BLUE, on ? 204 : 0);
        if (on) {
            showBrightnessDialog(YNHAPI.LIGHT_BLUE);
        }
        return true;
    }


}
    