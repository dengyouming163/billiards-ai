package com.innohi.ynhcommonapi.controller.wiegand;

import android.content.Context;

import androidx.fragment.app.FragmentManager;

import com.innohi.ynhcommonapi.controller.base.AbsPreferenceCategoryController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.List;

/**
 * @author David Chow
 * @since 2021/5/29
 */
public class WiegandCategoryController extends AbsPreferenceCategoryController {

    private static final String WRITE_WIEGAND = "write_wiegand";
    private static final String READ_WIEGAND = "read_wiegand";
    private static final String WIEGAND_MODE = "wiegand_mode";
    private final FragmentManager mFragmentManager;

    public WiegandCategoryController(Context context, String key, boolean available, FragmentManager fragmentManager) {
        super(context, key, available);
        mFragmentManager = fragmentManager;
    }

    @Override
    protected void fillChildKeys(List<String> keys) {
        keys.add(WRITE_WIEGAND);
        keys.add(READ_WIEGAND);
        keys.add(WIEGAND_MODE);
    }

    @Override
    protected void fillChildControllers(List<PreferenceController> controllers, String key) {
        switch (key) {
            case WRITE_WIEGAND:
                controllers.add(new WiegandWriteController(mContext, key, true, mFragmentManager));
                break;

            case READ_WIEGAND:
                controllers.add(new WiegandReadController(mContext, key, true));
                break;

            case WIEGAND_MODE:
                controllers.add(new WiegandModeController(mContext, key, true));
                break;
        }
    }
}
