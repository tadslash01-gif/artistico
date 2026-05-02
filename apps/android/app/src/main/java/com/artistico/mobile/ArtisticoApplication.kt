package com.artistico.mobile

import android.app.Application
import com.artistico.mobile.core.logging.AppLogger

class ArtisticoApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        AppLogger.d("ArtisticoApplication initialized")
    }
}
