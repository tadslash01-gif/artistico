package com.artistico.mobile.feature.orders

import com.artistico.mobile.core.model.Order
import com.artistico.mobile.core.network.ApiClient

class OrdersRepository(
    private val api: com.artistico.mobile.core.network.OrdersApiService = ApiClient.orders
) {
    suspend fun getOrders(role: String = "buyer"): List<Order> {
        return api.getOrders(role).orders.map { dto ->
            Order(
                orderId = dto.orderId,
                buyerId = dto.buyerId,
                creatorId = dto.creatorId,
                productId = dto.productId,
                productTitle = dto.productTitle ?: dto.productId,
                amount = dto.amount,
                currency = dto.currency,
                status = dto.status,
                createdAt = dto.createdAt
            )
        }
    }
}
