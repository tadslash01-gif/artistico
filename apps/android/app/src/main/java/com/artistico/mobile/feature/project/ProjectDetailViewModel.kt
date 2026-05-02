package com.artistico.mobile.feature.project

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.artistico.mobile.core.model.Comment
import com.artistico.mobile.core.model.ProjectDetail
import com.artistico.mobile.core.network.HttpErrorParser
import com.artistico.mobile.core.network.SocialApiService
import com.artistico.mobile.core.network.ApiClient
import com.artistico.mobile.core.network.CommentRequestDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProjectDetailUiState(
    val loading: Boolean = true,
    val project: ProjectDetail? = null,
    val comments: List<Comment> = emptyList(),
    val error: String? = null,
    val checkoutUrl: String? = null,
    val commentText: String = "",
    val isPostingComment: Boolean = false
)

class ProjectDetailViewModel(
    private val repository: ProjectDetailRepository = ProjectDetailRepository(),
    private val socialApi: SocialApiService = ApiClient.social,
    private val checkoutApi: com.artistico.mobile.core.network.CheckoutApiService = ApiClient.checkout
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProjectDetailUiState())
    val uiState: StateFlow<ProjectDetailUiState> = _uiState.asStateFlow()

    fun loadProject(slug: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, error = null) }
            runCatching {
                val detail = repository.getProjectDetail(slug)
                val comments = runCatching { repository.getComments(detail.projectId) }.getOrDefault(emptyList())
                _uiState.update { it.copy(loading = false, project = detail, comments = comments) }
            }.onFailure { e ->
                _uiState.update { it.copy(loading = false, error = HttpErrorParser.parse(e)) }
            }
        }
    }

    fun toggleLike() {
        val project = _uiState.value.project ?: return
        viewModelScope.launch {
            runCatching { socialApi.like(com.artistico.mobile.core.network.LikeRequestDto(project.projectId)) }
        }
    }

    fun toggleSave() {
        val project = _uiState.value.project ?: return
        viewModelScope.launch {
            runCatching { socialApi.save(com.artistico.mobile.core.network.SaveRequestDto(project.projectId)) }
        }
    }

    fun onCommentTextChanged(text: String) {
        _uiState.update { it.copy(commentText = text) }
    }

    fun postComment() {
        val project = _uiState.value.project ?: return
        val text = _uiState.value.commentText.trim()
        if (text.isBlank()) return
        viewModelScope.launch {
            _uiState.update { it.copy(isPostingComment = true) }
            runCatching {
                socialApi.postComment(CommentRequestDto(projectId = project.projectId, text = text))
                val refreshed = repository.getComments(project.projectId)
                _uiState.update { it.copy(isPostingComment = false, commentText = "", comments = refreshed) }
            }.onFailure {
                _uiState.update { it.copy(isPostingComment = false) }
            }
        }
    }

    fun startCheckout(productId: String) {
        viewModelScope.launch {
            runCatching {
                val session = checkoutApi.createSession(
                    com.artistico.mobile.core.network.CheckoutSessionRequestDto(productId)
                )
                _uiState.update { it.copy(checkoutUrl = session.url) }
            }.onFailure { e ->
                _uiState.update { it.copy(error = HttpErrorParser.parse(e)) }
            }
        }
    }

    fun clearCheckoutUrl() {
        _uiState.update { it.copy(checkoutUrl = null) }
    }
}
