package com.innohi.ynhcommonapi.controller.app_boot;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import androidx.preference.ListPreference;
import androidx.preference.Preference;

import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.Map;

/**
 * @author David Chow
 * @since 2021/8/18
 */
public class AppKeepLiveController extends PreferenceController implements Preference.OnPreferenceChangeListener {
    private static final String TAG = "AppKeepLiveController";
    public AppKeepLiveController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        Map<String, String> infos = mInternalApi.get3rdAppInfo();
        String[] names = infos.keySet().toArray(new String[0]);
        String[] packages = infos.values().toArray(new String[0]);
        String[] entries = new String[names.length];
        String[] values = new String[packages.length];
        System.arraycopy(names, 0, entries, 0, names.length);
        System.arraycopy(packages, 0, values, 0, packages.length);
        ListPreference listPreference = (ListPreference) preference;
        listPreference.setEntries(entries);
        listPreference.setEntryValues(values);
    }

    @Override
    protected boolean onClick(Preference preference) {
        Log.d(TAG, "onClick~~");
        updateState(preference);
        return true;
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        Log.d(TAG, "onPreferenceChange ~~ "+newValue);
        String pkg = (String) newValue;
        mYNHAPI.setAppKeepLive(pkg,10);
        return true;
    }

}
