package com.artistico.mobile.feature.browse

import com.artistico.mobile.core.model.ProjectSummary
import com.artistico.mobile.feature.home.ProjectsRepository

val CATEGORIES = listOf(
    "All", "illustration", "design", "photography", "animation",
    "music", "writing", "fashion", "crafts", "architecture",
    "film", "game-design", "other"
)

class BrowseRepository(
    private val projectsRepository: ProjectsRepository = ProjectsRepository()
) {
    suspend fun searchProjects(
        category: String? = null,
        sort: String = "trending",
        search: String? = null,
        startAfter: String? = null
    ): List<ProjectSummary> {
        return projectsRepository.getFeedProjects(
            sort = sort,
            category = if (category == "All") null else category,
            search = search,
            startAfter = startAfter,
            limit = 30
        )
    }
}
