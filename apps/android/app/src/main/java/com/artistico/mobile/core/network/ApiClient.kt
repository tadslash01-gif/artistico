package com.artistico.mobile.core.network

import com.artistico.mobile.BuildConfig
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    private val authTokenInterceptor = AuthTokenInterceptor()

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BASIC
    }

    private val moshi: Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(authTokenInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL + "/")
        .client(okHttpClient)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    val projects: ProjectsApiService by lazy { retrofit.create(ProjectsApiService::class.java) }
    val users: UsersApiService by lazy { retrofit.create(UsersApiService::class.java) }
    val social: SocialApiService by lazy { retrofit.create(SocialApiService::class.java) }
    val products: ProductsApiService by lazy { retrofit.create(ProductsApiService::class.java) }
    val checkout: CheckoutApiService by lazy { retrofit.create(CheckoutApiService::class.java) }
    val orders: OrdersApiService by lazy { retrofit.create(OrdersApiService::class.java) }
    val streams: StreamsApiService by lazy { retrofit.create(StreamsApiService::class.java) }
}
