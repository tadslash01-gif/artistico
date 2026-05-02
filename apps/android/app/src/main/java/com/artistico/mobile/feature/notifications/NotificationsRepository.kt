package com.artistico.mobile.feature.notifications

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

data class NotificationItem(
    val id: String,
    val type: String,
    val actorName: String,
    val read: Boolean,
    val createdAt: Long?
)

class NotificationsRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    fun observeNotifications(limit: Long = 30): Flow<Result<List<NotificationItem>>> = callbackFlow {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank()) {
            trySend(Result.success(emptyList()))
            close()
            return@callbackFlow
        }

        val registration: ListenerRegistration = firestore
            .collection("notifications")
            .whereEqualTo("recipientId", uid)
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(limit)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.failure(error))
                    return@addSnapshotListener
                }

                val items = snapshot?.documents.orEmpty().map { doc ->
                    val createdAtTs = doc.getTimestamp("createdAt")
                    NotificationItem(
                        id = doc.getString("notificationId") ?: doc.id,
                        type = doc.getString("type") ?: "activity",
                        actorName = doc.getString("actorName") ?: "Someone",
                        read = doc.getBoolean("read") ?: false,
                        createdAt = createdAtTs?.seconds
                    )
                }
                trySend(Result.success(items))
            }

        awaitClose { registration.remove() }
    }
}
