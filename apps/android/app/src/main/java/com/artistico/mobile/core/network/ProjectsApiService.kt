package com.artistico.mobile.core.network

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

data class ProjectItemDto(
    val projectId: String,
    val slug: String,
    val title: String,
    val creatorId: String,
    val creatorName: String? = null,
    val creatorAvatar: String? = null,
    val images: List<String>? = null
)

data class ProjectsResponseDto(
    val projects: List<ProjectItemDto> = emptyList(),
    val hasMore: Boolean = false
)

data class ProjectDetailDto(
    val projectId: String,
    val slug: String,
    val title: String,
    val description: String? = null,
    val creatorId: String,
    val creatorName: String? = null,
    val creatorAvatar: String? = null,
    val images: List<String>? = null,
    val category: String? = null,
    val tags: List<String>? = null,
    val likeCount: Int = 0,
    val saveCount: Int = 0,
    val commentCount: Int = 0,
    val isPublished: Boolean = true
)

data class CommentDto(
    val commentId: String,
    val projectId: String,
    val authorId: String,
    val authorName: String? = null,
    val authorAvatar: String? = null,
    val text: String,
    val createdAt: Long = 0L
)

data class CommentsResponseDto(
    val comments: List<CommentDto> = emptyList(),
    val hasMore: Boolean = false
)

interface ProjectsApiService {
    @GET("projects")
    suspend fun getProjects(
        @Query("sort") sort: String = "trending",
        @Query("limit") limit: Int = 20,
        @Query("category") category: String? = null,
        @Query("search") search: String? = null,
        @Query("creatorId") creatorId: String? = null,
        @Query("startAfter") startAfter: String? = null
    ): ProjectsResponseDto

    @GET("projects/{slug}")
    suspend fun getProjectBySlug(@Path("slug") slug: String): ProjectDetailDto

    @GET("projects/{projectId}/comments")
    suspend fun getComments(
        @Path("projectId") projectId: String,
        @Query("limit") limit: Int = 20
    ): CommentsResponseDto
}

