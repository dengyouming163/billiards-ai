package com.innohi.ynhcommonapi.controller.timing;

import android.content.Context;

import androidx.preference.PreferenceFragmentCompat;

import com.innohi.ynhcommonapi.controller.base.AbsPreferenceCategoryController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.List;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class PowerOnOffCategoryController extends AbsPreferenceCategoryController {
    private static final String KEY_SET_TIMING_SHUTDOWN = "key_set_timing_shutdown";
    private static final String KEY_SET_TIMING_BOOT = "key_set_timing_boot";
    private static final String KEY_SUBMIT_TIMING_DATA = "key_submit_timing_data";
    private static final String KEY_CLEAR_TIMING = "key_clear_timing";
    private PreferenceFragmentCompat mFragment;

    public PowerOnOffCategoryController(Context context, String key, boolean available, PreferenceFragmentCompat fragment) {
        super(context, key, available);
        mFragment = fragment;
    }


    @Override
    protected void fillChildKeys(List<String> keys) {
        keys.add(KEY_SET_TIMING_SHUTDOWN);
        keys.add(KEY_SET_TIMING_BOOT);
        keys.add(KEY_SUBMIT_TIMING_DATA);
        keys.add(KEY_CLEAR_TIMING);
    }


    @Override
    protected void fillChildControllers(List<PreferenceController> controllers, String key) {
        switch (key) {
            case KEY_SET_TIMING_SHUTDOWN:
                controllers.add(new PowerOffTimeController(mContext, key, true, mFragment));
                break;

            case KEY_SET_TIMING_BOOT:
                controllers.add(new PowerOnTimeController(mContext, key, true, mFragment));
                break;

            case KEY_SUBMIT_TIMING_DATA:
                controllers.add(new PowerOnOffSubmitController(mContext, key, true, mFragment));
                break;

            case KEY_CLEAR_TIMING:
                controllers.add(new CancelPowerOnOffController(mContext, key, true, mFragment));
                break;

        }
    }


}
