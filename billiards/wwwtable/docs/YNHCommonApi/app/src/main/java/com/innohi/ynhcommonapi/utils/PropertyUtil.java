package com.innohi.ynhcommonapi.utils;

import java.lang.reflect.Method;

/**
 * TODO: 可以在系统服务中添加一个获取系统的接口，以取代这个工具类。
 * @author David Chow
 * @since 2021/3/24
 */
public class PropertyUtil {
    private PropertyUtil() {
    }

    public static String get(String key, String defaultValue) {
        String value = defaultValue;
        try {
            Class<?> c = Class.forName("android.os.SystemProperties");
            Method get = c.getMethod("get", String.class, String.class);
            value = (String) (get.invoke(c, key, defaultValue));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return value;
    }

    public static void set(String key, String value) {
        try {
            Class<?> c = Class.forName("android.os.SystemProperties");
            Method set = c.getMethod("set", String.class, String.class);
            set.invoke(c, key, value);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static boolean getBoolean(String key, boolean defaultValue) {
        boolean ret = false;
        try {
            Class<?> c = Class.forName("android.os.SystemProperties");
            Method set = c.getMethod("getBoolean", String.class, boolean.class);
            ret = (boolean) set.invoke(c, key, defaultValue);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ret;
    }
}
