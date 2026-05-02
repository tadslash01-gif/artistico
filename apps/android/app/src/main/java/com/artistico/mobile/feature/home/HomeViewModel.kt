package com.artistico.mobile.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.artistico.mobile.core.model.ProjectSummary
import com.artistico.mobile.core.network.HttpErrorParser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val loading: Boolean = true,
    val projects: List<ProjectSummary> = emptyList(),
    val error: String? = null
)

class HomeViewModel(
    private val projectsRepository: ProjectsRepository = ProjectsRepository()
) : ViewModel() {
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadFeed()
    }

    fun loadFeed() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            runCatching {
                projectsRepository.getFeedProjects()
            }.onSuccess { projects ->
                _uiState.value = HomeUiState(
                    loading = false,
                    projects = projects,
                    error = null
                )
            }.onFailure { error ->
                _uiState.value = HomeUiState(
                    loading = false,
                    projects = emptyList(),
                    error = HttpErrorParser.userMessage(error)
                )
            }
        }
    }
}
