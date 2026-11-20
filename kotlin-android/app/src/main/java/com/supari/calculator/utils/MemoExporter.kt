package com.supari.calculator.utils

import android.content.ClipData
import android.content.ClipboardManager
import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.media.MediaScannerConnection
import android.os.Build
import android.os.Environment
import android.print.PrintAttributes
import android.print.PrintManager
import android.provider.MediaStore
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

object MemoExporter {

    fun copyToClipboard(context: Context, text: String): Boolean {
        return try {
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("সুপারি হিসাব রসিদ", text)
            clipboard.setPrimaryClip(clip)
            true
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Direct 1-click JPG receipt rendering and silent save directly into device Pictures/Gallery
     * without any preview dialogs, share sheets, or file manager prompts.
     */
    suspend fun saveMemoImageDirectly(
        context: Context,
        fileName: String,
        title: String,
        subtitle: String,
        headers: List<String>,
        colWeights: List<Float>,
        rows: List<List<String>>,
        summaryRows: List<Pair<String, String>>,
        grandTotalLabel: String,
        grandTotalValue: String
    ): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        try {
            val bitmap = renderReceiptBitmap(
                title = title,
                subtitle = subtitle,
                headers = headers,
                colWeights = colWeights,
                rows = rows,
                summaryRows = summaryRows,
                grandTotalLabel = grandTotalLabel,
                grandTotalValue = grandTotalValue
            )

            val savedOk = saveBitmapToDevice(context, bitmap, fileName)
            bitmap.recycle()

            if (savedOk) {
                Pair(true, "✅ '$fileName' সরাসরি গ্যালারিতে/মোবাইলে সেভ হয়েছে!")
            } else {
                Pair(false, "⚠️ ছবি সেভ করা যায়নি, স্টোরেজ চেক করুন")
            }
        } catch (e: Exception) {
            Pair(false, "⚠️ মেমো ছবি তৈরিতে সমস্যা হয়েছে")
        }
    }

    private fun renderReceiptBitmap(
        title: String,
        subtitle: String,
        headers: List<String>,
        colWeights: List<Float>,
        rows: List<List<String>>,
        summaryRows: List<Pair<String, String>>,
        grandTotalLabel: String,
        grandTotalValue: String
    ): Bitmap {
        val width = 820
        val padH = 36f
        val contentWidth = width - padH * 2

        val titlePaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#0F172A")
            textSize = 34f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val subtitlePaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#475569")
            textSize = 20f
            typeface = Typeface.DEFAULT
        }
        val headerPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#334155")
            textSize = 20f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val cellPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#0F172A")
            textSize = 19f
            typeface = Typeface.DEFAULT
        }
        val cellBoldPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#047857")
            textSize = 19f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val summaryLabelPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#475569")
            textSize = 21f
            typeface = Typeface.DEFAULT
        }
        val summaryValuePaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#0F172A")
            textSize = 21f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val totalPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#047857")
            textSize = 28f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val footerPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#64748B")
            textSize = 17f
            typeface = Typeface.DEFAULT
        }

        val totalWeight = colWeights.sum().coerceAtLeast(1f)
        val colWidths = colWeights.map { (it / totalWeight) * contentWidth }

        fun makeLayout(text: String, paint: TextPaint, maxW: Int, align: Layout.Alignment = Layout.Alignment.ALIGN_NORMAL): StaticLayout {
            return StaticLayout.Builder.obtain(text, 0, text.length, paint, maxW.coerceAtLeast(20))
                .setAlignment(align)
                .setLineSpacing(4f, 1f)
                .setIncludePad(false)
                .build()
        }

        val titleLayout = makeLayout(title, titlePaint, contentWidth.toInt(), Layout.Alignment.ALIGN_CENTER)
        val subtitleLayout = makeLayout(subtitle, subtitlePaint, contentWidth.toInt(), Layout.Alignment.ALIGN_CENTER)

        val headerLayouts = headers.mapIndexed { idx, h ->
            val align = if (idx == headers.lastIndex) Layout.Alignment.ALIGN_OPPOSITE else if (idx == 0) Layout.Alignment.ALIGN_CENTER else Layout.Alignment.ALIGN_NORMAL
            makeLayout(h, headerPaint, (colWidths[idx] - 12f).toInt(), align)
        }
        val headerHeight = (headerLayouts.maxOfOrNull { it.height } ?: 24) + 24f

        val rowLayouts = rows.map { row ->
            row.mapIndexed { idx, cell ->
                val align = if (idx == row.lastIndex) Layout.Alignment.ALIGN_OPPOSITE else if (idx == 0) Layout.Alignment.ALIGN_CENTER else Layout.Alignment.ALIGN_NORMAL
                val paint = if (idx == row.lastIndex) cellBoldPaint else cellPaint
                makeLayout(cell, paint, (colWidths.getOrElse(idx) { 80f } - 12f).toInt(), align)
            }
        }
        val rowHeights = rowLayouts.map { layouts -> (layouts.maxOfOrNull { it.height } ?: 24) + 22f }

        val summaryHeight = summaryRows.size * 38f + 92f
        val totalHeight = (40f + titleLayout.height + 10f + subtitleLayout.height + 26f +
                headerHeight + rowHeights.sum() + 26f + summaryHeight + 70f).toInt()

        val bitmap = Bitmap.createBitmap(width, totalHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)

        val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#CBD5E1")
            strokeWidth = 2f
        }
        val darkLinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#0F172A")
            strokeWidth = 3f
        }
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG)

        var y = 38f

        // Title
        canvas.save()
        canvas.translate(padH, y)
        titleLayout.draw(canvas)
        canvas.restore()
        y += titleLayout.height + 10f

        // Subtitle
        canvas.save()
        canvas.translate(padH, y)
        subtitleLayout.draw(canvas)
        canvas.restore()
        y += subtitleLayout.height + 18f

        canvas.drawLine(padH, y, width - padH, y, darkLinePaint)
        y += 18f

        // Table Header
        bgPaint.color = Color.parseColor("#F1F5F9")
        canvas.drawRect(padH, y, width - padH, y + headerHeight, bgPaint)
        canvas.drawLine(padH, y, width - padH, y, linePaint)
        canvas.drawLine(padH, y + headerHeight, width - padH, y + headerHeight, linePaint)

        var x = padH
        headerLayouts.forEachIndexed { idx, layout ->
            canvas.save()
            canvas.translate(x + 6f, y + 12f)
            layout.draw(canvas)
            canvas.restore()
            x += colWidths[idx]
        }
        y += headerHeight

        // Table Rows
        rowLayouts.forEachIndexed { rIdx, layouts ->
            val rH = rowHeights[rIdx]
            if (rIdx % 2 == 1) {
                bgPaint.color = Color.parseColor("#F8FAFC")
                canvas.drawRect(padH, y, width - padH, y + rH, bgPaint)
            }
            var cx = padH
            layouts.forEachIndexed { cIdx, layout ->
                canvas.save()
                canvas.translate(cx + 6f, y + 11f)
                layout.draw(canvas)
                canvas.restore()
                cx += colWidths.getOrElse(cIdx) { 80f }
            }
            y += rH
            linePaint.color = Color.parseColor("#E2E8F0")
            linePaint.strokeWidth = 1.5f
            canvas.drawLine(padH, y, width - padH, y, linePaint)
        }

        y += 24f

        // Summary Box
        val boxRect = RectF(padH, y, width - padH, y + summaryHeight)
        bgPaint.color = Color.parseColor("#F8FAFC")
        canvas.drawRoundRect(boxRect, 16f, 16f, bgPaint)
        val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#CBD5E1")
            style = Paint.Style.STROKE
            strokeWidth = 2f
        }
        canvas.drawRoundRect(boxRect, 16f, 16f, borderPaint)

        var sy = y + 20f
        summaryRows.forEach { (label, value) ->
            canvas.drawText(label, padH + 22f, sy + 20f, summaryLabelPaint)
            val valWidth = summaryValuePaint.measureText(value)
            canvas.drawText(value, width - padH - 22f - valWidth, sy + 20f, summaryValuePaint)
            sy += 38f
        }

        sy += 6f
        val dashPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#94A3B8")
            strokeWidth = 2f
            pathEffect = DashPathEffect(floatArrayOf(10f, 8f), 0f)
        }
        canvas.drawLine(padH + 20f, sy, width - padH - 20f, sy, dashPaint)
        sy += 16f

        canvas.drawText(grandTotalLabel, padH + 22f, sy + 26f, totalPaint)
        val grandW = totalPaint.measureText(grandTotalValue)
        canvas.drawText(grandTotalValue, width - padH - 22f - grandW, sy + 26f, totalPaint)

        y += summaryHeight + 24f

        // Footer
        val footerText = "সুপারি হিসাব অ্যাপ • Created by Rahat Sharif"
        val fw = footerPaint.measureText(footerText)
        canvas.drawText(footerText, (width - fw) / 2f, y + 18f, footerPaint)

        return bitmap
    }

    private fun saveBitmapToDevice(context: Context, bitmap: Bitmap, fileName: String): Boolean {
        val cleanName = if (fileName.endsWith(".jpg", ignoreCase = true)) fileName else "$fileName.jpg"
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val resolver = context.contentResolver
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, cleanName)
                put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                put(MediaStore.MediaColumns.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/SupariCalculator")
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
            val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values) ?: return false
            resolver.openOutputStream(uri)?.use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 92, out)
            } ?: return false

            values.clear()
            values.put(MediaStore.Images.Media.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
            true
        } else {
            try {
                val picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                val appDir = File(picturesDir, "SupariCalculator")
                if (!appDir.exists()) appDir.mkdirs()
                val file = File(appDir, cleanName)
                FileOutputStream(file).use { out ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 92, out)
                }
                MediaScannerConnection.scanFile(context, arrayOf(file.absolutePath), arrayOf("image/jpeg"), null)
                true
            } catch (_: Exception) {
                val appDir = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES) ?: context.filesDir
                val file = File(appDir, cleanName)
                FileOutputStream(file).use { out ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 92, out)
                }
                true
            }
        }
    }

    fun printReceiptHtml(context: Context, jobName: String, htmlBody: String) {
        val webView = WebView(context)
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String?) {
                val printManager = context.getSystemService(Context.PRINT_SERVICE) as PrintManager
                val printAdapter = webView.createPrintDocumentAdapter(jobName)
                printManager.print(jobName, printAdapter, PrintAttributes.Builder().build())
            }
        }
        val fullHtml = """
            <!DOCTYPE html>
            <html lang="bn">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: sans-serif; color: #0f172a; margin: 16px; }
                table { width: 100%; border-collapse: collapse; margin: 12px 0; }
                th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; font-size: 13px; }
                th { background: #f1f5f9; text-align: left; }
                .summary { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; }
                .row { display: flex; justify-content: space-between; margin: 4px 0; }
                .total { font-size: 18px; font-weight: bold; color: #047857; border-top: 2px dashed #cbd5e1; padding-top: 8px; margin-top: 8px; }
              </style>
            </head>
            <body>$htmlBody</body>
            </html>
        """.trimIndent()
        webView.loadDataWithBaseURL(null, fullHtml, "text/html", "UTF-8", null)
    }
}
