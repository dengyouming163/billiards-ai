package com.innohi.ynhcommonapi.controller.apkinstall;

import android.content.Context;
import android.util.Log;

import androidx.preference.ListPreference;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

public class AllowInstallPackageTypeController extends PreferenceController implements Preference.OnPreferenceChangeListener {

    private static final String TAG = AllowInstallPackageTypeController.class.getSimpleName();
    public AllowInstallPackageTypeController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        ListPreference listPreference = (ListPreference) preference;
        YNHAPI.InstallPackagePolicy policy = YNHAPI.getInstance().getInstallPackagePolicy();

        CharSequence entries[] = listPreference.getEntries();
        CharSequence values[] = listPreference.getEntryValues();
        if(values != null && values.length > 0){
            for(int i = 0; i < values.length; i++){
                if(values[i].equals(""+policy.getAllowInstallType())){
                    listPreference.setValueIndex(i);
                    listPreference.setSummary(entries[i]);
                    break;
                }
            }
        }
    }

    @Override
    protected boolean onClick(Preference preference) {
        Log.d(TAG, "onClick~~");
        updateState(preference);
        return true;
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        ListPreference listPreference = (ListPreference) preference;
        String type = (String)newValue;
        Log.d(TAG,"onPreferenceChange type "+type);
        YNHAPI.InstallPackagePolicy policy = YNHAPI.getInstance().getInstallPackagePolicy();
        try{
            policy.setAllowInstallType(Integer.parseInt(type));
            YNHAPI.getInstance().setInstallPackagePolicy(policy);
        }catch (Exception ex){
            Log.e(TAG,"",ex);
        }

        CharSequence entries[] = listPreference.getEntries();
        CharSequence values[] = listPreference.getEntryValues();
        if(values != null && values.length > 0){
            for(int i = 0; i < values.length; i++){
                if(values[i].equals(""+policy.getAllowInstallType())){
                    listPreference.setSummary(entries[i]);
                    break;
                }
            }
        }
        return true;
    }
}
