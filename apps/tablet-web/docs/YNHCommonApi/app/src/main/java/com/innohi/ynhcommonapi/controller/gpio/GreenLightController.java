package com.innohi.ynhcommonapi.controller.gpio;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.SeekBar;
import android.widget.TextView;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.Preference;
import androidx.preference.SwitchPreferenceCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.LightBrightnessPreferenceController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

/**
 * @author David Chow
 * @since 2021/5/28
 */
public class GreenLightController extends LightBrightnessPreferenceController implements Preference.OnPreferenceChangeListener {

    public GreenLightController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        ((SwitchPreferenceCompat) preference).setChecked(mYNHAPI.getGpioState(YNHAPI.LIGHT_GREEN) == YNHAPI.GpioState.HIGH);
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        boolean on = (boolean) newValue;
//        mYNHAPI.setGpioState(YNHAPI.LIGHT_GREEN, on ? YNHAPI.GpioState.HIGH : YNHAPI.GpioState.LOW);
        mYNHAPI.setLightBrightness(YNHAPI.LIGHT_GREEN, on ? 204 : 0);
        if (on) {
            showBrightnessDialog(YNHAPI.LIGHT_GREEN);
        }
        return true;
    }


}
