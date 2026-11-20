package com.innohi.ynhcommonapi.controller.base;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.SeekBar;
import android.widget.TextView;

import androidx.appcompat.app.AlertDialog;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.R;

/**
 * @author David Chow
 * @since 2021/9/30
 */
public class LightBrightnessPreferenceController extends PreferenceController{
    private AlertDialog mBrightnessDialog;
    private SeekBar mBrightnessSeekBar;
    private TextView mBrightnessTextView;
    public LightBrightnessPreferenceController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    protected void showBrightnessDialog(int index) {
        if (mBrightnessDialog == null) {
            View view = LayoutInflater.from(mContext).inflate(R.layout.activity_light_brightness, null);
            mBrightnessSeekBar = view.findViewById(R.id.brightness_seekbar);
            mBrightnessSeekBar.setMax(255);
            mBrightnessTextView = view.findViewById(R.id.brightness_value);
            mBrightnessSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
                @Override
                public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                    mYNHAPI.setLightBrightness(index, progress);
                    mBrightnessTextView.setText(progress + "/255");
                }

                @Override
                public void onStartTrackingTouch(SeekBar seekBar) {

                }

                @Override
                public void onStopTrackingTouch(SeekBar seekBar) {

                }
            });
            mBrightnessDialog = new AlertDialog.Builder(mContext)
                    .setTitle("亮度调节")
                    .setView(view)
                    .setPositiveButton(android.R.string.ok, null)
                    .create();
        }
        mBrightnessSeekBar.setProgress(mYNHAPI.getLightBrightness(index));
        mBrightnessTextView.setText(mBrightnessSeekBar.getProgress() + "/255");
        mBrightnessDialog.show();
    }
}
