package com.innohi.ynhcommonapi.controller.ethernet_set;

import android.content.Context;

import androidx.preference.PreferenceFragmentCompat;

import com.innohi.ynhcommonapi.controller.base.AbsPreferenceCategoryController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.List;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class EthernetSetCategory extends AbsPreferenceCategoryController {
    private static final String KEY_SET_DHCP_IP = "key_set_dhcp_ip";
    private static final String KEY_SET_STATIC_IP = "key_set_static_ip";
    private final PreferenceFragmentCompat mFragment;

    public EthernetSetCategory(Context context, String key, boolean available, PreferenceFragmentCompat fragment) {
        super(context, key, available);
        mFragment = fragment;
    }

    @Override
    protected void fillChildKeys(List<String> keys) {
        keys.add(KEY_SET_DHCP_IP);
        keys.add(KEY_SET_STATIC_IP);
    }


    @Override
    protected void fillChildControllers(List<PreferenceController> controllers, String key) {
        switch (key) {
            case KEY_SET_DHCP_IP:
                controllers.add(new DhcpIpController(mContext, key, true));
                break;

            case KEY_SET_STATIC_IP:
                controllers.add(new StaticIpController(mContext, key, true));
                break;
        }
    }
}
