package com.innohi.ynhcommonapi.controller.navigationbar;

import android.content.Context;
import android.util.Log;

import androidx.preference.ListPreference;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

/**
 * @author David Chow
 * @since 2021/11/2
 */
public class NavigationBarVisibilityController extends PreferenceController implements Preference.OnPreferenceChangeListener {
    public NavigationBarVisibilityController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        // TODO: 这里有个小bug，如果手动点击导航栏的隐藏Button，这里并不能及时更新状态
        YNHAPI.NavigationBarVisibility navigationBarVisibility = mYNHAPI.getNavigationBarVisibility();
        ((ListPreference) preference).setValueIndex(navigationBarVisibility.mValue);
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        String visibility = (String) newValue;
        if (visibility.equals("0")) {
            mYNHAPI.setNavigationBarVisibility(YNHAPI.NavigationBarVisibility.INVISIBLE);
        } else if (visibility.equals("1")) {
            mYNHAPI.setNavigationBarVisibility(YNHAPI.NavigationBarVisibility.VISIBLE);
        } else {
            mYNHAPI.setNavigationBarVisibility(YNHAPI.NavigationBarVisibility.ALWAYS_INVISIBLE);
        }
        return true;
    }
}
