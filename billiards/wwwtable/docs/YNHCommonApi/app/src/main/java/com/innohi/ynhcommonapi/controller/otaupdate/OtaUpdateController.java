package com.innohi.ynhcommonapi.controller.otaupdate;

import android.content.Context;
import android.os.Environment;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

import java.io.File;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class OtaUpdateController extends PreferenceController {
    public OtaUpdateController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    protected boolean onClick(Preference preference) {
        L.d("ota update");
        String path = Environment.getExternalStorageDirectory()+ File.separator+"update.zip";
        new AlertDialog.Builder(preference.getContext())
                .setTitle(R.string.ota_update_title)
                .setMessage(R.string.ota_update_msg)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> mYNHAPI.otaUpdate(path))
                .setNegativeButton(android.R.string.cancel, null)
                .show();
        return true;
    }
}
