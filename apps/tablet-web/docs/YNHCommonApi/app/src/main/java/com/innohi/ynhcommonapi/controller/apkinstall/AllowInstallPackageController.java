package com.innohi.ynhcommonapi.controller.apkinstall;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import androidx.fragment.app.FragmentManager;
import androidx.preference.ListPreference;
import androidx.preference.Preference;

import com.innohi.StorageInfo;
import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class AllowInstallPackageController extends PreferenceController implements Preference.OnPreferenceChangeListener {

    private static final String TAG = AllowInstallPackageController.class.getSimpleName();
    private FragmentManager mFragmentManager = null;
    private PackageManager mPackageManager = null;
    private List<PackageInfo> mAppList = new ArrayList<PackageInfo>();
    public AllowInstallPackageController(Context context, String key, boolean available, FragmentManager fragmentManager) {
        super(context, key, available);
        mFragmentManager = fragmentManager;
    }

    @Override
    public void updateState(Preference preference) {
        ListPreference listPreference = (ListPreference) preference;
        List<String> entries = new ArrayList<>();
        List<String> values = new ArrayList<>();

        mPackageManager = mContext.getPackageManager();
        YNHAPI.InstallPackagePolicy policy = YNHAPI.getInstance().getInstallPackagePolicy();
        List<String> allowInstallPackageList = policy.getAllowInstallPackageList();

        entries.add("None");
        values.add("None");
        List<StorageInfo> storageInfos = YNHAPI.getInstance().getStorageInfos();
        for(StorageInfo info : storageInfos){
            if(info.getType() == StorageInfo.TYPE_USB_STORAGE && new File(info.getPath()).exists()){
                File dir = new File(info.getPath());
                for(File child : dir.listFiles()){
                    if(child.getAbsolutePath().endsWith("apk")){
                        PackageInfo pkgInfo = mPackageManager.getPackageArchiveInfo(child.getAbsolutePath(),PackageManager.GET_ACTIVITIES);
                        if(pkgInfo != null && pkgInfo.applicationInfo != null){
                            Log.d(TAG,"updateState found "+child.getAbsolutePath());
                            mAppList.add(pkgInfo);
                            entries.add(child.getName());
                            values.add(pkgInfo.applicationInfo.packageName);
                        }
                    }
                }
            }
        }

        listPreference.setEntries(entries.toArray(new String[]{}));
        listPreference.setEntryValues(values.toArray(new String[]{}));
        if(allowInstallPackageList != null && allowInstallPackageList.size() > 0){
            for(int i =0; i < values.size(); i++){
                if(values.get(i).equals(allowInstallPackageList.get(0))){
                    listPreference.setValueIndex(i);
                    break;
                }
            }
            listPreference.setSummary(allowInstallPackageList.get(0));
        }else{
            listPreference.setSummary("None");
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
        Log.d(TAG, "onPreferenceChange ~~ "+newValue);
        String pkg = (String) newValue;

        YNHAPI.InstallPackagePolicy policy = YNHAPI.getInstance().getInstallPackagePolicy();
        List<String> allowInstallPackageList = policy.getAllowInstallPackageList();

        if(pkg != null && pkg.equals("None")){
            allowInstallPackageList.clear();
            YNHAPI.getInstance().setInstallPackagePolicy(policy);
            preference.setSummary("None");
            return true;
        }
        for(PackageInfo pkgInfo : mAppList){
            if(pkgInfo.applicationInfo != null && pkgInfo.applicationInfo.packageName.contains(pkg)){
                allowInstallPackageList.clear();
                allowInstallPackageList.add(pkgInfo.applicationInfo.packageName);
                YNHAPI.getInstance().setInstallPackagePolicy(policy);

                preference.setSummary(pkgInfo.applicationInfo.packageName);
            }
        }
        return true;
    }
}
