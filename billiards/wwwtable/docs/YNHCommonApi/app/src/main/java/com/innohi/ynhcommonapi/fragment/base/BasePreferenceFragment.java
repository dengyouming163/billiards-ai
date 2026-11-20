package com.innohi.ynhcommonapi.fragment.base;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;
import androidx.preference.PreferenceScreen;

import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.List;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public abstract class BasePreferenceFragment extends PreferenceFragmentCompat {
    private static final String TAG = "BasePreferenceFragment";

    public abstract int getXml();

    public abstract List<PreferenceController> getControllers(Context context);

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        updatePreferenceStates();
    }

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
        refreshAllPreferences();
    }

    private void refreshAllPreferences() {
        // TODO: 为何要先移除
        // First remove old preferences.
        if (getPreferenceScreen() != null) {
            // Intentionally do not cache PreferenceScreen because it will be recreated later.
            getPreferenceScreen().removeAll();
        }

        // 添加xml资源
        addPreferencesFromResource(getXml());

        // 通过Controller决定是否显示
        final PreferenceScreen screen = getPreferenceScreen();
        List<PreferenceController> controllers = getControllers(getContext());
        for (PreferenceController controller : controllers) {
            controller.displayPreference(screen);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        updatePreferenceStates();
    }


    protected void updatePreferenceStates() {
        List<PreferenceController> controllers = getControllers(getContext());
        for (PreferenceController controller : controllers) {
            if (!controller.isAvailable()) {
                continue;
            }
            final String key = controller.getKey();

            final Preference preference = findPreference(key);
            // TODO: 看看log什么时候为空？
            if (preference == null) {
                Log.d(TAG, String.format("Cannot find preference with key %s in Controller %s",
                        key, controller.getClass().getSimpleName()));
                continue;
            }
            controller.updateState(preference);
        }
    }

    @Override
    public boolean onPreferenceTreeClick(Preference preference) {
        List<PreferenceController> controllers = getControllers(getContext());
        for (PreferenceController controller : controllers) {
            // 让每个Controller都有机会处理Preference，这样就可以获取依赖的Preference的一些状态，从而更新自己
            // 如果有多个Controller要处理同一个Preference点击事件，要自己决定哪一个返回true，一般是Controller处理自己的Preference时返回true。
            // AbsPreferenceController类中提供了一个便捷的方法samePreference()，可用于判断Controller处理的是否是自己的Preference。
            if (controller.performClick(preference)) {
                return true;
            }
        }
        return super.onPreferenceTreeClick(preference);
    }
}
