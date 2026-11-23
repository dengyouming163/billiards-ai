package com.innohi.ynhcommonapi;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AlertDialog;

public class DialogUtils {
    private static View view_custom;
    public static AlertDialog.Builder builder;
    public static AlertDialog alert ;
    public static TextView tv_dialog_title;
    public static EditText tv_dialog_content;
    public static DialogUtils getInstance() {
        return new DialogUtils();
    }

    /**
     * todo 带有确认取消按钮的自定义dialog
     * @param context 上下文对象
     * @param title 标题
     * @param text_hint 输入的提示文字
     */
    public static void showConfirmDialog(Context context, String title ,String text_hint){
        builder = new AlertDialog.Builder(context);
        alert = builder.create();
        alert.show();

        //引入布局
        view_custom = LayoutInflater.from(context).inflate(R.layout.dialogutils,null,false);
        tv_dialog_title = view_custom.findViewById(R.id.dialog_title);
        tv_dialog_title.setText(title);
        tv_dialog_content =  view_custom.findViewById(R.id.dialog_text);
        tv_dialog_content.setHint(text_hint);//(R.string.Dialog_text);

        alert.setCancelable(false);
        alert.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM);

        //为取消按钮设置点击监听
        view_custom.findViewById(R.id.dialog_no).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if(mOnDialogButtonClickListener !=null){
                    mOnDialogButtonClickListener.onNegativeButtonClick(alert);
                }
            }
        });

        //稍后重启设置点击监听
        view_custom.findViewById(R.id.dialog_later_reboot).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if(mOnDialogButtonClickListener !=null){
                    mOnDialogButtonClickListener.onNeutralButtonClick(alert);
                }
            }
        });
        //为确认按钮设置点击监听
        view_custom.findViewById(R.id.dialog_reboot).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if(mOnDialogButtonClickListener !=null){
                    mOnDialogButtonClickListener.onPositiveButtonClick(alert);
                }
            }
        });
        tv_dialog_content.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                alert.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);
            }
        });

        //使用布局
        alert.getWindow().setContentView(view_custom);
    }

    public void setNeutralButtonText(String text){
        if(text != null){
            ((Button)view_custom.findViewById(R.id.dialog_later_reboot)).setText(text);
        }
    }

    public void setNeutralButtonVisibility(int visibility){
        view_custom.findViewById(R.id.dialog_later_reboot).setVisibility(visibility);
    }

    public void setPositiveButtonText(String text){
        if(text != null){
            ((Button)view_custom.findViewById(R.id.dialog_reboot)).setText(text);
        }
    }
    public void setPositiveButtonVisibility(int visibility){
        view_custom.findViewById(R.id.dialog_reboot).setVisibility(visibility);
    }


    //todo 按钮点击回调接口
    public static OnDialogButtonClickListener mOnDialogButtonClickListener;

    public void setMonDialogButtonClickListener(OnDialogButtonClickListener listener){
        this.mOnDialogButtonClickListener = listener;
    }
    public interface OnDialogButtonClickListener{
        void onPositiveButtonClick(AlertDialog dialog); //立刻重启
        void onNegativeButtonClick(AlertDialog dialog); //取消
        void onNeutralButtonClick(AlertDialog dialog); //稍后重启
    }
}
