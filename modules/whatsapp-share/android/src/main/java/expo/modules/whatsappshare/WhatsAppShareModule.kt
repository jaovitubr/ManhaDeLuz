package expo.modules.whatsappshare

import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

// WhatsApp normal primeiro, depois o Business.
private val WHATSAPP_PACKAGES = listOf("com.whatsapp", "com.whatsapp.w4b")

class WhatsAppShareModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WhatsAppShare")

    // Abre o WhatsApp direto na escolha de conversa, já com o arquivo anexado.
    // Retorna false quando nenhum WhatsApp está instalado.
    AsyncFunction("shareFile") { fileUri: String, mimeType: String, text: String? ->
      val activity = appContext.currentActivity ?: throw Exceptions.MissingActivity()
      val path = Uri.parse(fileUri).path ?: throw IllegalArgumentException("Arquivo inválido: $fileUri")

      // Reaproveita o FileProvider que o expo-file-system já registra para a pasta do app.
      val contentUri = FileProvider.getUriForFile(activity, "${activity.packageName}.FileSystemFileProvider", File(path))

      WHATSAPP_PACKAGES.any { packageName ->
        val intent = Intent(Intent.ACTION_SEND).apply {
          type = mimeType
          setPackage(packageName)
          putExtra(Intent.EXTRA_STREAM, contentUri)
          text?.let { putExtra(Intent.EXTRA_TEXT, it) }
          clipData = ClipData.newRawUri(null, contentUri)
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        try {
          activity.startActivity(intent)
          true
        } catch (_: ActivityNotFoundException) {
          false
        }
      }
    }
  }
}
