package com.artistico.mobile.core.model

data class Order(
    val orderId: String,
    val buyerId: String,
    val creatorId: String,
    val productId: String,
    val productTitle: String,
    val amount: Double,
    val currency: String,
    val status: String,
    val createdAt: Long
)
