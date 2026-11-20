package com.innohi.ynhcommonapi.controller.ethernet;

import android.content.Context;

import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.entity.IpConfig;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

import java.util.Arrays;

/**
 * @author David Chow
 * @since 2021/3/27
 */

public class DnsController extends PreferenceController {

    public DnsController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        IpConfig ipConfig = mYNHAPI.getIpConfig();
        if (ipConfig != null && ipConfig.dnsList != null) {
            // TODO: dns为一个列表
            preference.setSummary(ipConfig.dnsList.get(0));
        }
    }
}