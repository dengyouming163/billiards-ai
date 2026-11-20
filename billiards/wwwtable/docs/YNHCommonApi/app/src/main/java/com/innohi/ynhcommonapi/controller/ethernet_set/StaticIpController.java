package com.innohi.ynhcommonapi.controller.ethernet_set;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.widget.AppCompatEditText;
import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.entity.IpConfig;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;

import java.util.Collections;

/**
 * @author David Chow
 * @since 2021/11/10
 */
public class StaticIpController extends PreferenceController {

    private AppCompatEditText mIpEditText;
    private AppCompatEditText mMaskEditText;
    private AppCompatEditText mGatewayEditText;
    private AppCompatEditText mDnsEditText;

    public StaticIpController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    public void updateState(Preference preference) {
        preference.setEnabled(mYNHAPI.getIpMode() == YNHAPI.IpMode.STATIC);
    }

    @Override
    protected boolean onClick(Preference preference) {
        IpConfig ipConfig = mYNHAPI.getIpConfig();
        if (ipConfig == null) {
            return false;
        }
        View contentView = LayoutInflater.from(mContext).inflate(R.layout.static_ip, null, false);
        mIpEditText = contentView.findViewById(R.id.ip_et);
        mMaskEditText = contentView.findViewById(R.id.mask_et);
        mGatewayEditText = contentView.findViewById(R.id.gateway_et);
        mDnsEditText = contentView.findViewById(R.id.dns_et);
        mIpEditText.setText(ipConfig.ip);
        mMaskEditText.setText(ipConfig.mask);
        mGatewayEditText.setText(ipConfig.gateway);
        mDnsEditText.setText(ipConfig.dnsList.get(0));
        AlertDialog.Builder builder = new AlertDialog.Builder(mContext);
        builder.setTitle(R.string.title_set_static_ip)
                .setView(contentView)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> {
                    if (mIpEditText.getText() != null && mMaskEditText.getText() != null && mGatewayEditText.getText() != null
                            && mDnsEditText.getText() != null) {
                        mYNHAPI.setStaticIp(new IpConfig(
                                mIpEditText.getText().toString(),
                                mMaskEditText.getText().toString(),
                                mGatewayEditText.getText().toString(),
                                Collections.singletonList(mDnsEditText.getText().toString())));
                    }
                })
                .setNegativeButton(android.R.string.cancel, null)
                .show();
        return true;
    }
}
