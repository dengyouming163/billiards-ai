package com.innohi.ynhcommonapi.controller.system_time;

import android.content.Context;

import androidx.preference.PreferenceFragmentCompat;

import com.innohi.ynhcommonapi.controller.base.AbsPreferenceCategoryController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class TimeCategoryController extends AbsPreferenceCategoryController {
    private static final String KEY_CURRENT_TIME = "key_current_time";
    private static final String KEY_SET_TIME = "key_set_time";
    private static final String KEY_ENABLE_NETWORK_PROVIDED_TIME = "key_enable_network_provided_time";
    private final PreferenceFragmentCompat mFragment;
    private final DateFormat mDateFormat;

    public TimeCategoryController(Context context, String key, boolean available, PreferenceFragmentCompat fragment) {
        super(context, key, available);
        mFragment = fragment;
        mDateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm", Locale.US);
    }


    @Override
    protected void fillChildKeys(List<String> keys) {
        keys.add(KEY_CURRENT_TIME);
        keys.add(KEY_SET_TIME);
        keys.add(KEY_ENABLE_NETWORK_PROVIDED_TIME);
    }


    @Override
    protected void fillChildControllers(List<PreferenceController> controllers, String key) {
        switch (key) {
            case KEY_CURRENT_TIME:
                controllers.add(new CurrentTimeController(mContext, key, true, mDateFormat));
                break;

            case KEY_SET_TIME:
                controllers.add(new SetSystemTimeController(mContext, key, true, mFragment, mDateFormat));
                break;

            case KEY_ENABLE_NETWORK_PROVIDED_TIME:
                controllers.add(new EnableNetworkProvidedTimeController(mContext, key, true));
                break;
        }
    }

}
