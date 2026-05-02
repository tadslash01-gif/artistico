package com.artistico.mobile.core.network

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.POST
import retrofit2.http.Path

data class FollowRequestDto(val followingId: String)
data class LikeRequestDto(val projectId: String)
data class SaveRequestDto(val projectId: String)
data class CommentRequestDto(val projectId: String, val text: String)
data class CommentResponseDto(val commentId: String)

interface SocialApiService {
    @POST("follows")
    suspend fun follow(@Body body: FollowRequestDto)

    @DELETE("follows/{followingId}")
    suspend fun unfollow(@Path("followingId") followingId: String)

    @POST("likes")
    suspend fun like(@Body body: LikeRequestDto)

    @DELETE("likes/{projectId}")
    suspend fun unlike(@Path("projectId") projectId: String)

    @POST("saves")
    suspend fun save(@Body body: SaveRequestDto)

    @DELETE("saves/{projectId}")
    suspend fun unsave(@Path("projectId") projectId: String)

    @POST("comments")
    suspend fun postComment(@Body body: CommentRequestDto): CommentResponseDto
}
