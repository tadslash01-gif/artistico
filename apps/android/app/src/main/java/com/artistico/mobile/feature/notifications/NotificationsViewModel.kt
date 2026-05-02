package com.artistico.mobile.feature.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.artistico.mobile.core.network.HttpErrorParser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class NotificationsUiState(
    val loading: Boolean = true,
    val items: List<NotificationItem> = emptyList(),
    val error: String? = null
)

class NotificationsViewModel(
    private val repository: NotificationsRepository = NotificationsRepository()
) : ViewModel() {
    private val _uiState = MutableStateFlow(NotificationsUiState())
    val uiState: StateFlow<NotificationsUiState> = _uiState.asStateFlow()

    init {
        observeNotifications()
    }

    private fun observeNotifications() {
        viewModelScope.launch {
            repository.observeNotifications().collect { result ->
                result.onSuccess { items ->
                    _uiState.value = NotificationsUiState(
                        loading = false,
                        items = items,
                        error = null
                    )
                }.onFailure { error ->
                    _uiState.value = NotificationsUiState(
                        loading = false,
                        items = emptyList(),
                        error = HttpErrorParser.userMessage(error)
                    )
                }
            }
        }
    }
}
