package com.supari.calculator.utils

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import com.supari.calculator.BuildConfig
import com.supari.calculator.model.AppUpdateInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object UpdateChecker {
    private const val OFFICIAL_REPO = "rahatshari/Supari-calculator"
    private const val OFFICIAL_APK_URL =
        "https://github.com/$OFFICIAL_REPO/releases/latest/download/supari-calculator-offline.apk"
    private const val OFFICIAL_RELEASE_URL =
        "https://github.com/$OFFICIAL_REPO/releases/latest"

    fun isOnline(context: Context): Boolean {
        return try {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val network = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(network) ?: return false
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } catch (_: Exception) {
            false
        }
    }

    private fun parseSemVer(vStr: String): List<Int> {
        val clean = vStr.trim().removePrefix("v").removePrefix("V").substringBefore("-").trim()
        if (clean.isEmpty()) return listOf(0)
        return clean.split(".").map { it.toIntOrNull() ?: 0 }
    }

    fun compareVersions(verA: String, verB: String): Int {
        val a = parseSemVer(verA)
        val b = parseSemVer(verB)
        val maxLen = maxOf(a.size, b.size)
        for (i in 0 until maxLen) {
            val va = a.getOrElse(i) { 0 }
            val vb = b.getOrElse(i) { 0 }
            if (va > vb) return 1
            if (va < vb) return -1
        }
        return 0
    }

    suspend fun checkForUpdates(context: Context): AppUpdateInfo = withContext(Dispatchers.IO) {
        val currentVersion = BuildConfig.VERSION_NAME
        val defaultInfo = AppUpdateInfo(
            hasUpdate = false,
            latestVersion = currentVersion,
            currentVersion = currentVersion,
            downloadUrl = OFFICIAL_RELEASE_URL,
            apkUrl = OFFICIAL_APK_URL
        )

        if (!isOnline(context)) return@withContext defaultInfo

        // 1. Check official GitHub Releases API
        try {
            val apiUrl = URL("https://api.github.com/repos/$OFFICIAL_REPO/releases/latest?_t=${System.currentTimeMillis()}")
            val conn = (apiUrl.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8000
                readTimeout = 8000
                setRequestProperty("Accept", "application/vnd.github.v3+json")
                setRequestProperty("User-Agent", "SupariCalculator-Android")
            }

            if (conn.responseCode == 200) {
                val body = conn.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(body)
                val rawTag = json.optString("tag_name", json.optString("name", ""))
                val latestVer = rawTag.trim().removePrefix("v").removePrefix("V").substringBefore("-").trim()

                if (latestVer.isNotEmpty() && compareVersions(latestVer, currentVersion) > 0) {
                    var apkAssetUrl = OFFICIAL_APK_URL
                    val assets = json.optJSONArray("assets")
                    if (assets != null) {
                        for (i in 0 until assets.length()) {
                            val asset = assets.getJSONObject(i)
                            val name = asset.optString("name", "")
                            if (name.endsWith(".apk", ignoreCase = true)) {
                                val url = asset.optString("browser_download_url", "")
                                if (url.isNotEmpty()) {
                                    apkAssetUrl = url
                                    break
                                }
                            }
                        }
                    }

                    return@withContext AppUpdateInfo(
                        hasUpdate = true,
                        latestVersion = latestVer,
                        currentVersion = currentVersion,
                        releaseTitle = json.optString("name", "ভার্সন $latestVer"),
                        releaseNotes = json.optString("body", "নতুন ফিচার এবং উন্নতি যুক্ত করা হয়েছে।"),
                        downloadUrl = json.optString("html_url", OFFICIAL_RELEASE_URL),
                        apkUrl = apkAssetUrl
                    )
                }
                return@withContext defaultInfo
            }
        } catch (_: Exception) {
            // Fall back to version.json
        }

        // 2. Fallback: raw version.json from main branch
        try {
            val rawUrl = URL("https://raw.githubusercontent.com/$OFFICIAL_REPO/main/public/version.json?_t=${System.currentTimeMillis()}")
            val conn = (rawUrl.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8000
                readTimeout = 8000
                setRequestProperty("User-Agent", "SupariCalculator-Android")
            }
            if (conn.responseCode == 200) {
                val body = conn.inputStream.bufferedReader().use { it.readText() }
                val meta = JSONObject(body)
                val latestVer = meta.optString("version", "").trim().removePrefix("v").removePrefix("V").trim()
                if (latestVer.isNotEmpty() && compareVersions(latestVer, currentVersion) > 0) {
                    return@withContext AppUpdateInfo(
                        hasUpdate = true,
                        latestVersion = latestVer,
                        currentVersion = currentVersion,
                        releaseTitle = meta.optString("title", "ভার্সন $latestVer"),
                        releaseNotes = meta.optString("releaseNotes", "নতুন আপডেট উপলব্ধ।"),
                        downloadUrl = meta.optString("downloadUrl", OFFICIAL_RELEASE_URL),
                        apkUrl = meta.optString("apkUrl", OFFICIAL_APK_URL)
                    )
                }
            }
        } catch (_: Exception) {
            // Unreachable
        }

        return@withContext defaultInfo
    }

    fun openApkDownload(context: Context, apkUrl: String? = null) {
        val target = if (!apkUrl.isNullOrBlank()) apkUrl else OFFICIAL_APK_URL
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(target)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
            try {
                val fallbackIntent = Intent(Intent.ACTION_VIEW, Uri.parse(OFFICIAL_RELEASE_URL)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(fallbackIntent)
            } catch (_: Exception) {
            }
        }
    }
}
