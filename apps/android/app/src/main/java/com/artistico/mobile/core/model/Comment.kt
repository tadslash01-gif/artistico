package com.artistico.mobile.core.model

data class Comment(
    val commentId: String,
    val projectId: String,
    val authorId: String,
    val authorName: String?,
    val authorAvatar: String?,
    val text: String,
    val createdAt: Long
)
