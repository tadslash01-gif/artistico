package com.artistico.mobile.core.model

data class CreatorProfile(
    val uid: String,
    val displayName: String?,
    val username: String?,
    val bio: String?,
    val avatarUrl: String?,
    val followerCount: Int,
    val followingCount: Int,
    val projectCount: Int,
    val isFollowing: Boolean = false
)
