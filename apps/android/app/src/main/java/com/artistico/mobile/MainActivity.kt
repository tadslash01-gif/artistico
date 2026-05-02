package com.artistico.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.artistico.mobile.ui.ArtisticoApp
import com.artistico.mobile.ui.theme.ArtisticoTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ArtisticoTheme {
                ArtisticoApp()
            }
        }
    }
}
