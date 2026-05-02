package com.artistico.mobile.core.model

data class LiveStream(
    val streamId: String,
    val title: String,
    val creatorId: String,
    val creatorName: String?,
    val creatorAvatar: String?,
    val thumbnailUrl: String?,
    val playbackId: String,
    val viewerCount: Int,
    val isLive: Boolean,
    val startedAt: Long?
)
