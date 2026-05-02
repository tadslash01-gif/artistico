package com.artistico.mobile.ui.screen

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Badge
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import coil.compose.AsyncImage
import com.artistico.mobile.feature.auth.AuthMode
import com.artistico.mobile.feature.auth.AuthViewModel
import com.artistico.mobile.feature.browse.BrowseViewModel
import com.artistico.mobile.feature.browse.CATEGORIES
import com.artistico.mobile.feature.creator.CreatorProfileViewModel
import com.artistico.mobile.feature.home.HomeViewModel
import com.artistico.mobile.feature.notifications.NotificationsViewModel
import com.artistico.mobile.feature.orders.OrdersViewModel
import com.artistico.mobile.feature.project.ProjectDetailViewModel
import com.artistico.mobile.feature.streams.StreamPlayerViewModel
import com.artistico.mobile.feature.streams.StreamsViewModel
import com.google.firebase.auth.FirebaseAuth

// ─────────────────────────────────────────────
// Splash
// ─────────────────────────────────────────────

@Composable
fun SplashScreen(onResolve: (isSignedIn: Boolean) -> Unit) {
    LaunchedEffect(Unit) {
        onResolve(FirebaseAuth.getInstance().currentUser != null)
    }
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Artistico", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(16.dp))
            CircularProgressIndicator()
        }
    }
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

@Composable
fun AuthScreen(
    onAuthed: () -> Unit,
    authViewModel: AuthViewModel = viewModel()
) {
    val state by authViewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(state.isAuthenticated) {
        if (state.isAuthenticated) onAuthed()
    }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Artistico", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = state.mode == AuthMode.SIGN_IN,
                    onClick = { authViewModel.switchMode(AuthMode.SIGN_IN) },
                    label = { Text("Sign In") }
                )
                FilterChip(
                    selected = state.mode == AuthMode.SIGN_UP,
                    onClick = { authViewModel.switchMode(AuthMode.SIGN_UP) },
                    label = { Text("Sign Up") }
                )
            }

            OutlinedTextField(
                value = state.email,
                onValueChange = authViewModel::onEmailChanged,
                singleLine = true,
                label = { Text("Email") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = state.password,
                onValueChange = authViewModel::onPasswordChanged,
                singleLine = true,
                label = { Text("Password") },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = authViewModel::submit,
                enabled = !state.isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(if (state.mode == AuthMode.SIGN_IN) "Sign In" else "Create Account")
            }

            if (state.isLoading) CircularProgressIndicator(modifier = Modifier.size(22.dp))

            if (!state.errorMessage.isNullOrBlank()) {
                Text(
                    text = state.errorMessage ?: "",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

// ─────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onBrowse: () -> Unit,
    onOpenProject: (slug: String) -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenStreams: () -> Unit,
    onOpenOrders: () -> Unit,
    homeViewModel: HomeViewModel = viewModel()
) {
    val state by homeViewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Artistico", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onOpenNotifications) {
                        Icon(Icons.Default.Star, contentDescription = "Notifications")
                    }
                    IconButton(onClick = onOpenStreams) {
                        Icon(Icons.Default.Person, contentDescription = "Live")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(onClick = onBrowse, modifier = Modifier.weight(1f)) { Text("Browse") }
                OutlinedButton(onClick = onOpenOrders, modifier = Modifier.weight(1f)) { Text("Orders") }
            }

            when {
                state.loading -> Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) { CircularProgressIndicator() }

                !state.error.isNullOrBlank() -> ErrorText(state.error!!)

                state.projects.isEmpty() -> Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) { Text("No projects yet.") }

                else -> LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.projects, key = { it.projectId }) { project ->
                        ProjectCard(
                            title = project.title,
                            creatorName = project.creatorName,
                            imageUrl = project.imageUrl,
                            onClick = { onOpenProject(project.slug) }
                        )
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────
// Browse
// ─────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BrowseScreen(
    onBack: () -> Unit,
    onOpenProject: (slug: String) -> Unit,
    browseViewModel: BrowseViewModel = viewModel()
) {
    val state by browseViewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Browse") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            OutlinedTextField(
                value = state.searchQuery,
                onValueChange = browseViewModel::onQueryChanged,
                placeholder = { Text("Search projects…") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            )

            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(CATEGORIES) { cat ->
                    FilterChip(
                        selected = state.selectedCategory == cat,
                        onClick = { browseViewModel.onCategorySelected(cat) },
                        label = { Text(cat) }
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            when {
                state.loading -> Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) { CircularProgressIndicator() }

                !state.error.isNullOrBlank() -> ErrorText(state.error!!)

                state.projects.isEmpty() -> Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) { Text("No results.") }

                else -> LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.projects, key = { it.projectId }) { project ->
                        ProjectCard(
                            title = project.title,
                            creatorName = project.creatorName,
                            imageUrl = project.imageUrl,
                            onClick = { onOpenProject(project.slug) }
                        )
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────
// Project Detail
// ─────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectDetailScreen(
    slug: String,
    onOpenCreator: (uid: String) -> Unit,
    onBack: () -> Unit,
    viewModel: ProjectDetailViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(slug) { viewModel.loadProject(slug) }

    LaunchedEffect(state.checkoutUrl) {
        state.checkoutUrl?.let { url ->
            openCustomTab(context, url)
            viewModel.clearCheckoutUrl()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.project?.title ?: "Project") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = viewModel::toggleLike) {
                        Icon(Icons.Default.FavoriteBorder, contentDescription = "Like")
                    }
                    IconButton(onClick = viewModel::toggleSave) {
                        Icon(Icons.Default.Star, contentDescription = "Save")
                    }
                }
            )
        }
    ) { padding ->
        when {
            state.loading -> Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) { CircularProgressIndicator() }

            !state.error.isNullOrBlank() -> ErrorText(state.error!!)

            state.project != null -> {
                val project = state.project!!
                LazyColumn(
                    modifier = Modifier.padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        if (project.images.isNotEmpty()) {
                            AsyncImage(
                                model = project.images.first(),
                                contentDescription = project.title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .aspectRatio(16f / 9f)
                                    .clip(RoundedCornerShape(12.dp))
                            )
                        }
                    }

                    item {
                        Text(project.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        if (project.description.isNotBlank()) {
                            Spacer(Modifier.height(8.dp))
                            Text(project.description, style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Text("♥ ${project.likeCount}", style = MaterialTheme.typography.bodySmall)
                            Text("★ ${project.saveCount}", style = MaterialTheme.typography.bodySmall)
                            Text("💬 ${project.commentCount}", style = MaterialTheme.typography.bodySmall)
                        }
                    }

                    item {
                        Row(
                            modifier = Modifier.clickable { onOpenCreator(project.creatorId) },
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            AsyncImage(
                                model = project.creatorAvatar,
                                contentDescription = project.creatorName,
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                            )
                            Column {
                                Text(project.creatorName ?: "Creator", fontWeight = FontWeight.Medium)
                                Text("View profile →", style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }

                    if (project.products.isNotEmpty()) {
                        item {
                            Text("Products", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        }
                        items(project.products, key = { it.productId }) { product ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    AsyncImage(
                                        model = product.imageUrl,
                                        contentDescription = product.title,
                                        modifier = Modifier
                                            .size(56.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                    )
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(product.title, fontWeight = FontWeight.Medium)
                                        Text(
                                            "${product.currency.uppercase()} ${product.price}",
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                    Button(onClick = { viewModel.startCheckout(product.productId) }) {
                                        Text("Buy")
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Text("Add a comment", style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(4.dp))
                        OutlinedTextField(
                            value = state.commentText,
                            onValueChange = viewModel::onCommentTextChanged,
                            placeholder = { Text("Write something…") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(Modifier.height(4.dp))
                        Button(
                            onClick = viewModel::postComment,
                            enabled = state.commentText.isNotBlank() && !state.isPostingComment
                        ) {
                            Text("Post")
                        }
                    }

                    if (state.comments.isNotEmpty()) {
                        item {
                            Text("Comments", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        }
                        items(state.comments, key = { it.commentId }) { comment ->
                            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                Text(comment.authorName ?: "Anonymous", fontWeight = FontWeight.Medium,
                                    style = MaterialTheme.typography.bodySmall)
                                Text(comment.text, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────
// Creator Profile
// ─────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatorProfileScreen(
    uid: String,
    onOpenProject: (slug: String) -> Unit,
    onBack: () -> Unit,
    viewModel: CreatorProfileViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uid) { viewModel.loadProfile(uid) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.profile?.displayName ?: "Creator") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        when {
            state.loading -> Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) { CircularProgressIndicator() }

            !state.error.isNullOrBlank() -> ErrorText(state.error!!)

            state.profile != null -> {
                val profile = state.profile!!
                LazyColumn(
                    modifier = Modifier.padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            AsyncImage(
                                model = profile.avatarUrl,
                                contentDescription = profile.displayName,
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(CircleShape)
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(profile.displayName ?: "Unknown", style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold)
                                if (!profile.username.isNullOrBlank()) {
                                    Text("@${profile.username}", style = MaterialTheme.typography.bodySmall)
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Text("${profile.followerCount} followers", style = MaterialTheme.typography.bodySmall)
                                    Text("${profile.projectCount} projects", style = MaterialTheme.typography.bodySmall)
                                }
                            }
                            Button(onClick = viewModel::toggleFollow) {
                                Text(if (state.isFollowing) "Unfollow" else "Follow")
                            }
                        }
                    }

                    if (!profile.bio.isNullOrBlank()) {
                        item { Text(profile.bio, style = MaterialTheme.typography.bodyMedium) }
                    }

                    item {
                        Text("Projects", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    }

                    items(state.projects, key = { it.projectId }) { project ->
                        ProjectCard(
                            title = project.title,
                            creatorName = null,
                            imageUrl = project.imageUrl,
                            onClick = { onOpenProject(project.slug) }
                        )
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    onBack: () -> Unit,
    notificationsViewModel: NotificationsViewModel = viewModel()
) {
    val state by notificationsViewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        when {
            state.loading -> Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) { CircularProgressIndicator() }

            !state.error.isNullOrBlank() -> ErrorText(state.error!!)

            state.items.isEmpty() -> Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) { Text("No notifications yet.") }

            else -> LazyColumn(
                modifier = Modifier.padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(state.items, key = { it.id }) { item ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = if (!item.read)
                            CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                        else CardDefaults.cardColors()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (!item.read) {
                                Badge(modifier = Modifier.size(8.dp)) {}
                            }
                            Column {
                                Text(item.actorName, fontWeight = FontWeight.Medium,
                                    style = MaterialTheme.typography.bodyMedium)
                                Text(item.type, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    onBack: () -> Unit,
    ordersViewModel: OrdersViewModel = viewModel()
) {
    val state by ordersViewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Orders") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = state.role == "buyer",
                    onClick = { ordersViewModel.switchRole("buyer") },
                    label = { Text("Purchases") }
                )
                FilterChip(
                    selected = state.role == "creator",
                    onClick = { ordersViewModel.switchRole("creator") },
                    label = { Text("Sales") }
                )
            }

            when {
                state.loading -> Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) { CircularProgressIndicator() }

                !state.error.isNullOrBlank() -> ErrorText(state.error!!)

                state.orders.isEmpty() -> Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) { Text("No orders yet.") }

                else -> LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.orders, key = { it.orderId }) { order ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(order.productTitle, fontWeight = FontWeight.SemiBold)
                                Text(
                                    "${order.currency.uppercase()} ${order.amount}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                                Text("Status: ${order.status}", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────
// Streams
// ─────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StreamsScreen(
    onOpenStream: (streamId: String) -> Unit,
    onBack: () -> Unit,
    streamsViewModel: StreamsViewModel = viewModel()
) {
    val state by streamsViewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Live Streams") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        when {
            state.loading -> Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) { CircularProgressIndicator() }

            !state.error.isNullOrBlank() -> ErrorText(state.error!!)

            state.streams.isEmpty() -> Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) { Text("No live streams right now.") }

            else -> LazyColumn(
                modifier = Modifier.padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(state.streams, key = { it.streamId }) { stream ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onOpenStream(stream.streamId) }
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            AsyncImage(
                                model = stream.thumbnailUrl,
                                contentDescription = stream.title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(RoundedCornerShape(8.dp))
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(stream.title, fontWeight = FontWeight.SemiBold)
                                Text(stream.creatorName ?: "Creator", style = MaterialTheme.typography.bodySmall)
                                Text("${stream.viewerCount} watching", style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.primary)
                            }
                            Badge { Text("LIVE") }
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────
// Stream Player (ExoPlayer + Mux HLS)
// ─────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StreamPlayerScreen(
    streamId: String,
    onBack: () -> Unit,
    viewModel: StreamPlayerViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(streamId) { viewModel.loadStream(streamId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.stream?.title ?: "Live Stream") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            when {
                state.loading -> Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(240.dp),
                    contentAlignment = Alignment.Center
                ) { CircularProgressIndicator() }

                !state.error.isNullOrBlank() -> ErrorText(state.error!!)

                state.hlsUrl != null -> {
                    val player = remember(state.hlsUrl) {
                        ExoPlayer.Builder(context).build().apply {
                            setMediaItem(MediaItem.fromUri(state.hlsUrl!!))
                            prepare()
                            playWhenReady = true
                        }
                    }

                    DisposableEffect(player) {
                        onDispose { player.release() }
                    }

                    AndroidView(
                        factory = { ctx ->
                            PlayerView(ctx).apply {
                                this.player = player
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(16f / 9f)
                    )

                    state.stream?.let { stream ->
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(stream.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            Text(stream.creatorName ?: "Creator", style = MaterialTheme.typography.bodyMedium)
                            Text("${stream.viewerCount} watching", style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────
// Shared composables
// ─────────────────────────────────────────────

@Composable
private fun ProjectCard(
    title: String,
    creatorName: String?,
    imageUrl: String?,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column {
            AsyncImage(
                model = imageUrl,
                contentDescription = title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
            )
            Column(modifier = Modifier.padding(12.dp)) {
                Text(title, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyLarge)
                if (!creatorName.isNullOrBlank()) {
                    Text(creatorName, style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
private fun ErrorText(message: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
    }
}

private fun openCustomTab(context: Context, url: String) {
    runCatching {
        CustomTabsIntent.Builder().build().launchUrl(context, Uri.parse(url))
    }
}
