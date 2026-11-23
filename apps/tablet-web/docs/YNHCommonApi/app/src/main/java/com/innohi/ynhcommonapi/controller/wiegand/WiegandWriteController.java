package com.innohi.ynhcommonapi.controller.wiegand;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.widget.AppCompatEditText;
import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.FragmentManager;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.utils.L;

/**
 * @author David Chow
 * @since 2021/5/29
 */
public class WiegandWriteController extends PreferenceController {
    private final FragmentManager mFragmentManager;

    public WiegandWriteController(Context context, String key, boolean available, FragmentManager fragmentManager) {
        super(context, key, available);
        mFragmentManager = fragmentManager;
    }

    @Override
    protected boolean onClick(Preference preference) {
        int wiegandMode = YNHAPI.getWiegandMode();
        L.d("wiegand mode = " + wiegandMode);
        if (wiegandMode != 1) {
            Toast.makeText(mContext, "请先设置韦根模式为输出模式!", Toast.LENGTH_SHORT).show();
            return false;
        }
        new WiegandWriteDialogFragment().show(mFragmentManager, "read_wiegand_fragment");
        return true;
    }

    public static class WiegandWriteDialogFragment extends DialogFragment {
        @NonNull
        @Override
        public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
            View contentView = getLayoutInflater().inflate(R.layout.write_weigand, null);
            AppCompatEditText editText = contentView.findViewById(R.id.write_wiegand_code);
            AlertDialog alertDialog = new AlertDialog.Builder(getContext())
                    .setTitle("请输入韦根号")
                    .setView(contentView)
                    .setPositiveButton("发送", (dialog12, which) -> {
                        String code = editText.getText().toString();
                        L.d("code = " + code);
                        if (!TextUtils.isEmpty(code)) {
                            if (code.length() > 8) {
                                YNHAPI.writeWiegand(YNHAPI.Wiegand.Wiegand_Output34, code);
                            } else {
                                YNHAPI.writeWiegand(YNHAPI.Wiegand.Wiegand_Output26, code);
                            }
                        }
                    })
                    .setNegativeButton("取消", null)
                    .create();
            return alertDialog;
        }
    }
}
