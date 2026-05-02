package com.artistico.mobile.feature.streams

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.artistico.mobile.core.model.LiveStream
import com.artistico.mobile.core.network.HttpErrorParser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class StreamsUiState(
    val loading: Boolean = true,
    val streams: List<LiveStream> = emptyList(),
    val error: String? = null
)

data class StreamPlayerUiState(
    val loading: Boolean = true,
    val stream: LiveStream? = null,
    val hlsUrl: String? = null,
    val error: String? = null
)

class StreamsViewModel(
    private val repository: StreamsRepository = StreamsRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(StreamsUiState())
    val uiState: StateFlow<StreamsUiState> = _uiState.asStateFlow()

    init { loadStreams() }

    fun loadStreams() {
        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, error = null) }
            runCatching {
                val streams = repository.getLiveStreams()
                _uiState.update { it.copy(loading = false, streams = streams) }
            }.onFailure { e ->
                _uiState.update { it.copy(loading = false, error = HttpErrorParser.parse(e)) }
            }
        }
    }
}

class StreamPlayerViewModel(
    private val repository: StreamsRepository = StreamsRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(StreamPlayerUiState())
    val uiState: StateFlow<StreamPlayerUiState> = _uiState.asStateFlow()

    fun loadStream(streamId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, error = null) }
            runCatching {
                val stream = repository.getStream(streamId)
                val hlsUrl = "https://stream.mux.com/${stream.playbackId}.m3u8"
                _uiState.update { it.copy(loading = false, stream = stream, hlsUrl = hlsUrl) }
            }.onFailure { e ->
                _uiState.update { it.copy(loading = false, error = HttpErrorParser.parse(e)) }
            }
        }
    }
}
