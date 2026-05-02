package com.artistico.mobile.core.network

import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Path

data class UserProfileDto(
    val uid: String,
    val displayName: String? = null,
    val username: String? = null,
    val bio: String? = null,
    val avatarUrl: String? = null,
    val followerCount: Int = 0,
    val followingCount: Int = 0,
    val projectCount: Int = 0,
    val isFollowing: Boolean = false
)

interface UsersApiService {
    @GET("users/{uid}")
    suspend fun getUser(@Path("uid") uid: String): UserProfileDto

    @DELETE("follows/{followingId}")
    suspend fun unfollow(@Path("followingId") followingId: String)
}
