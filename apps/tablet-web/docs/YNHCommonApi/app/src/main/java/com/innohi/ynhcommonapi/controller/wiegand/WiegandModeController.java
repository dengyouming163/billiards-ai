package com.innohi.ynhcommonapi.controller.wiegand;

import android.content.Context;

import androidx.preference.ListPreference;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

/**
 * @author David Chow
 * @since 2021/5/29
 */
public class WiegandModeController extends PreferenceController implements Preference.OnPreferenceChangeListener {
    public WiegandModeController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        int wiegandMode = YNHAPI.getWiegandMode();
        ListPreference listPreference = (ListPreference) preference;
        listPreference.setValueIndex(wiegandMode);
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        String wiegandMode = (String) newValue;
        // TODO: 这个API要重新设计
        YNHAPI.setWiegandMode(wiegandMode.equals("1") ? YNHAPI.Wiegand.Wiegand_Output34 : YNHAPI.Wiegand.Wiegand_Input);
        return true;
    }
}
