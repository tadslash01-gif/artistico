package com.artistico.mobile.feature.browse

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.artistico.mobile.core.model.ProjectSummary
import com.artistico.mobile.core.network.HttpErrorParser
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class BrowseUiState(
    val loading: Boolean = false,
    val projects: List<ProjectSummary> = emptyList(),
    val error: String? = null,
    val selectedCategory: String = "All",
    val searchQuery: String = "",
    val sort: String = "trending"
)

class BrowseViewModel(
    private val repository: BrowseRepository = BrowseRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(BrowseUiState())
    val uiState: StateFlow<BrowseUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        search()
    }

    fun onCategorySelected(category: String) {
        _uiState.update { it.copy(selectedCategory = category) }
        search()
    }

    fun onSortChanged(sort: String) {
        _uiState.update { it.copy(sort = sort) }
        search()
    }

    fun onQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(400)
            search()
        }
    }

    fun search() {
        val state = _uiState.value
        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, error = null) }
            runCatching {
                val results = repository.searchProjects(
                    category = state.selectedCategory,
                    sort = state.sort,
                    search = state.searchQuery.ifBlank { null }
                )
                _uiState.update { it.copy(loading = false, projects = results) }
            }.onFailure { e ->
                _uiState.update { it.copy(loading = false, error = HttpErrorParser.parse(e)) }
            }
        }
    }
}
