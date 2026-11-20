package com.innohi.ynhcommonapi.controller.stroageinfo;

import android.content.Context;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.Preference;

import com.innohi.StorageInfo;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

import java.util.List;

public class StorageInfoController extends PreferenceController {

    public StorageInfoController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    protected boolean onClick(Preference preference) {
        L.d("storage info .");
        String msg = "存储类型  \r总容量  \r剩余容量  \r挂载路径\r\n";
        List<StorageInfo> list = mYNHAPI.getStorageInfos();

        for(StorageInfo info : list){
            switch (info.getType()){
                case StorageInfo.TYPE_MEMORY:
                    msg += "内存：\r";
                break;
                case StorageInfo.TYPE_LOCAL_STORAGE:
                    msg += "本地存储：\r";
                    break;
                case StorageInfo.TYPE_TFCARD:
                    msg += "TF卡：\r";
                    break;
                case StorageInfo.TYPE_USB_STORAGE:
                    msg += "USB外部存储：\r";
                    break;
            }
            int totalSize = (int)info.getTotalSize() / 1024 / 1024;
            float freeSize = (float)info.getFreeSize() / 1024 / 1024;
            msg += totalSize+"GB \r"+String.format("%.2f", freeSize)+"GB \r" + info.getPath()+"\r\n";
        }
        new AlertDialog.Builder(preference.getContext())
                .setTitle(R.string.title_storage_info)
                .setMessage(msg)
                .setNegativeButton(android.R.string.ok, null)
                .show();
        return true;
    }

}