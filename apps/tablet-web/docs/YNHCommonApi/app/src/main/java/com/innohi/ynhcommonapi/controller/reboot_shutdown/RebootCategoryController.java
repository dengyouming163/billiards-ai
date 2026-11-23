package com.innohi.ynhcommonapi.controller.reboot_shutdown;

import android.content.Context;

import com.innohi.ynhcommonapi.controller.base.AbsPreferenceCategoryController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.List;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class RebootCategoryController extends AbsPreferenceCategoryController {
    private static final String KEY_REBOOT = "key_reboot";
    private static final String KEY_SHUTDOWN = "key_shutdown";

    public RebootCategoryController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    protected void fillChildKeys(List<String> keys) {
        keys.add(KEY_REBOOT);
        keys.add(KEY_SHUTDOWN);
    }

    @Override
    protected void fillChildControllers(List<PreferenceController> controllers, String key) {
        switch (key) {
            case KEY_REBOOT:
                controllers.add(new RebootController(mContext, key, true));
                break;

            case KEY_SHUTDOWN:
                controllers.add(new ShutdownController(mContext, key, true));
                break;
        }

    }
}
