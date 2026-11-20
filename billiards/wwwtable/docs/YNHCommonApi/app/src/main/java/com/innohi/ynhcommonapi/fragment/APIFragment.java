package com.innohi.ynhcommonapi.fragment;

import android.content.Context;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.R;
import com.innohi.ynhcommonapi.Version;
import com.innohi.ynhcommonapi.controller.apkinstall.AllowInstallPackageCategoryController;
import com.innohi.ynhcommonapi.controller.apkinstall.ApkInstallController;
import com.innohi.ynhcommonapi.controller.app_boot.AppBootController;
import com.innohi.ynhcommonapi.controller.app_boot.AppKeepLiveController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.innohi.ynhcommonapi.controller.ethernet_set.EthernetSetCategory;
import com.innohi.ynhcommonapi.controller.gpio.GpioCategoryController;
import com.innohi.ynhcommonapi.controller.model.ModelController;
import com.innohi.ynhcommonapi.controller.navigationbar.NavigationBarVisibilityController;
import com.innohi.ynhcommonapi.controller.stroageinfo.StorageInfoController;
import com.innohi.ynhcommonapi.controller.system_sleep_wakeup.SystemSleepWakeUpController;
import com.innohi.ynhcommonapi.controller.otaupdate.OtaUpdateController;
import com.innohi.ynhcommonapi.controller.reboot_shutdown.RebootCategoryController;
import com.innohi.ynhcommonapi.controller.screenshot.ScreenshotController;
import com.innohi.ynhcommonapi.controller.serialno.SerialnoController;
import com.innohi.ynhcommonapi.controller.system_time.TimeCategoryController;
import com.innohi.ynhcommonapi.controller.timing.PowerOnOffCategoryController;
import com.innohi.ynhcommonapi.controller.watchdog.WatchdogCategoryController;
import com.innohi.ynhcommonapi.controller.wiegand.WiegandCategoryController;
import com.innohi.ynhcommonapi.fragment.base.BasePreferenceFragment;
import com.internal.InnohiInternalApi;

import java.util.ArrayList;
import java.util.List;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class APIFragment extends BasePreferenceFragment {
    private List<PreferenceController> mControllers;
    private InnohiInternalApi mInternalApi = InnohiInternalApi.getInstance();

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setHasOptionsMenu(true);
    }

    @Override
    public void onCreateOptionsMenu(@NonNull Menu menu, @NonNull MenuInflater inflater) {
        inflater.inflate(R.menu.api_menu, menu);
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (item.getItemId() == R.id.menu_version) {
            new AlertDialog.Builder(getContext())
                    .setTitle(R.string.menu_version)
                    .setMessage(getString(R.string.apk_version, Version.version) + "\n" + getString(R.string.jar_version, YNHAPI.getInstance().getApiVersion()))
                    .show();
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public int getXml() {
        return R.xml.api_fragment;
    }

    @Override
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);
        mControllers = new ArrayList<>();
        buildControllers(context, mControllers);
    }

    @Override
    public List<PreferenceController> getControllers(Context context) {
        return mControllers;
    }

    private void buildControllers(Context context, List<PreferenceController> controllers) {
        controllers.add(new ModelController(context, "key_model", true));
        controllers.add(new ScreenshotController(context, "key_screenshot", true));
        controllers.add(new SystemSleepWakeUpController(context, "key_lcd_back_light", true));
        controllers.add(new SerialnoController(context, "key_serialno", true));
        controllers.add(new OtaUpdateController(context, "key_ota_update", true));
        controllers.add(new ApkInstallController(context, "key_apk_install", true));
        controllers.add(new StorageInfoController(context, "key_storage_info", true));
        controllers.add(new GpioCategoryController(context, "key_gpio_category", true));
        controllers.add(new WatchdogCategoryController(context, "key_watchdog_category",
                mInternalApi.isFeatureSupported(InnohiInternalApi.FEATURE_WATCHDOG)));
        controllers.add(new NavigationBarVisibilityController(context, "key_navigation_bar_visibility", true));
        controllers.add(new RebootCategoryController(context, "key_reboot_interface_category", true));
        controllers.add(new TimeCategoryController(context, "key_time_interface_category", true, this));
        controllers.add(new PowerOnOffCategoryController(context, "key_timing_category",
                mInternalApi.isFeatureSupported(InnohiInternalApi.FEATURE_RTC), this));
        controllers.add(new EthernetSetCategory(context, "key_set_ethernet_category", true, this));
        controllers.add(new WiegandCategoryController(context, "wiegand_category",
                mInternalApi.isFeatureSupported(InnohiInternalApi.FEATURE_WIEGAND), getChildFragmentManager()));
        controllers.add(new AppBootController(context, "key_boot_apk", true));
        controllers.add(new AppKeepLiveController(context, "key_app_keeplive", true));
        controllers.add(new AllowInstallPackageCategoryController(context, "install_package_category", true,getChildFragmentManager()));
    }
}