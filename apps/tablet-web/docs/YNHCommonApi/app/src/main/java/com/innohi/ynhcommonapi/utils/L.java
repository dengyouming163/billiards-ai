package com.innohi.ynhcommonapi.utils;

import android.util.Log;

/**
 * @author David Chow
 * @since 2021/3/22
 */
public class L {
    private static final String TAG = "YNHApiTest";
    private static final boolean DEBUG = true;

    private L() {
    }

    public static void d(Object msg) {
        if (DEBUG) {
            if (msg != null) {
                Log.d(TAG, msg.toString());
            }
        }
    }

    public static void e(Object msg) {
        if (DEBUG) {
            if (msg != null) {
                Log.e(TAG, msg.toString());
            }
        }
    }

}
