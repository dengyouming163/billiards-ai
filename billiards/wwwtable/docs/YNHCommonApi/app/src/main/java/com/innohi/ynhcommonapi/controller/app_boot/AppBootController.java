package com.innohi.ynhcommonapi.controller.app_boot;

import android.content.Context;

import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

/**
 * @author David Chow
 * @since 2021/8/18
 */
public class AppBootController extends PreferenceController implements Preference.OnPreferenceChangeListener {
    public AppBootController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        L.d("set boot apk package : " + mContext.getPackageName());
        mYNHAPI.setBootLaunchApk(mContext.getPackageName(), (boolean) newValue);
        return true;
    }
}
