package com.artistico.mobile.feature.home

import com.artistico.mobile.core.model.ProjectSummary
import com.artistico.mobile.core.network.ApiClient
import com.artistico.mobile.core.network.ProjectsApiService

class ProjectsRepository(
    private val api: ProjectsApiService = ApiClient.projects
) {
    suspend fun getFeedProjects(
        sort: String = "trending",
        category: String? = null,
        search: String? = null,
        creatorId: String? = null,
        startAfter: String? = null,
        limit: Int = 20
    ): List<ProjectSummary> {
        val response = api.getProjects(
            sort = sort,
            limit = limit,
            category = category,
            search = search,
            creatorId = creatorId,
            startAfter = startAfter
        )
        return response.projects.map { dto ->
            ProjectSummary(
                projectId = dto.projectId,
                slug = dto.slug,
                title = dto.title,
                creatorId = dto.creatorId,
                creatorName = dto.creatorName,
                imageUrl = dto.images?.firstOrNull()
            )
        }
    }
}
