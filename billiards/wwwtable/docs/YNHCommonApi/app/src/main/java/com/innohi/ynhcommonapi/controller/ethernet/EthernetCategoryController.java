package com.innohi.ynhcommonapi.controller.ethernet;

import android.content.Context;

import com.innohi.ynhcommonapi.controller.base.AbsPreferenceCategoryController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.List;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class EthernetCategoryController extends AbsPreferenceCategoryController {

    private static final String KEY_IP = "key_ip";
    private static final String KEY_MASK = "key_mask";
    private static final String KEY_GATEWAY = "key_gateway";
    private static final String KEY_DNS = "key_dns";

    public EthernetCategoryController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    protected void fillChildKeys(List<String> keys) {
        keys.add(KEY_IP);
        keys.add(KEY_MASK);
        keys.add(KEY_GATEWAY);
        keys.add(KEY_DNS);
    }

    @Override
    protected void fillChildControllers(List<PreferenceController> controllers, String key) {
        switch (key) {
            case KEY_IP:
                controllers.add(new IPController(mContext, key, true));
                break;

            case KEY_MASK:
                controllers.add(new MaskController(mContext, key, true));
                break;

            case KEY_GATEWAY:
                controllers.add(new GatewayController(mContext, key, true));
                break;

            case KEY_DNS:
                controllers.add(new DnsController(mContext, key, true));
                break;
        }
    }
}
