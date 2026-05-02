package com.artistico.mobile.feature.creator

import com.artistico.mobile.core.model.CreatorProfile
import com.artistico.mobile.core.model.ProjectSummary
import com.artistico.mobile.core.network.ApiClient
import com.artistico.mobile.core.network.FollowRequestDto
import com.artistico.mobile.feature.home.ProjectsRepository

class CreatorProfileRepository(
    private val usersApi: com.artistico.mobile.core.network.UsersApiService = ApiClient.users,
    private val socialApi: com.artistico.mobile.core.network.SocialApiService = ApiClient.social,
    private val projectsRepository: ProjectsRepository = ProjectsRepository()
) {
    suspend fun getCreatorProfile(uid: String): CreatorProfile {
        val dto = usersApi.getUser(uid)
        return CreatorProfile(
            uid = dto.uid,
            displayName = dto.displayName,
            username = dto.username,
            bio = dto.bio,
            avatarUrl = dto.avatarUrl,
            followerCount = dto.followerCount,
            followingCount = dto.followingCount,
            projectCount = dto.projectCount,
            isFollowing = dto.isFollowing
        )
    }

    suspend fun getCreatorProjects(creatorId: String): List<ProjectSummary> {
        return projectsRepository.getFeedProjects(creatorId = creatorId, limit = 30)
    }

    suspend fun follow(creatorId: String) {
        socialApi.follow(FollowRequestDto(creatorId))
    }

    suspend fun unfollow(creatorId: String) {
        socialApi.unfollow(creatorId)
    }
}
