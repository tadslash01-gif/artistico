package com.artistico.mobile.core.logging

import android.util.Log

object AppLogger {
    private const val TAG = "ArtisticoMobile"

    fun d(message: String) {
        Log.d(TAG, message)
    }

    fun e(message: String, throwable: Throwable? = null) {
        Log.e(TAG, message, throwable)
    }
}
