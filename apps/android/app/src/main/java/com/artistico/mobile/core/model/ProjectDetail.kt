package com.artistico.mobile.core.model

data class ProjectDetail(
    val projectId: String,
    val slug: String,
    val title: String,
    val description: String,
    val creatorId: String,
    val creatorName: String?,
    val creatorAvatar: String?,
    val images: List<String>,
    val category: String?,
    val tags: List<String>,
    val likeCount: Int,
    val saveCount: Int,
    val commentCount: Int,
    val isPublished: Boolean,
    val products: List<ProductSummary> = emptyList()
)
