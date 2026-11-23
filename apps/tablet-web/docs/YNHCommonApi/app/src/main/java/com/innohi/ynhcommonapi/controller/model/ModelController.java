package com.innohi.ynhcommonapi.controller.model;

import android.content.Context;

import androidx.preference.Preference;

import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.PropertyUtil;

/**
 * @author David Chow
 * @since 2021/11/10
 */
public class ModelController extends PreferenceController {
    public ModelController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        String systemRenameModel = PropertyUtil.get("ro.product.system.model","");
        if("".equals(systemRenameModel)){
            preference.setSummary(mYNHAPI.getBoardModel());
        }else{
            preference.setSummary(systemRenameModel);
        }
    }
}
