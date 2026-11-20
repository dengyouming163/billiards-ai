package com.innohi.ynhcommonapi.controller.watchdog;

import android.content.Context;

import com.innohi.ynhcommonapi.controller.base.AbsPreferenceCategoryController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.List;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class WatchdogCategoryController extends AbsPreferenceCategoryController {
    private static final String TOGGLE_WATCHDOG = "toggle_watchdog";
    private static final String FEED_WATCHDOG = "feed_watchdog";

    public WatchdogCategoryController(Context context, String key, boolean available) {
        super(context, key, available);
    }


    @Override
    protected void fillChildKeys(List<String> keys) {
        keys.add(TOGGLE_WATCHDOG);
        keys.add(FEED_WATCHDOG);
    }

    @Override
    protected void fillChildControllers(List<PreferenceController> controllers, String key) {
        switch (key) {
            case TOGGLE_WATCHDOG:
                controllers.add(new ToggleWatchdogController(mContext, key, true));
                break;

            case FEED_WATCHDOG:
                controllers.add(new FeedWatchdog(mContext, key, true));
                break;
        }
    }
}
