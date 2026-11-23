package com.innohi.ynhcommonapi.controller.ethernet;

import android.content.Context;

import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.entity.IpConfig;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

/**
 * @author David Chow
 * @since 2021/3/27
 */

public class GatewayController extends PreferenceController {

    public GatewayController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        IpConfig ipConfig = mYNHAPI.getIpConfig();
        if (ipConfig != null && ipConfig.gateway != null) {
            preference.setSummary(ipConfig.gateway);
        }
    }
}