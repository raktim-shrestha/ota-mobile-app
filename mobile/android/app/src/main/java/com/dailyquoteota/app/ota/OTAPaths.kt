package com.dailyquoteota.app.ota

import android.content.Context
import org.json.JSONObject
import java.io.File

/**
 * Manages OTA file paths and metadata.json read/write.
 *
 * Layout under context.filesDir/ota/:
 *   current/   – active OTA bundle
 *   previous/  – last confirmed bundle (single-slot rollback)
 *   downloaded/ – staging area for fresh download
 *
 * metadata.json sits at ota/metadata.json and tracks:
 *   currentVersion     – semver string of active OTA bundle
 *   sha256             – hex SHA-256 of current bundle
 *   previousVersion    – nullable semver of previous slot
 *   pendingConfirmation – bool; true until JS calls confirmUpdate()
 *   pendingTimestamp   – Unix ms when pendingConfirmation was set
 */
object OTAPaths {

    // ── Directory helpers ────────────────────────────────────────────────────

    fun otaRoot(context: Context): File =
        File(context.filesDir, "ota").also { it.mkdirs() }

    fun currentDir(context: Context): File =
        File(otaRoot(context), "current").also { it.mkdirs() }

    fun previousDir(context: Context): File =
        File(otaRoot(context), "previous").also { it.mkdirs() }

    fun downloadedDir(context: Context): File =
        File(otaRoot(context), "downloaded").also { it.mkdirs() }

    fun currentBundle(context: Context): File =
        File(currentDir(context), "index.android.bundle")

    fun previousBundle(context: Context): File =
        File(previousDir(context), "index.android.bundle")

    fun downloadedBundle(context: Context): File =
        File(downloadedDir(context), "index.android.bundle")

    fun metadataFile(context: Context): File =
        File(otaRoot(context), "metadata.json")

    // ── Metadata model ───────────────────────────────────────────────────────

    data class OTAMetadata(
        val currentVersion: String?,
        val sha256: String?,
        val previousVersion: String?,
        val pendingConfirmation: Boolean,
        val pendingTimestamp: Long,
    )

    val emptyMetadata = OTAMetadata(
        currentVersion = null,
        sha256 = null,
        previousVersion = null,
        pendingConfirmation = false,
        pendingTimestamp = 0L,
    )

    // ── Read ─────────────────────────────────────────────────────────────────

    fun readMetadata(context: Context): OTAMetadata {
        val file = metadataFile(context)
        if (!file.exists()) return emptyMetadata
        return try {
            val json = JSONObject(file.readText())
            OTAMetadata(
                currentVersion = json.optString("currentVersion").ifBlank { null },
                sha256 = json.optString("sha256").ifBlank { null },
                previousVersion = json.optString("previousVersion").ifBlank { null },
                pendingConfirmation = json.optBoolean("pendingConfirmation", false),
                pendingTimestamp = json.optLong("pendingTimestamp", 0L),
            )
        } catch (e: Exception) {
            emptyMetadata
        }
    }

    // ── Write ────────────────────────────────────────────────────────────────

    fun writeMetadata(context: Context, meta: OTAMetadata) {
        val json = JSONObject()
        json.put("currentVersion", meta.currentVersion ?: "")
        json.put("sha256", meta.sha256 ?: "")
        json.put("previousVersion", meta.previousVersion ?: "")
        json.put("pendingConfirmation", meta.pendingConfirmation)
        json.put("pendingTimestamp", meta.pendingTimestamp)
        metadataFile(context).writeText(json.toString())
    }

    // ── Clear ────────────────────────────────────────────────────────────────

    /**
     * Deletes all OTA state: current bundle, previous bundle, metadata.
     * Called when integrity check fails at boot (nuclear rollback to embedded).
     */
    fun clearAll(context: Context) {
        currentDir(context).deleteRecursively()
        previousDir(context).deleteRecursively()
        downloadedDir(context).deleteRecursively()
        metadataFile(context).delete()
        // Recreate empty dirs
        currentDir(context)
        previousDir(context)
        downloadedDir(context)
    }
}
