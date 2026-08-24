package com.dailyquoteota.app.ota

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import java.io.File
import java.security.MessageDigest

/**
 * Called at Application.onCreate() BEFORE ReactHost construction.
 *
 * Responsibilities:
 * 1. Verify OTA current bundle integrity (exists + SHA-256 matches metadata).
 * 2. If pendingConfirmation=true at boot, the previous JS session crashed
 *    before calling confirmUpdate() → auto-rollback after [WATCHDOG_MS].
 * 3. Return the absolute path to use as the JS bundle, or null to use the
 *    embedded asset bundle.
 */
object OTABootstrap {

    private const val TAG = "OTABootstrap"
    private const val WATCHDOG_MS = 5_000L  // 5 s to call confirmUpdate()

    @Volatile
    private var watchdogHandler: Handler? = null
    @Volatile
    private var watchdogRunnable: Runnable? = null

    /**
     * Returns absolute path to OTA bundle if valid, else null (use embedded).
     * Must be called on the main thread from Application.onCreate().
     */
    fun resolveBundlePath(context: Context): String? {
        val meta = OTAPaths.readMetadata(context)

        // No OTA bundle ever stored
        if (meta.currentVersion == null || meta.sha256 == null) {
            Log.i(TAG, "No OTA bundle. Using embedded.")
            return null
        }

        val bundle = OTAPaths.currentBundle(context)

        // Bundle file missing
        if (!bundle.exists()) {
            Log.w(TAG, "OTA bundle missing. Clearing and using embedded.")
            OTAPaths.clearAll(context)
            return null
        }

        // SHA-256 integrity check
        val actualSha = sha256Hex(bundle)
        if (!actualSha.equals(meta.sha256, ignoreCase = true)) {
            Log.e(TAG, "OTA bundle SHA-256 mismatch. Clearing and using embedded.")
            OTAPaths.clearAll(context)
            return null
        }

        // Integrity OK. Check for pending confirmation watchdog.
        if (meta.pendingConfirmation) {
            Log.w(TAG, "pendingConfirmation=true at boot. Starting ${WATCHDOG_MS}ms rollback watchdog.")
            startWatchdog(context)
        }

        Log.i(TAG, "OTA bundle v${meta.currentVersion} verified. Using OTA bundle.")
        return bundle.absolutePath
    }

    /**
     * Called from OTAModule.confirmUpdate(). Cancels the watchdog.
     */
    fun confirmUpdate(context: Context) {
        cancelWatchdog()
        val meta = OTAPaths.readMetadata(context)
        OTAPaths.writeMetadata(
            context,
            meta.copy(pendingConfirmation = false, pendingTimestamp = 0L)
        )
        Log.i(TAG, "OTA update confirmed. Watchdog cancelled.")
    }

    /**
     * Called from OTAModule.rollback() or watchdog trigger.
     * Restores previous bundle, or clears to embedded if no previous.
     */
    fun rollback(context: Context): Boolean {
        cancelWatchdog()
        val meta = OTAPaths.readMetadata(context)
        val previousBundle = OTAPaths.previousBundle(context)

        return if (meta.previousVersion != null && previousBundle.exists()) {
            // Swap previous → current
            val currentDir = OTAPaths.currentDir(context)
            currentDir.deleteRecursively()
            currentDir.mkdirs()
            previousBundle.copyTo(OTAPaths.currentBundle(context), overwrite = true)
            OTAPaths.previousDir(context).deleteRecursively()
            OTAPaths.previousDir(context)

            OTAPaths.writeMetadata(
                context,
                OTAPaths.OTAMetadata(
                    currentVersion = meta.previousVersion,
                    sha256 = sha256Hex(OTAPaths.currentBundle(context)),
                    previousVersion = null,
                    pendingConfirmation = false,
                    pendingTimestamp = 0L,
                )
            )
            Log.i(TAG, "Rolled back to v${meta.previousVersion}.")
            true
        } else {
            // No previous — clear to embedded
            OTAPaths.clearAll(context)
            Log.w(TAG, "No previous bundle. Rolled back to embedded.")
            false
        }
    }

    // ── Watchdog ─────────────────────────────────────────────────────────────

    private fun startWatchdog(context: Context) {
        cancelWatchdog()
        val handler = Handler(Looper.getMainLooper())
        val runnable = Runnable {
            Log.e(TAG, "Watchdog fired! JS never called confirmUpdate(). Rolling back.")
            rollback(context)
        }
        watchdogHandler = handler
        watchdogRunnable = runnable
        handler.postDelayed(runnable, WATCHDOG_MS)
    }

    fun cancelWatchdog() {
        watchdogRunnable?.let { watchdogHandler?.removeCallbacks(it) }
        watchdogHandler = null
        watchdogRunnable = null
    }

    // ── SHA-256 ───────────────────────────────────────────────────────────────

    fun sha256Hex(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { stream ->
            val buf = ByteArray(8192)
            var read: Int
            while (stream.read(buf).also { read = it } != -1) {
                digest.update(buf, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
}
