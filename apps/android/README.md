# Artistico Native Android App (Kotlin)

This directory contains the native Android implementation for Artistico.

## Current status

- ✅ Project scaffolded with Kotlin + Jetpack Compose
- ✅ MVVM-ready package structure established
- ✅ Firebase dependencies added (Auth, Firestore, Storage)
- ✅ API client foundation added (Retrofit + OkHttp)
- ✅ Initial navigation graph and placeholder screens created
- ✅ Firebase email/password auth flow implemented (sign in + sign up + session-based splash routing)
- ✅ Authenticated API interceptor added (Firebase ID token in `Authorization: Bearer ...`)
- ✅ Home feed wired to real `GET /projects` endpoint with loading/error states
- ✅ Realtime notifications wired via Firestore listener (`notifications` collection)

## Next implementation steps

1. Add `google-services.json` to `app/` from your Firebase project.
2. Add project detail endpoint integration (`GET /projects/:slug`) with route arguments.
3. Implement follow/save/like actions with optimistic UI.
4. Add pagination (`limit` + `startAfter`) for Home/Browse feeds.

## Build notes

- Open `apps/android` directly in Android Studio.
- Use JDK 17.
- API base URL currently points to the Cloud Functions API and should be adjusted per environment.
