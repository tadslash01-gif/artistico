package com.artistico.mobile.core.network

import retrofit2.http.GET
import retrofit2.http.Query

data class ProductDto(
    val productId: String,
    val title: String,
    val description: String? = null,
    val price: Double = 0.0,
    val currency: String = "usd",
    val imageUrl: String? = null,
    val projectId: String
)

data class ProductsResponseDto(
    val products: List<ProductDto> = emptyList()
)

interface ProductsApiService {
    @GET("products")
    suspend fun getProducts(@Query("projectId") projectId: String): ProductsResponseDto
}
