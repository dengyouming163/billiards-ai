package com.innohi.ynhcommonapi.controller.wiegand;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;


/**
 * @author David Chow
 * @since 2021/5/29
 */
public class WiegandReadController extends PreferenceController {
    public class UIHandler extends Handler {
        public static final int MSG_SUCCESS = 0x01;
        public static final int MSG_FAILURE = 0x02;

        public UIHandler(Looper looper) {
            super(looper);
        }

        @Override
        public void handleMessage(@NonNull Message msg) {
            switch (msg.what) {
                case MSG_SUCCESS:
                    long code = (long) msg.obj;
                    Toast.makeText(WiegandReadController.this.mContext, "韦根号为: " + code, Toast.LENGTH_SHORT).show();
                    break;

                case MSG_FAILURE:
                    Toast.makeText(WiegandReadController.this.mContext, "读取韦根号发生错误!", Toast.LENGTH_SHORT).show();
                    break;
            }
        }
    }

    private final UIHandler mUIHandler;

    public WiegandReadController(Context context, String key, boolean available) {
        super(context, key, available);
        mUIHandler = new UIHandler(context.getMainLooper());
    }

    @Override
    protected boolean onClick(Preference preference) {
        int wiegandMode = YNHAPI.getWiegandMode();
        if (wiegandMode != 0) {
            Toast.makeText(mContext, "请先设置韦根模式为输入模式!", Toast.LENGTH_SHORT).show();
            return false;
        }
        YNHAPI.readWiegandAsync(new YNHAPI.WiegandCallback() {
            @Override
            public void onSuccess(long code) {
                Log.d("wiegand", "wiegand code = " + code);
                Message msg = mUIHandler.obtainMessage();
                msg.what = UIHandler.MSG_SUCCESS;
                msg.obj = code;
                msg.sendToTarget();
            }

            @Override
            public void onFailure() {
                Log.d("wiegand", "wiegand error !");
                Message msg = mUIHandler.obtainMessage();
                msg.what = UIHandler.MSG_FAILURE;
                msg.sendToTarget();
            }
        });
        return true;
    }
}
