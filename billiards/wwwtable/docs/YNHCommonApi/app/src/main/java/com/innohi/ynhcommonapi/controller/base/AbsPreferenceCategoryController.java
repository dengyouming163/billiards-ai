package com.innohi.ynhcommonapi.controller.base;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import androidx.preference.Preference;
import androidx.preference.PreferenceCategory;
import androidx.preference.PreferenceGroup;
import androidx.preference.PreferenceScreen;

import com.innohi.ynhcommonapi.utils.L;

import java.util.ArrayList;
import java.util.List;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public abstract class AbsPreferenceCategoryController extends PreferenceController {
    private List<PreferenceController> mChildControllers;
    private List<String> mChildKeys;
    private List<Preference> mChildPreferences;

    public AbsPreferenceCategoryController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    protected List<String> getChildKeys() {
        if (mChildKeys == null) {
            mChildKeys = new ArrayList<>();
            fillChildKeys(mChildKeys);
        }
        return mChildKeys;
    }

    protected abstract void fillChildKeys(List<String> keys);

    protected int getChildSize() {
        return getChildKeys().size();
    }

    protected List<PreferenceController> getChildControllers() {
        if (mChildControllers == null) {
            mChildControllers = new ArrayList<>();
            for (String key : getChildKeys()) {
                fillChildControllers(mChildControllers, key);
            }
        }
        return mChildControllers;
    }

    protected abstract void fillChildControllers(List<PreferenceController> controllers, String key);

    protected boolean dynamicCreatePreference() {
        return false;
    }

    protected List<Preference> getChildPreferences() {
        if (mChildPreferences == null) {
            mChildPreferences = new ArrayList<>();
            for (String key : getChildKeys()) {
                fillChildPreferences(mChildPreferences, key);
            }
        }
        return mChildPreferences;
    }

    protected void fillChildPreferences(List<Preference> preferenceList, String key) {

    }

    @Override
    public void updateState(Preference preference) {
        List<PreferenceController> childControllers = getChildControllers();
        PreferenceGroup group = (PreferenceGroup) preference;
        for (PreferenceController controller : childControllers) {
            if (controller.isAvailable()) {
                controller.updateState(group.findPreference(controller.getKey()));
            }
        }
    }

    @Override
    public void displayPreference(PreferenceScreen screen) {
        if (isAvailable()) {
            if (dynamicCreatePreference()) {
                List<Preference> childPreferences = getChildPreferences();
                if (childPreferences == null || childPreferences.size() == 0) {
                    L.e("Couldn't find child preferences!");
                    return;
                }
                PreferenceCategory preferenceCategory = screen.findPreference(getKey());
                if (preferenceCategory == null) {
                    L.e("Couldn't find preference category with " + getKey() + " key!");
                    return;
                }

                for (int i = 0; i < childPreferences.size(); i++) {
                    Preference preference = childPreferences.get(i);
                    PreferenceController controller = getControllerByKey(preference.getKey());
                    if (controller == null || !controller.isAvailable()) {
                        continue;
                    }
                    preferenceCategory.addPreference(preference);
                }

                for (int i = 0; i < getChildKeys().size(); i++) {
                    String key = getChildKeys().get(i);
                    Preference child = screen.findPreference(key);
                    if (child == null) {
                        L.e("Category with " + getKey() + " key couldn't find preference with " + key + " key!");
                        continue;
                    }
                    PreferenceController controller = getControllerByKey(key);
                    if (controller == null) {
                        L.e("Category with " + getKey() + " key couldn't find preference controller with " + key + " key!");
                        continue;
                    }
                    if (!controller.isAvailable()) {
                        removePreference(screen, child.getKey());
                    }
                    if (!(controller instanceof AbsPreferenceCategoryController)) {
                        if (controller instanceof Preference.OnPreferenceChangeListener) {
                            child.setOnPreferenceChangeListener((Preference.OnPreferenceChangeListener) controller);
                        }
                    }
                }
            } else {
                for (int i = 0; i < getChildKeys().size(); i++) {
                    String key = getChildKeys().get(i);
                    Preference child = screen.findPreference(key);
                    if (child == null) {
                        L.e("Category with " + getKey() + " key couldn't find preference with " + key + " key!");
                        continue;
                    }
                    PreferenceController controller = getControllerByKey(key);
                    if (controller == null) {
                        L.e("Category with " + getKey() + " key couldn't find preference controller with " + key + " key!");
                        continue;
                    }
                    if (!controller.isAvailable()) {
                        removePreference(screen, child.getKey());
                    }
                    if (controller instanceof Preference.OnPreferenceChangeListener) {
                        child.setOnPreferenceChangeListener((Preference.OnPreferenceChangeListener) controller);
                    }
                }
            }
        } else {
            removePreference(screen, getKey());
        }
    }

    private PreferenceController getControllerByKey(String key) {
        if (TextUtils.isEmpty(key)) {
            return null;
        }
        final List<PreferenceController> controllers = getChildControllers();
        for (PreferenceController controller : controllers) {
            if (key.equals(controller.getKey())) {
                return controller;
            }
        }
        return null;
    }


    @Override
    public boolean performClick(Preference preference) {
        // preference without key doesn't has a controller.
        if (preference.getKey() == null) {
            return false;
        }
        final List<PreferenceController> childController = getChildControllers();
        for (int i = 0; i < childController.size(); i++) {
            PreferenceController controller = childController.get(i);
            // controller only handle its own preference.
            if (controller.isAvailable() && preference.getKey().equals(controller.getKey()) && controller.performClick(preference)) {
                return true;
            }
        }
        return super.performClick(preference);
    }
}
