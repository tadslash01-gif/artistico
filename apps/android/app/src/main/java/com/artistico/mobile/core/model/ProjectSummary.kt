package com.artistico.mobile.core.model

data class ProjectSummary(
    val projectId: String,
    val slug: String,
    val title: String,
    val creatorId: String,
    val creatorName: String?,
    val imageUrl: String?
)
