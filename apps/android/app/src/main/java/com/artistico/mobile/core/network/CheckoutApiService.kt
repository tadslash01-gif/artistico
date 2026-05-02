package com.artistico.mobile.core.network

import retrofit2.http.Body
import retrofit2.http.POST

data class CheckoutSessionRequestDto(val productId: String)
data class CheckoutSessionResponseDto(val url: String, val sessionId: String)

interface CheckoutApiService {
    @POST("checkout/create-session")
    suspend fun createSession(@Body body: CheckoutSessionRequestDto): CheckoutSessionResponseDto
}
