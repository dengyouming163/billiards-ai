package com.innohi.ynhcommonapi.controller.apkinstall;

import android.content.Context;
import android.os.Build;
import android.view.View;

import androidx.appcompat.app.AlertDialog;
import androidx.preference.ListPreference;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.DialogUtils;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

public class AllowInstallPackagePasswordController extends PreferenceController {

    private static final String TAG = AllowInstallPackagePasswordController.class.getSimpleName();
    private Context mContext = null;
    public AllowInstallPackagePasswordController(Context context, String key, boolean available) {
        super(context, key, available);
        mContext = context;
    }

    @Override
    public void updateState(Preference preference) {
        YNHAPI.InstallPackagePolicy policy = YNHAPI.getInstance().getInstallPackagePolicy();
        if(policy.getAllowInstallPassword() != null && policy.getAllowInstallPassword().length() > 0){
            preference.setSummary(policy.getAllowInstallPassword());
        }
    }

    @Override
    protected boolean onClick(Preference preference) {
        DialogUtils dialogUtils =DialogUtils.getInstance();
        dialogUtils.showConfirmDialog(this.mContext, mContext.getString(R.string.allow_install_password), mContext.getString(R.string.Dialog_text));
        dialogUtils.setNeutralButtonVisibility(View.GONE);
        dialogUtils.setPositiveButtonText(mContext.getString(R.string.Dialog_ok_text0));
        dialogUtils.setMonDialogButtonClickListener(new DialogUtils.OnDialogButtonClickListener() {

            @Override
            public void onPositiveButtonClick(androidx.appcompat.app.AlertDialog dialog) {
                String vla = DialogUtils.tv_dialog_content.getText().toString().trim() ;
                if(vla!=null &&vla.length()>0) {
                    YNHAPI.InstallPackagePolicy policy = YNHAPI.getInstance().getInstallPackagePolicy();
                    policy.setAllowInstallPassword(vla);
                    YNHAPI.getInstance().setInstallPackagePolicy(policy);

                    preference.setSummary(vla);
                    dialog.dismiss();
                }else
                    DialogUtils.tv_dialog_content.setError(mContext.getString(R.string.Dialog_title_text_Error));
            }

            @Override
            public void onNegativeButtonClick(androidx.appcompat.app.AlertDialog dialog) { //取消
                dialog.dismiss();
            }

            @Override
            public void onNeutralButtonClick(AlertDialog dialog) {
            }
        });
        return true;
    }
}
