package com.innohi.ynhcommonapi.controller.ethernet_set;

import android.content.Context;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;

import com.innohi.YNHAPI;
import com.innohi.entity.IpConfig;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

import java.util.Arrays;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class EthernetSubmitController extends PreferenceController {
    private PreferenceFragmentCompat mFragment;

    public EthernetSubmitController(Context context, String key, boolean available, PreferenceFragmentCompat fragment) {
        super(context, key, available);
        mFragment = fragment;
    }

    @Override
    public boolean onClick(Preference preference) {
        String ip = (String) mFragment.findPreference("key_set_ip").getSummary();
        String mask = (String) mFragment.findPreference("key_ethernet_mask").getSummary();
        String gateway = (String) mFragment.findPreference("key_ethernet_gateway").getSummary();
        String dns = (String) mFragment.findPreference("key_ethernet_dns").getSummary();
        L.d("submit ethernet data: ip = " + ip + ", mask = " + mask + ", gateway = " + gateway + ", dns = " + dns);
        IpConfig ipConfig = mYNHAPI.getIpConfig();
        if (ipConfig != null  && ip.equals(ipConfig.ip)
                && mask.equals(ipConfig.mask) && gateway.equals(ipConfig.gateway) && dns.equals(ipConfig.dnsList.get(0))) {
            new AlertDialog.Builder(mContext)
                    .setMessage(R.string.same_data)
                    .setPositiveButton(android.R.string.ok, null)
                    .show();
        } else {
            new AlertDialog.Builder(mContext)
                    .setMessage(R.string.submit_ip_data_msg)
                    .setPositiveButton(android.R.string.ok, (dialog, which) ->
                            mYNHAPI.setStaticIp(new IpConfig(ip, mask, gateway, Arrays.asList(dns))))
                    .setNegativeButton(android.R.string.cancel, null)
                    .show();
        }
        return true;
    }
}
