package com.dailyquoteota.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.dailyquoteota.app.ota.OTABootstrap
import com.dailyquoteota.app.ota.OTAPackage

class MainApplication : Application(), ReactApplication {

  // Resolved once at app start. Null → use embedded asset bundle.
  private var otaBundlePath: String? = null

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(OTAPackage())
        },
      jsBundleFilePath = otaBundlePath,
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Resolve OTA bundle BEFORE ReactHost is created (lazy, but we prime it now).
    otaBundlePath = OTABootstrap.resolveBundlePath(applicationContext)
    loadReactNative(this)
  }
}
