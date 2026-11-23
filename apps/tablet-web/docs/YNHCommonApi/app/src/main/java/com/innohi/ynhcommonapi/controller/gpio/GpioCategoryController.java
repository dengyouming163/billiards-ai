package com.innohi.ynhcommonapi.controller.gpio;

import android.content.Context;
import android.content.Intent;

import androidx.preference.Preference;

import com.innohi.YNHAPI;
import com.innohi.ynhcommonapi.GpioActivity;
import com.innohi.ynhcommonapi.controller.base.AbsPreferenceCategoryController;
import com.innohi.ynhcommonapi.controller.base.PreferenceController;
import com.internal.InnohiInternalApi;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author David Chow
 * @since 2021/3/27
 */
public class GpioCategoryController extends AbsPreferenceCategoryController {
    private static final String GPIO_KEY_PREFIX = "GPIO";
    private static final String USB_KEY_PREFIX = "USB";
    private static final String RELAY = "relay";
    private static final String RED_LED = "red_led";
    private static final String GREEN_LED = "green_led";
    private static final String BLUE_LED = "blue_led";
    private static final String INFRARED = "infrared";
    private static final String WHITE_LIGHT = "white_light";
    private static final String CASH_BOX = "cash_box";
    private Map<String,Integer> mGpioMap = new HashMap<>();

    public GpioCategoryController(Context context, String key, boolean available) {
        super(context, key, available);
    }

    @Override
    protected void fillChildKeys(List<String> keys) {
        for (int i = 0; i < 12; i++) {
            keys.add(GPIO_KEY_PREFIX + (i + 1));
        }
        for (int i = 0; i < 12; i++) {
            keys.add(USB_KEY_PREFIX + (i + 1));
        }
        keys.add(RELAY);
        keys.add(RED_LED);
        keys.add(GREEN_LED);
        keys.add(BLUE_LED);
        keys.add(INFRARED);
        keys.add(WHITE_LIGHT);
        keys.add(CASH_BOX);
        keys.add("MODULE_NET_POWER");
    }

    @Override
    protected void fillChildControllers(List<PreferenceController> controllers, String key) {
        if (key.startsWith(GPIO_KEY_PREFIX)) {
            int index = getIndexFromKey(key);
            controllers.add(new GpioController(mContext, key, mInternalApi.isGpioSupported(index)));
            return;
        }
        if (key.startsWith(USB_KEY_PREFIX)) {
            int index = getIndexFromKey(key);
            controllers.add(new GpioController(mContext, key, mInternalApi.isGpioSupported(index)));
            return;
        }
        switch (key) {
            case RELAY:
                controllers.add(new RelayController(mContext, key, mInternalApi.isGpioSupported(InnohiInternalApi.RELAY)));
                break;

            case RED_LED:
                controllers.add(new RedLightController(mContext, key, mInternalApi.isGpioSupported(InnohiInternalApi.LIGHT_RED)));
                break;

            case GREEN_LED:
                controllers.add(new GreenLightController(mContext, key, mInternalApi.isGpioSupported(InnohiInternalApi.LIGHT_GREEN)));
                break;

            case BLUE_LED:
                controllers.add(new BlueLightController(mContext, key, mInternalApi.isGpioSupported(InnohiInternalApi.LIGHT_BLUE)));
                break;

            case INFRARED:
                if(mInternalApi.isLightSupported(InnohiInternalApi.LIGHT_INFRARED)){
                    controllers.add(new InfraredLightController(mContext, key, mInternalApi.isGpioSupported(InnohiInternalApi.LIGHT_INFRARED)));
                }else{
                    controllers.add(new InfraredController(mContext, key, mInternalApi.isGpioSupported(InnohiInternalApi.LIGHT_INFRARED)));
                }
                break;

            case WHITE_LIGHT:
                controllers.add(new WhiteLightController(mContext, key, mInternalApi.isGpioSupported(InnohiInternalApi.LIGHT_WHITE)));
                break;

            case CASH_BOX:
                controllers.add(new CashBoxController(mContext, key, mInternalApi.isFeatureSupported(InnohiInternalApi.CASHBOX_0)));
                break;
        }
    }

    @Override
    protected boolean dynamicCreatePreference() {
        return true;
    }

    @Override
    protected void fillChildPreferences(List<Preference> preferenceList, String key) {
        if (key.startsWith(GPIO_KEY_PREFIX) || key.startsWith(USB_KEY_PREFIX)) {
            Preference preference = new Preference(mContext);
            preference.setKey(key);
            String gpioName = mInternalApi.getGpioName(getIndexFromKey(key));
            preference.setTitle(gpioName);
            preference.setOnPreferenceClickListener(preference1 -> {
                Intent intent = new Intent(mContext, GpioActivity.class);
                intent.putExtra(GpioActivity.GPIO_INDEX, getIndexFromKey(key));
                intent.putExtra(GpioActivity.GPIO_NAME, gpioName);
                mContext.startActivity(intent);
                return true;
            });
            preferenceList.add(preference);
        }
    }

    private int getIndexFromKey(String key) {
        if (key.startsWith(GPIO_KEY_PREFIX)) {
            return Integer.parseInt(key.substring(4)) - 1;
        }else if(key.startsWith(USB_KEY_PREFIX)){
            return Integer.parseInt(key.substring(3)) + 24;
        }
        return 0;
    }
}
