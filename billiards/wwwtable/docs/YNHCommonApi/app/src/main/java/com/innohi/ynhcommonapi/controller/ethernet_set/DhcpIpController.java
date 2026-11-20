package com.innohi.ynhcommonapi.controller.ethernet_set;

import android.content.Context;
import android.util.Log;

import androidx.preference.Preference;
import androidx.preference.SwitchPreferenceCompat;

import com.innohi.YNHAPI;
import com.innohi.entity.IpConfig;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

/**
 * @author David Chow
 * @since 2021/11/10
 */
public class DhcpIpController extends PreferenceController implements Preference.OnPreferenceChangeListener {
    public DhcpIpController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        super.updateState(preference);
        ((SwitchPreferenceCompat) preference).setChecked(mYNHAPI.getIpMode() == YNHAPI.IpMode.DHCP);
    }


    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        boolean dhcp = (boolean) newValue;
        preference.getPreferenceManager().findPreference("key_set_static_ip").setEnabled(!dhcp);
        if (dhcp) {
            mYNHAPI.setDhcpIp();
        } else {
            IpConfig ipConfig = mYNHAPI.getIpConfig();
            mYNHAPI.setStaticIp(ipConfig);
        }
        return true;
    }
}
