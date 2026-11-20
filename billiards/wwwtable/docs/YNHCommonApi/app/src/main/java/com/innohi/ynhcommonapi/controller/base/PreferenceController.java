package com.innohi.ynhcommonapi.controller.base;

import android.content.Context;

import androidx.preference.Preference;
import androidx.preference.PreferenceGroup;
import androidx.preference.PreferenceScreen;

import com.innohi.YNHAPI;
import com.internal.InnohiInternalApi;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class PreferenceController {
    protected final Context mContext;
    protected final boolean mAvailable;
    protected final String mKey;
    protected InnohiInternalApi mInternalApi;
    protected YNHAPI mYNHAPI;

    public PreferenceController(Context context, String key, boolean available) {
        mContext = context;
        mYNHAPI = YNHAPI.getInstance();
        mInternalApi = InnohiInternalApi.getInstance();
        mAvailable = available;
        mKey = key;
    }

    public String getKey() {
        return mKey;
    }

    /**
     * 如果有其它Preference依赖当前Preference，那么双方的isAvailable()的返回值要一致。
     */
    public boolean isAvailable() {
        return mAvailable;
    }

    public void updateState(Preference preference) {

    }

    public void displayPreference(PreferenceScreen screen) {
        if (isAvailable()) {
            if (this instanceof Preference.OnPreferenceChangeListener) {
                final Preference preference = screen.findPreference(getKey());
                if (preference != null) {
                    preference.setOnPreferenceChangeListener((Preference.OnPreferenceChangeListener) this);
                }
            }
        } else {
            removePreference(screen, getKey());
        }
    }

    protected final void removePreference(PreferenceScreen screen, String key) {
        findAndRemovePreference(screen, key);
    }

    private boolean findAndRemovePreference(PreferenceGroup prefGroup, String key) {
        final int preferenceCount = prefGroup.getPreferenceCount();
        for (int i = 0; i < preferenceCount; i++) {
            final Preference preference = prefGroup.getPreference(i);
            final String curKey = preference.getKey();

            if (curKey != null && curKey.equals(key)) {
                return prefGroup.removePreference(preference);
            }

            if (preference instanceof PreferenceGroup) {
                if (findAndRemovePreference((PreferenceGroup) preference, key)) {
                    return true;
                }
            }
        }
        return false;
    }

    public boolean performClick(Preference preference) {
        // controller only handle its own preference.
        if (getKey() != null && preference.getKey() != null && getKey().equals(preference.getKey())) {
            return onClick(preference);
        }
        return false;
    }

    protected boolean onClick(Preference preference) {
        return false;
    }
}
