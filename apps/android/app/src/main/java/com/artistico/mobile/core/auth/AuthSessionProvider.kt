package com.artistico.mobile.core.auth

import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.tasks.await

class AuthSessionProvider(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    suspend fun getIdToken(forceRefresh: Boolean = false): String? {
        val user = auth.currentUser ?: return null
        return user.getIdToken(forceRefresh).await().token
    }

    fun isSignedIn(): Boolean = auth.currentUser != null
}
