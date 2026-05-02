package com.artistico.mobile.core.network

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import okhttp3.Interceptor
import okhttp3.Response
import java.util.concurrent.TimeUnit

class AuthTokenInterceptor(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val user = auth.currentUser
        if (user == null) {
            return chain.proceed(original)
        }

        val token = runCatching {
            val task = user.getIdToken(false)
            Tasks.await(task, 10, TimeUnit.SECONDS).token
        }.getOrNull()

        if (token.isNullOrBlank()) {
            return chain.proceed(original)
        }

        val withToken = original.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()
        return chain.proceed(withToken)
    }
}
