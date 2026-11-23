package com.innohi.ynhcommonapi.controller.apkinstall;

import android.content.Context;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class ApkInstallController extends PreferenceController {

    public ApkInstallController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    protected boolean onClick(Preference preference) {
        L.d("apk install.");
        new AlertDialog.Builder(preference.getContext())
                .setTitle(R.string.install_apk_title)
                .setMessage(R.string.install_apk_msg)
                .setPositiveButton(android.R.string.ok, ((dialog, which) -> mYNHAPI.installApkSilently("/sdcard/Test.apk",null,null)))
                .setNegativeButton(android.R.string.cancel, null)
                .show();
        return true;
    }

}
