package com.artistico.mobile.feature.creator

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.artistico.mobile.core.model.CreatorProfile
import com.artistico.mobile.core.model.ProjectSummary
import com.artistico.mobile.core.network.HttpErrorParser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CreatorProfileUiState(
    val loading: Boolean = true,
    val profile: CreatorProfile? = null,
    val projects: List<ProjectSummary> = emptyList(),
    val error: String? = null,
    val isFollowing: Boolean = false
)

class CreatorProfileViewModel(
    private val repository: CreatorProfileRepository = CreatorProfileRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(CreatorProfileUiState())
    val uiState: StateFlow<CreatorProfileUiState> = _uiState.asStateFlow()

    fun loadProfile(uid: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, error = null) }
            runCatching {
                val profile = repository.getCreatorProfile(uid)
                val projects = runCatching { repository.getCreatorProjects(uid) }.getOrDefault(emptyList())
                _uiState.update {
                    it.copy(
                        loading = false,
                        profile = profile,
                        projects = projects,
                        isFollowing = profile.isFollowing
                    )
                }
            }.onFailure { e ->
                _uiState.update { it.copy(loading = false, error = HttpErrorParser.parse(e)) }
            }
        }
    }

    fun toggleFollow() {
        val profile = _uiState.value.profile ?: return
        val wasFollowing = _uiState.value.isFollowing
        _uiState.update { it.copy(isFollowing = !wasFollowing) }
        viewModelScope.launch {
            runCatching {
                if (wasFollowing) repository.unfollow(profile.uid)
                else repository.follow(profile.uid)
            }.onFailure {
                _uiState.update { it.copy(isFollowing = wasFollowing) }
            }
        }
    }
}
