package com.innohi.ynhcommonapi;

import android.content.Intent;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.innohi.ynhcommonapi.fragment.GpioFragment;

public class GpioActivity extends AppCompatActivity {
    public static final String GPIO_INDEX = "gpio_index";
    public static final String GPIO_NAME = "gpio_name";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_gpio);
        Intent intent = getIntent();
        if (intent == null) {
            return;
        }
        String gpioName = intent.getStringExtra(GPIO_NAME);
        setTitle(gpioName);
        if (savedInstanceState == null) {
            GpioFragment fragment = new GpioFragment();
            Bundle bundle = new Bundle();
            bundle.putInt(GPIO_INDEX, intent.getIntExtra(GPIO_INDEX, 0));
            fragment.setArguments(bundle);
            getSupportFragmentManager().beginTransaction().add(R.id.gpio_container, fragment)
                    .commit();
        }
    }
}