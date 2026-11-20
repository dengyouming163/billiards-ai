package com.innohi.ynhcommonapi.controller.apkinstall;

import android.content.Context;

import androidx.fragment.app.FragmentManager;

import com.innohi.ynhcommonapi.controller.base.AbsPreferenceCategoryController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.List;

public class AllowInstallPackageCategoryController extends AbsPreferenceCategoryController {

    private static final String KEY_ALLOW_INSTALL_PACKAGE = "key_allow_install_package";
    private static final String KEY_ALLOW_INSTALL_TYPE = "key_allow_install_type";
    private static final String KEY_ALLOW_INSTALL_PASSWORD = "key_allow_install_password";
    private FragmentManager mFragmentManager = null;

    public AllowInstallPackageCategoryController(Context context, String key, boolean available, FragmentManager fragmentManager) {
        super(context, key, available);
        mFragmentManager = fragmentManager;
    }

    @Override
    protected void fillChildKeys(List<String> keys) {
        keys.add(KEY_ALLOW_INSTALL_PACKAGE);
        keys.add(KEY_ALLOW_INSTALL_TYPE);
        keys.add(KEY_ALLOW_INSTALL_PASSWORD);
    }

    @Override
    protected void fillChildControllers(List<PreferenceController> controllers, String key) {
        switch (key) {
            case KEY_ALLOW_INSTALL_PACKAGE:
                controllers.add(new AllowInstallPackageController(mContext,key,true,mFragmentManager));
                break;
            case KEY_ALLOW_INSTALL_TYPE:
                controllers.add(new AllowInstallPackageTypeController(mContext,key,true));
                break;
            case KEY_ALLOW_INSTALL_PASSWORD:
                controllers.add(new AllowInstallPackagePasswordController(mContext,key,true));
                break;
        }
    }
}
