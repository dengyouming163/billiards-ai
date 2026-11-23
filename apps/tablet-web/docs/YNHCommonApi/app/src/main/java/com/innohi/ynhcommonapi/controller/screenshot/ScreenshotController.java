package com.innohi.ynhcommonapi.controller.screenshot;

import android.content.Context;
import android.widget.Toast;

import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;
import com.innohi.ynhcommonapi.utils.RootShell;

import java.io.File;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class ScreenshotController extends PreferenceController {
    private static final String SCREENSHOT_PATH = "/sdcard/screenshot.png";

    public ScreenshotController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        super.updateState(preference);
    }

    @Override
    public boolean onClick(Preference preference) {
        L.d("screenshot.");
        if(new File(SCREENSHOT_PATH).exists()){
            new File(SCREENSHOT_PATH).delete();
        }

        RootShell.exec("screencap "+SCREENSHOT_PATH);
        if(new File(SCREENSHOT_PATH).exists()){
            Toast.makeText(mContext, "截图成功，保存至"+SCREENSHOT_PATH, Toast.LENGTH_SHORT).show();
        }
        return true;
    }
}
