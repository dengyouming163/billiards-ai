package com.innohi.ynhcommonapi;

import android.app.AlertDialog;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;

import androidx.appcompat.app.AppCompatActivity;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.fragment.APIFragment;

/**
 * @author David Chow
 * @since 2021/3/22
 */
public class MainActivity extends AppCompatActivity implements PreferenceFragmentCompat.OnPreferenceStartFragmentCallback {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        if (YNHAPI.getInstance().getApiVersion() != Version.version) {
            new AlertDialog.Builder(this)
                    .setTitle("版本验证")
                    .setMessage("API版本号("+YNHAPI.getInstance().getApiVersion()+")与当前APK版本号("+Version.version+")不一致!")
                    .show();
        }
        if (savedInstanceState == null) {
            getSupportFragmentManager().beginTransaction()
                    .add(R.id.fragment_container, new APIFragment())
                    .commit();
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        return super.dispatchKeyEvent(event);
    }

    @Override
    public boolean onPreferenceStartFragment(PreferenceFragmentCompat caller, Preference pref) {
        return false;
    }
}