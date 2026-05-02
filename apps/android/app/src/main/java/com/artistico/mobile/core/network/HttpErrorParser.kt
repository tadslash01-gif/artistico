package com.artistico.mobile.core.network

import retrofit2.HttpException
import java.io.IOException

object HttpErrorParser {
    fun userMessage(error: Throwable): String {
        return when (error) {
            is HttpException -> when (error.code()) {
                401 -> "Session expired. Please sign in again."
                403 -> "You do not have permission for this action."
                404 -> "Requested resource not found."
                429 -> "Too many requests. Please try again shortly."
                else -> "Server error (${error.code()}). Please try again."
            }

            is IOException -> "Network error. Check connection and retry."
            else -> error.message ?: "Unexpected error occurred."
        }
    }
}
