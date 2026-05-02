package com.artistico.mobile.feature.streams

import com.artistico.mobile.core.model.LiveStream
import com.artistico.mobile.core.network.ApiClient

class StreamsRepository(
    private val api: com.artistico.mobile.core.network.StreamsApiService = ApiClient.streams
) {
    suspend fun getLiveStreams(): List<LiveStream> {
        return api.getLiveStreams().streams.map { dto ->
            LiveStream(
                streamId = dto.streamId,
                title = dto.title,
                creatorId = dto.creatorId,
                creatorName = dto.creatorName,
                creatorAvatar = dto.creatorAvatar,
                thumbnailUrl = dto.thumbnailUrl,
                playbackId = dto.playbackId,
                viewerCount = dto.viewerCount,
                isLive = dto.isLive,
                startedAt = dto.startedAt
            )
        }
    }

    suspend fun getStream(id: String): LiveStream {
        val dto = api.getStream(id)
        return LiveStream(
            streamId = dto.streamId,
            title = dto.title,
            creatorId = dto.creatorId,
            creatorName = dto.creatorName,
            creatorAvatar = dto.creatorAvatar,
            thumbnailUrl = dto.thumbnailUrl,
            playbackId = dto.playbackId,
            viewerCount = dto.viewerCount,
            isLive = dto.isLive,
            startedAt = dto.startedAt
        )
    }
}
