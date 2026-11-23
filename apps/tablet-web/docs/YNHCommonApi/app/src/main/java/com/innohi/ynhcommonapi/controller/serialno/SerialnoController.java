package com.innohi.ynhcommonapi.controller.serialno;

import android.content.Context;

import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class SerialnoController extends PreferenceController {

    public SerialnoController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        preference.setSummary(mYNHAPI.getSerialNo());
    }
}
