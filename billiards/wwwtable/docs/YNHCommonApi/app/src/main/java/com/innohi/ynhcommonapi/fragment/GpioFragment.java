package com.innohi.ynhcommonapi.fragment;

import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.preference.ListPreference;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.GpioActivity;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.utils.L;

/**
 * @author David Chow
 * @since 2021/6/15
 */
public class GpioFragment extends PreferenceFragmentCompat implements Preference.OnPreferenceChangeListener {
    private static final String TAG = GpioFragment.class.getSimpleName();
    private static final String KEY_GPIO_MODE = "gpio_mode";
    private static final String KEY_SET_GPIO_STATE = "set_gpio_state";
    private static final String KEY_GPIO_STATE = "gpio_state";
    private ListPreference mGpioModeListPrefence;
    private ListPreference mSetStateListPreference;
    private Preference mStatePreference;
    private int mGpioIndex = -1;

    private YNHAPI.GpioListenerCallback mCallback = null;

    private YNHAPI mYNHAPI = YNHAPI.getInstance();

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
        addPreferencesFromResource(R.xml.gpio_fragment);

        mGpioIndex = getArguments().getInt(GpioActivity.GPIO_INDEX, -1);
        L.d("gpio index = " + mGpioIndex);
        if (mGpioIndex == -1) {
            throw new IllegalStateException("index must >= 0");
        }

        mGpioModeListPrefence = findPreference(KEY_GPIO_MODE);
        mStatePreference = findPreference(KEY_GPIO_STATE);
        mSetStateListPreference = findPreference(KEY_SET_GPIO_STATE);
        mGpioModeListPrefence.setOnPreferenceChangeListener(this);
        mSetStateListPreference.setOnPreferenceChangeListener(this);

        mYNHAPI.setGpioMode(mGpioIndex, YNHAPI.GpioMode.OUTPUT);
        mYNHAPI.setGpioState(mGpioIndex, YNHAPI.GpioState.HIGH);

        YNHAPI.GpioMode mode = mYNHAPI.getGpioMode(mGpioIndex);
        YNHAPI.GpioState state = mYNHAPI.getGpioState(mGpioIndex);
        Log.d(TAG, "init: mode =" + mode + ", state = " + state);
        if (mode == YNHAPI.GpioMode.UNKNOWN || state == YNHAPI.GpioState.UNKNOWN) {
            Toast.makeText(getContext(), "无法正确获取获取GPIO的模式/状态!", Toast.LENGTH_SHORT).show();
            mGpioModeListPrefence.setEnabled(false);
            mSetStateListPreference.setEnabled(false);
            mStatePreference.setEnabled(false);
            return;
        }

        mGpioModeListPrefence.setValueIndex(mode.mValue);
        mGpioModeListPrefence.setSummary(mode.mValue == 0 ? R.string.gpio_mode_input : R.string.gpio_mode_output);
        mStatePreference.setSummary(state.mValue == 1 ? R.string.gpio_state_high : R.string.gpio_state_low);
        mSetStateListPreference.setValueIndex(state.mValue);
        if (mode == YNHAPI.GpioMode.INPUT) {
            mSetStateListPreference.setEnabled(false);
        }
        listenInputGpioState();
    }

    @Override
    public void onStop() {
        super.onStop();
        unlistenGpioState();
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        switch (preference.getKey()) {
            case KEY_GPIO_MODE:
                boolean output = "1".equals(String.valueOf(newValue));
                mYNHAPI.setGpioMode(mGpioIndex, output ? YNHAPI.GpioMode.OUTPUT : YNHAPI.GpioMode.INPUT);
                preference.setSummary(output ? R.string.gpio_mode_output : R.string.gpio_mode_input);
                // 输入模式下，禁止设置电平状态
                mSetStateListPreference.setEnabled(output);
                return true;

            case KEY_SET_GPIO_STATE:
                boolean high = "1".equals(String.valueOf(newValue));
                mYNHAPI.setGpioState(mGpioIndex, high ? YNHAPI.GpioState.HIGH : YNHAPI.GpioState.LOW);
                return true;
        }
        return false;
    }

    private void listenInputGpioState() {
        if (mCallback == null) {
            mCallback = (index, oldState, newState) -> {
                Log.d(TAG, "index = " + index + ", old state = " + oldState + ", new state = " + newState);
                getActivity().runOnUiThread(() -> {
                    mStatePreference.setSummary(newState == 1 ? R.string.gpio_state_high : R.string.gpio_state_low);
                    mSetStateListPreference.setValueIndex(newState);
                });
            };
            mYNHAPI.listenGpio(mGpioIndex, mCallback);
        }
    }

    private void unlistenGpioState() {
        if (mCallback != null) {
            mYNHAPI.unlistenGpio(mGpioIndex, mCallback);
            mCallback = null;
        }
    }
}