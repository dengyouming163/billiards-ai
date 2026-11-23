package com.innohi.ynhcommonapi.controller.gpio;

import android.content.Context;

import androidx.preference.Preference;

import com.innohi.ynhcommonapi.controller.base.PreferenceController;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class GpioController extends PreferenceController {

    public GpioController(Context context, String key, boolean available) {
        super(context, key, available);
    }

}
