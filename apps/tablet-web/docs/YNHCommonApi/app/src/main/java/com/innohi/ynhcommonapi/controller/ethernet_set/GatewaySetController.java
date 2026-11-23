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
public class GatewaySetController extends PreferenceController implements Preference.OnPreferenceChangeListener {

    public GatewaySetController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        IpConfig ipConfig = mYNHAPI.getIpConfig();
        if (ipConfig != null && ipConfig.gateway != null) {
            preference.setSummary(ipConfig.gateway);
        }
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        preference.setSummary((String)newValue);
        return true;
    }
}
