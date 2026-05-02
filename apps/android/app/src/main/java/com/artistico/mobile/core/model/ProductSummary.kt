package com.artistico.mobile.core.model

data class ProductSummary(
    val productId: String,
    val title: String,
    val description: String?,
    val price: Double,
    val currency: String,
    val imageUrl: String?,
    val projectId: String
)
