package com.artistico.mobile.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.artistico.mobile.ui.screen.AuthScreen
import com.artistico.mobile.ui.screen.BrowseScreen
import com.artistico.mobile.ui.screen.CreatorProfileScreen
import com.artistico.mobile.ui.screen.HomeScreen
import com.artistico.mobile.ui.screen.NotificationsScreen
import com.artistico.mobile.ui.screen.OrdersScreen
import com.artistico.mobile.ui.screen.ProjectDetailScreen
import com.artistico.mobile.ui.screen.SplashScreen
import com.artistico.mobile.ui.screen.StreamPlayerScreen
import com.artistico.mobile.ui.screen.StreamsScreen

private object Routes {
    const val Splash = "splash"
    const val Auth = "auth"
    const val Home = "home"
    const val Browse = "browse"
    const val ProjectDetail = "project_detail/{slug}"
    const val CreatorProfile = "creator_profile/{uid}"
    const val Notifications = "notifications"
    const val Orders = "orders"
    const val Streams = "streams"
    const val StreamPlayer = "stream_player/{streamId}"

    fun projectDetail(slug: String) = "project_detail/$slug"
    fun creatorProfile(uid: String) = "creator_profile/$uid"
    fun streamPlayer(streamId: String) = "stream_player/$streamId"
}

@Composable
fun ArtisticoApp(
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Routes.Splash,
        modifier = modifier
    ) {
        composable(Routes.Splash) {
            SplashScreen(onResolve = { isSignedIn ->
                navController.navigate(if (isSignedIn) Routes.Home else Routes.Auth) {
                    popUpTo(navController.graph.findStartDestination().id) { inclusive = true }
                    launchSingleTop = true
                }
            })
        }

        composable(Routes.Auth) {
            AuthScreen(onAuthed = {
                navController.navigate(Routes.Home) {
                    popUpTo(Routes.Auth) { inclusive = true }
                    launchSingleTop = true
                }
            })
        }

        composable(Routes.Home) {
            HomeScreen(
                onBrowse = { navController.navigate(Routes.Browse) },
                onOpenProject = { slug -> navController.navigate(Routes.projectDetail(slug)) },
                onOpenNotifications = { navController.navigate(Routes.Notifications) },
                onOpenStreams = { navController.navigate(Routes.Streams) },
                onOpenOrders = { navController.navigate(Routes.Orders) }
            )
        }

        composable(Routes.Browse) {
            BrowseScreen(
                onBack = { navController.popBackStack() },
                onOpenProject = { slug -> navController.navigate(Routes.projectDetail(slug)) }
            )
        }

        composable(
            route = Routes.ProjectDetail,
            arguments = listOf(navArgument("slug") { type = NavType.StringType })
        ) { backStack ->
            val slug = backStack.arguments?.getString("slug") ?: return@composable
            ProjectDetailScreen(
                slug = slug,
                onOpenCreator = { uid -> navController.navigate(Routes.creatorProfile(uid)) },
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Routes.CreatorProfile,
            arguments = listOf(navArgument("uid") { type = NavType.StringType })
        ) { backStack ->
            val uid = backStack.arguments?.getString("uid") ?: return@composable
            CreatorProfileScreen(
                uid = uid,
                onOpenProject = { slug -> navController.navigate(Routes.projectDetail(slug)) },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.Notifications) {
            NotificationsScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.Orders) {
            OrdersScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.Streams) {
            StreamsScreen(
                onOpenStream = { streamId -> navController.navigate(Routes.streamPlayer(streamId)) },
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Routes.StreamPlayer,
            arguments = listOf(navArgument("streamId") { type = NavType.StringType })
        ) { backStack ->
            val streamId = backStack.arguments?.getString("streamId") ?: return@composable
            StreamPlayerScreen(
                streamId = streamId,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
