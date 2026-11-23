package com.innohi.ynhcommonapi.utils;

import java.io.DataOutputStream;
import java.io.IOException;

/**
 * This class is used to exec root cmd and wait for cmd result, it will block current thread.
 * <p>
 * So, if you invoke this class's methods in main thread, please be careful.
 *
 * @author David Chow
 * @since 2021/3/26
 */
public class RootShell {
    private RootShell() {
    }

    public static boolean exec(String cmd) {
        L.d("shell cmd = " + cmd);
        boolean ret = false;
        try {
            Process p = Runtime.getRuntime().exec("su");
            try (DataOutputStream out = new DataOutputStream(p.getOutputStream())) {
                out.writeBytes(cmd + "\n");
                out.flush();
                out.writeBytes("exit\n");
                out.flush();
                p.waitFor();
                ret = p.exitValue() == 0;
            }
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
        return ret;
    }
}
