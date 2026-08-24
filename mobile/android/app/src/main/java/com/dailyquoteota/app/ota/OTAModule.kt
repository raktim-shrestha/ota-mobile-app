package com.dailyquoteota.app.ota

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Process
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.ZipInputStream

class OTAModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  // ── Metadata ─────────────────────────────────────────────────────────────

  @ReactMethod
  fun getMetadata(promise: Promise) {
    try {
      val ctx = reactApplicationContext
      val meta = OTAPaths.readMetadata(ctx)
      val map = Arguments.createMap()
      map.putString("currentVersion", meta.currentVersion)
      map.putString("sha256", meta.sha256)
      map.putString("previousVersion", meta.previousVersion)
      map.putBoolean("pendingConfirmation", meta.pendingConfirmation)
      map.putDouble("pendingTimestamp", meta.pendingTimestamp.toDouble())
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("OTA_GET_METADATA_ERROR", e.message, e)
    }
  }

  // ── SHA-256 ───────────────────────────────────────────────────────────────

  @ReactMethod
  fun sha256File(filePath: String, promise: Promise) {
    Thread {
      try {
        val file = File(filePath)
        if (!file.exists()) {
          promise.reject("OTA_SHA256_ERROR", "File not found: $filePath")
          return@Thread
        }
        val hex = OTABootstrap.sha256Hex(file)
        promise.resolve(hex)
      } catch (e: Exception) {
        promise.reject("OTA_SHA256_ERROR", e.message, e)
      }
    }.start()
  }

  // ── verifyAndStage ────────────────────────────────────────────────────────

  @ReactMethod
  fun verifyAndStage(downloadedPath: String, expectedSha256: String, newVersion: String, promise: Promise) {
    Thread {
      try {
        val ctx = reactApplicationContext
        val downloadedFile = File(downloadedPath)

        if (!downloadedFile.exists()) {
          promise.reject("OTA_STAGE_ERROR", "Downloaded file not found: $downloadedPath")
          return@Thread
        }

        val actualSha = OTABootstrap.sha256Hex(downloadedFile)
        if (!actualSha.equals(expectedSha256, ignoreCase = true)) {
          downloadedFile.delete()
          promise.reject("OTA_SHA256_MISMATCH", "SHA-256 mismatch. Expected $expectedSha256 got $actualSha")
          return@Thread
        }

        val currentBundle = OTAPaths.currentBundle(ctx)
        val previousDir = OTAPaths.previousDir(ctx)
        val meta = OTAPaths.readMetadata(ctx)

        previousDir.deleteRecursively()
        previousDir.mkdirs()

        val previousVersion: String? = if (currentBundle.exists() && meta.currentVersion != null) {
          currentBundle.copyTo(OTAPaths.previousBundle(ctx), overwrite = true)
          meta.currentVersion
        } else {
          null
        }

        val currentDir = OTAPaths.currentDir(ctx)
        currentDir.deleteRecursively()
        currentDir.mkdirs()

        // Extract JS bundle from ZIP (if ZIP), otherwise copy directly
        val destBundle = OTAPaths.currentBundle(ctx)
        val isZip = downloadedFile.length() >= 4 &&
          downloadedFile.readBytes().let { b ->
            b[0] == 0x50.toByte() && b[1] == 0x4B.toByte()
          }
        if (isZip) {
          Log.i(TAG, "Extracting bundle from ZIP archive")
          var extracted = false
          ZipInputStream(downloadedFile.inputStream()).use { zis ->
            var entry = zis.nextEntry
            while (entry != null) {
              if (entry.name.endsWith(".bundle") || entry.name == "index.android.bundle") {
                FileOutputStream(destBundle).use { out ->
                  zis.copyTo(out)
                }
                extracted = true
                Log.i(TAG, "Extracted '${entry.name}' -> ${destBundle.absolutePath} (${destBundle.length()} bytes)")
                break
              }
              entry = zis.nextEntry
            }
          }
          if (!extracted) {
            downloadedFile.delete()
            promise.reject("OTA_STAGE_ERROR", "No .bundle file found inside ZIP")
            return@Thread
          }
        } else {
          downloadedFile.copyTo(destBundle, overwrite = true)
        }
        downloadedFile.delete()
        OTAPaths.downloadedDir(ctx).deleteRecursively()
        OTAPaths.downloadedDir(ctx)

        // Compute SHA256 of the staged bundle (raw JS, not ZIP) for OTABootstrap verification
        val stagedSha = OTABootstrap.sha256Hex(destBundle)
        Log.i(TAG, "Staged bundle SHA-256: $stagedSha")

        OTAPaths.writeMetadata(
          ctx,
          OTAPaths.OTAMetadata(
            currentVersion = newVersion,
            sha256 = stagedSha,
            previousVersion = previousVersion,
            pendingConfirmation = true,
            pendingTimestamp = System.currentTimeMillis(),
          )
        )

        Log.i(TAG, "Staged v$newVersion (previous=$previousVersion). pendingConfirmation=true.")
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("OTA_STAGE_ERROR", e.message, e)
      }
    }.start()
  }

  // ── confirmUpdate ─────────────────────────────────────────────────────────

  @ReactMethod
  fun confirmUpdate(promise: Promise) {
    try {
      OTABootstrap.confirmUpdate(reactApplicationContext)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("OTA_CONFIRM_ERROR", e.message, e)
    }
  }

  // ── restartApp ────────────────────────────────────────────────────────────

  @ReactMethod
  fun restartApp(promise: Promise) {
    try {
      val ctx = reactApplicationContext
      val intent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
        ?: throw IllegalStateException("Launch intent not found")
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)

      val pendingIntent = PendingIntent.getActivity(
        ctx, 0, intent,
        PendingIntent.FLAG_CANCEL_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      val alarmManager = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarmManager.set(AlarmManager.RTC, System.currentTimeMillis() + 500L, pendingIntent)

      promise.resolve(true)

      Thread {
        Thread.sleep(200)
        Process.killProcess(Process.myPid())
      }.start()
    } catch (e: Exception) {
      promise.reject("OTA_RESTART_ERROR", e.message, e)
    }
  }

  // ── downloadBundle ────────────────────────────────────────────────────────

  @ReactMethod
  fun downloadBundle(urlString: String, promise: Promise) {
    Thread {
      try {
        val ctx = reactApplicationContext
        val destFile = File(ctx.cacheDir, "ota_download.bundle")
        destFile.parentFile?.mkdirs()

        Log.i(TAG, "Downloading OTA bundle from $urlString")
        val url = URL(urlString)
        val conn = url.openConnection() as HttpURLConnection
        conn.connectTimeout = 30_000
        conn.readTimeout = 120_000
        conn.requestMethod = "GET"
        conn.connect()

        val status = conn.responseCode
        if (status != 200) {
          conn.disconnect()
          promise.reject("OTA_DOWNLOAD_ERROR", "HTTP $status from $urlString")
          return@Thread
        }

        val totalBytes = conn.contentLengthLong
        Log.i(TAG, "Content-Length: $totalBytes")

        conn.inputStream.use { input ->
          FileOutputStream(destFile).use { output ->
            val buf = ByteArray(65536)
            var received = 0L
            var n: Int
            while (input.read(buf).also { n = it } != -1) {
              output.write(buf, 0, n)
              received += n
            }
            output.flush()
            Log.i(TAG, "Download complete: $received bytes written to ${destFile.absolutePath}")
          }
        }
        conn.disconnect()

        promise.resolve(destFile.absolutePath)
      } catch (e: Exception) {
        Log.e(TAG, "downloadBundle failed: ${e.message}", e)
        promise.reject("OTA_DOWNLOAD_ERROR", e.message, e)
      }
    }.start()
  }

  // ── rollback ──────────────────────────────────────────────────────────────

  @ReactMethod
  fun rollback(promise: Promise) {
    try {
      val hadPrevious = OTABootstrap.rollback(reactApplicationContext)
      promise.resolve(hadPrevious)
    } catch (e: Exception) {
      promise.reject("OTA_ROLLBACK_ERROR", e.message, e)
    }
  }

  companion object {
    const val NAME = "OTAModule"
    private const val TAG = "OTAModule"
  }
}
