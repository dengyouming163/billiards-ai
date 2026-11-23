package com.innohi.ynhcommonapi.controller.watchdog;

import android.content.Context;

import androidx.preference.Preference;
import androidx.preference.SwitchPreferenceCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class ToggleWatchdogController extends PreferenceController implements Preference.OnPreferenceChangeListener {


    public ToggleWatchdogController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        // TODO: 由于暂时不能获取看门狗是否开启的状态，因此在进入APP时，SwitchPreferenceCompat强制设置为unchecked状态
        ((SwitchPreferenceCompat) preference).setChecked(false);
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        boolean open = (boolean) newValue;
        mYNHAPI.enableWatchdog(open);
        return true;
    }
}
