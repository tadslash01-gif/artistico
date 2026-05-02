package com.artistico.mobile.core.network

import retrofit2.http.GET
import retrofit2.http.Query

data class OrderDto(
    val orderId: String,
    val buyerId: String,
    val creatorId: String,
    val productId: String,
    val productTitle: String? = null,
    val amount: Double = 0.0,
    val currency: String = "usd",
    val status: String,
    val createdAt: Long = 0L
)

data class OrdersResponseDto(
    val orders: List<OrderDto> = emptyList()
)

interface OrdersApiService {
    @GET("orders")
    suspend fun getOrders(@Query("role") role: String = "buyer"): OrdersResponseDto
}
