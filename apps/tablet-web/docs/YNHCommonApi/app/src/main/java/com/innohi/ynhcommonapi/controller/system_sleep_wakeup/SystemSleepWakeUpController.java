package com.innohi.ynhcommonapi.controller.system_sleep_wakeup;

import android.content.Context;
import android.os.PowerManager;

import androidx.preference.Preference;
import androidx.preference.SwitchPreferenceCompat;

import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class SystemSleepWakeUpController extends PreferenceController implements Preference.OnPreferenceChangeListener {

    private final PowerManager mPowerManager;

    public SystemSleepWakeUpController(Context context, String key, boolean available) {
        super(context, key, available);
        mPowerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
    }

    @Override
    public void updateState(Preference preference) {
        ((SwitchPreferenceCompat) preference).setChecked(mPowerManager.isScreenOn());
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        boolean screenOn = (boolean) newValue;
        if (screenOn) {
            L.d("screen wakeup.");
            mYNHAPI.wakeUp();
        } else {
            L.d("screen sleep.");
            mYNHAPI.sleep();
        }
        return true;
    }
}
