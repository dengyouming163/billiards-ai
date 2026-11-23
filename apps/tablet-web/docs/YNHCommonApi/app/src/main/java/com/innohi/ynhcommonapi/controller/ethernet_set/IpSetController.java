package com.innohi.ynhcommonapi.controller.ethernet_set;

import android.content.Context;

import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.entity.IpConfig;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class IpSetController extends PreferenceController implements Preference.OnPreferenceChangeListener {


    public IpSetController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        IpConfig ipConfig = mYNHAPI.getIpConfig();
        if (ipConfig != null && ipConfig.ip != null) {
            preference.setSummary(ipConfig.ip);
        }
    }
    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        preference.setSummary((String)newValue);
        return true;
    }
}
