package com.artistico.mobile.core.network

import retrofit2.http.GET
import retrofit2.http.Path

data class LiveStreamDto(
    val streamId: String,
    val title: String,
    val creatorId: String,
    val creatorName: String? = null,
    val creatorAvatar: String? = null,
    val thumbnailUrl: String? = null,
    val playbackId: String,
    val viewerCount: Int = 0,
    val isLive: Boolean = true,
    val startedAt: Long? = null
)

data class StreamsResponseDto(
    val streams: List<LiveStreamDto> = emptyList()
)

interface StreamsApiService {
    @GET("streams/live")
    suspend fun getLiveStreams(): StreamsResponseDto

    @GET("streams/{id}")
    suspend fun getStream(@Path("id") id: String): LiveStreamDto
}
