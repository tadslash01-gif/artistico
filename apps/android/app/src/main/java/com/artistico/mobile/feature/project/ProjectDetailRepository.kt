package com.artistico.mobile.feature.project

import com.artistico.mobile.core.model.Comment
import com.artistico.mobile.core.model.ProductSummary
import com.artistico.mobile.core.model.ProjectDetail
import com.artistico.mobile.core.network.ApiClient

class ProjectDetailRepository(
    private val api: com.artistico.mobile.core.network.ProjectsApiService = ApiClient.projects,
    private val productsApi: com.artistico.mobile.core.network.ProductsApiService = ApiClient.products
) {
    suspend fun getProjectDetail(slug: String): ProjectDetail {
        val dto = api.getProjectBySlug(slug)
        val products = runCatching {
            productsApi.getProducts(dto.projectId).products.map { p ->
                ProductSummary(
                    productId = p.productId,
                    title = p.title,
                    description = p.description,
                    price = p.price,
                    currency = p.currency,
                    imageUrl = p.imageUrl,
                    projectId = p.projectId
                )
            }
        }.getOrDefault(emptyList())

        return ProjectDetail(
            projectId = dto.projectId,
            slug = dto.slug,
            title = dto.title,
            description = dto.description ?: "",
            creatorId = dto.creatorId,
            creatorName = dto.creatorName,
            creatorAvatar = dto.creatorAvatar,
            images = dto.images ?: emptyList(),
            category = dto.category,
            tags = dto.tags ?: emptyList(),
            likeCount = dto.likeCount,
            saveCount = dto.saveCount,
            commentCount = dto.commentCount,
            isPublished = dto.isPublished,
            products = products
        )
    }

    suspend fun getComments(projectId: String): List<Comment> {
        return api.getComments(projectId).comments.map { c ->
            Comment(
                commentId = c.commentId,
                projectId = c.projectId,
                authorId = c.authorId,
                authorName = c.authorName,
                authorAvatar = c.authorAvatar,
                text = c.text,
                createdAt = c.createdAt
            )
        }
    }
}
