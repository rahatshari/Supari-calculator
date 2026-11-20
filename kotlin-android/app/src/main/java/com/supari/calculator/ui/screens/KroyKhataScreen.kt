package com.supari.calculator.ui.screens

import android.app.DatePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.supari.calculator.model.KroyEntry
import com.supari.calculator.ui.theme.*
import com.supari.calculator.utils.BengaliUtils
import com.supari.calculator.utils.MemoExporter
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt
import kotlin.math.roundToLong

private const val TI_PER_GHA_KROY = 10

@Composable
fun KroyKhataScreen(
    kroyDb: Map<String, List<KroyEntry>>,
    onKroyDbChange: (Map<String, List<KroyEntry>>) -> Unit,
    activeDate: String,
    onActiveDateChange: (String) -> Unit,
    onOpenConfirmModal: (String, String, () -> Unit) -> Unit,
    onToast: (String) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var currentTab by remember { mutableStateOf("kacha") } // "kacha" | "shukno" | "all"

    // Kacha form state
    var kachaSeller by remember { mutableStateOf("") }
    var kachaRule by remember { mutableIntStateOf(21) }
    var kachaKuri by remember { mutableStateOf("") }
    var kachaGha by remember { mutableStateOf("") }
    var kachaTi by remember { mutableStateOf("") }
    var kachaRate by remember { mutableStateOf("") }
    var kachaEntryMode by remember { mutableStateOf("regular") } // "regular" | "rate-check"
    var kachaTotalPriceInput by remember { mutableStateOf("") }

    // Shukno form state
    var shuknoSeller by remember { mutableStateOf("") }
    var shuknoRule by remember { mutableIntStateOf(82) }
    var shuknoBags by remember { mutableStateOf("") }
    var shuknoKg by remember { mutableStateOf("") }
    var shuknoGm by remember { mutableStateOf("") }
    var shuknoRate by remember { mutableStateOf("") }

    val entries = kroyDb[activeDate] ?: emptyList()
    val indexedEntries = entries.mapIndexed { idx, entry -> idx to entry }
    val kachaEntries = indexedEntries.filter { it.second.type != "shukno" }
    val shuknoEntries = indexedEntries.filter { it.second.type == "shukno" }

    // Kacha totals
    val totalKachaKuri = kachaEntries.sumOf { it.second.kuri }
    val totalKachaSpent = kachaEntries.sumOf { it.second.totalPrice }
    val tiPerKuri = kachaRule * TI_PER_GHA_KROY
    val totalKachaTi = (totalKachaKuri * tiPerKuri).roundToInt()
    val finalKuri = totalKachaTi / tiPerKuri
    val remAfterKuri = totalKachaTi % tiPerKuri
    val finalGha = remAfterKuri / TI_PER_GHA_KROY
    val finalTi = remAfterKuri % TI_PER_GHA_KROY
    val kachaParts = buildList {
        if (finalKuri > 0) add("${BengaliUtils.toBnNum(finalKuri)} কুড়ি")
        if (finalGha > 0) add("${BengaliUtils.toBnNum(finalGha)} ঘা")
        if (finalTi > 0) add("${BengaliUtils.toBnNum(finalTi)} টি")
    }
    val kachaQtyText = when {
        kachaParts.isNotEmpty() -> kachaParts.joinToString(" ")
        totalKachaKuri > 0.0 -> "${BengaliUtils.formatTwoDecimals(totalKachaKuri)} কুড়ি"
        else -> "০ কুড়ি"
    }
    val avgKachaRate = if (totalKachaKuri > 0.0) totalKachaSpent / totalKachaKuri else 0.0

    // Shukno totals
    val totalShuknoWeight = shuknoEntries.sumOf { it.second.weightKg }
    val totalShuknoBags = shuknoEntries.sumOf { it.second.bags }
    val totalShuknoSpent = shuknoEntries.sumOf { it.second.totalPrice }
    val shuknoBreakdown = BengaliUtils.calculateShuknoBreakdown(totalShuknoWeight, shuknoRule, 0.0)
    val grandTotalSpent = totalKachaSpent + totalShuknoSpent

    // Live previews
    val liveKachaTotalTi = BengaliUtils.parseBnDouble(kachaKuri) * tiPerKuri +
        BengaliUtils.parseBnDouble(kachaGha) * TI_PER_GHA_KROY +
        BengaliUtils.parseBnDouble(kachaTi)
    val liveKachaRateNum = BengaliUtils.parseBnDouble(kachaRate)
    val liveKachaTotalPrice = if (liveKachaTotalTi > 0.0 && liveKachaRateNum > 0.0) {
        (liveKachaTotalTi / tiPerKuri.toDouble()) * liveKachaRateNum
    } else 0.0

    val liveKachaTotalPriceInputVal = BengaliUtils.parseBnDouble(kachaTotalPriceInput)
    val liveKachaCheckRatePerKuri = if (liveKachaTotalTi > 0.0 && liveKachaTotalPriceInputVal > 0.0) {
        liveKachaTotalPriceInputVal / (liveKachaTotalTi / tiPerKuri.toDouble())
    } else 0.0
    val liveKachaCheckRatePerGha = if (liveKachaCheckRatePerKuri > 0.0) liveKachaCheckRatePerKuri / kachaRule.toDouble() else 0.0

    val liveShuknoWeight = BengaliUtils.parseBnDouble(shuknoKg) + BengaliUtils.parseBnDouble(shuknoGm) / 1000.0
    val liveShuknoRateNum = BengaliUtils.parseBnDouble(shuknoRate)
    val liveShuknoPrice = if (liveShuknoWeight > 0.0 && liveShuknoRateNum > 0.0) {
        (liveShuknoWeight / shuknoRule.toDouble()) * liveShuknoRateNum
    } else 0.0

    val isToday = activeDate == BengaliUtils.getTodayDateStr()
    val dateBn = BengaliUtils.formatBnDate(activeDate)

    fun showDatePicker() {
        val parts = activeDate.split("-")
        val cal = Calendar.getInstance()
        if (parts.size == 3) {
            runCatching {
                cal.set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt())
            }
        }
        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val formatted = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, dayOfMonth)
                onActiveDateChange(formatted)
            },
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    fun appendEntry(entry: KroyEntry) {
        val nextMap = kroyDb.toMutableMap()
        val list = (nextMap[activeDate] ?: emptyList()) + entry
        nextMap[activeDate] = list
        onKroyDbChange(nextMap)
    }

    fun handleAddDirectKacha() {
        val seller = kachaSeller.trim().ifEmpty { "সাধারণ বিক্রেতা" }
        val kuri = BengaliUtils.parseBnDouble(kachaKuri)
        val gha = BengaliUtils.parseBnDouble(kachaGha)
        val ti = BengaliUtils.parseBnDouble(kachaTi)
        val rate = BengaliUtils.parseBnDouble(kachaRate)
        val totalTi = kuri * tiPerKuri + gha * TI_PER_GHA_KROY + ti
        if (totalTi <= 0.0 || rate <= 0.0) {
            onToast("⚠️ সঠিক পরিমাণ (কুড়ি/ঘা/টি) ও প্রতি কুড়ির দর দিন")
            return
        }
        val calcKuri = totalTi / tiPerKuri.toDouble()
        val totalPrice = ((calcKuri * rate) * 100.0).roundToLong() / 100.0
        val qtyInfo = BengaliUtils.formatKachaItemQty(kuri, gha, ti, kachaRule, TI_PER_GHA_KROY)

        appendEntry(
            KroyEntry(
                id = System.currentTimeMillis(),
                time = BengaliUtils.formatBnTime(Date()),
                seller = seller,
                type = "kacha",
                qtyText = qtyInfo.displayString,
                kuri = calcKuri,
                rule = kachaRule,
                ruleText = "${BengaliUtils.toBnNum(kachaRule)} ঘা = ১ কুড়ি",
                rate = rate,
                rateText = "দর: ৳ ${BengaliUtils.toBnNum(rate)} / কুড়ি (${BengaliUtils.toBnNum(kachaRule)} ঘা)",
                totalPrice = totalPrice
            )
        )
        kachaSeller = ""
        kachaKuri = ""
        kachaGha = ""
        kachaTi = ""
        kachaRate = ""
        onToast("✅ কাঁচা-পাকা ক্রয় খাতায় সফলভাবে যোগ হয়েছে")
    }

    fun handleAddRateCheckedKacha() {
        val seller = kachaSeller.trim().ifEmpty { "সাধারণ বিক্রেতা" }
        val kuri = BengaliUtils.parseBnDouble(kachaKuri)
        val gha = BengaliUtils.parseBnDouble(kachaGha)
        val ti = BengaliUtils.parseBnDouble(kachaTi)
        val totalPrice = BengaliUtils.parseBnDouble(kachaTotalPriceInput)
        val totalTi = kuri * tiPerKuri + gha * TI_PER_GHA_KROY + ti
        if (totalTi <= 0.0 || totalPrice <= 0.0) {
            onToast("⚠️ সঠিক পরিমাণ ও মোট টাকা লিখুন")
            return
        }
        val calcKuri = totalTi / tiPerKuri.toDouble()
        val calcRate = (totalPrice / calcKuri).roundToInt().toDouble()
        val qtyInfo = BengaliUtils.formatKachaItemQty(kuri, gha, ti, kachaRule, TI_PER_GHA_KROY)

        appendEntry(
            KroyEntry(
                id = System.currentTimeMillis(),
                time = BengaliUtils.formatBnTime(Date()),
                seller = seller,
                type = "kacha",
                qtyText = qtyInfo.displayString,
                kuri = calcKuri,
                rule = kachaRule,
                ruleText = "${BengaliUtils.toBnNum(kachaRule)} ঘা = ১ কুড়ি",
                rate = calcRate,
                rateText = "যাচাইকৃত দর: ৳ ${BengaliUtils.toBnNum(calcRate)} / কুড়ি (${BengaliUtils.toBnNum(kachaRule)} ঘা)",
                totalPrice = totalPrice
            )
        )
        kachaSeller = ""
        kachaKuri = ""
        kachaGha = ""
        kachaTi = ""
        kachaTotalPriceInput = ""
        onToast("✅ দর যাচাইকৃত কাঁচা-পাকা চালান সফলভাবে ক্রয় খাতায় যোগ হয়েছে")
    }

    fun handleAddDirectShukno() {
        val seller = shuknoSeller.trim().ifEmpty { "সাধারণ বিক্রেতা" }
        val bagsCount = BengaliUtils.parseBnDouble(shuknoBags).toInt().coerceAtLeast(1)
        val weight = BengaliUtils.parseBnDouble(shuknoKg) + BengaliUtils.parseBnDouble(shuknoGm) / 1000.0
        val rate = BengaliUtils.parseBnDouble(shuknoRate)
        if (weight <= 0.0) {
            onToast("⚠️ সুপারির সঠিক ওজন (কেজি ও গ্রাম) লিখুন")
            return
        }
        if (rate <= 0.0) {
            onToast("⚠️ প্রতি হাজারের দর লিখুন")
            return
        }
        val breakdown = BengaliUtils.calculateShuknoBreakdown(weight, shuknoRule, rate)
        appendEntry(
            KroyEntry(
                id = System.currentTimeMillis(),
                time = BengaliUtils.formatBnTime(Date()),
                seller = seller,
                type = "shukno",
                qtyText = "${BengaliUtils.toBnNum(bagsCount)} বস্তা (${BengaliUtils.formatWeightKgGm(weight)})",
                bags = bagsCount,
                weightKg = weight,
                rule = shuknoRule,
                ruleText = "${BengaliUtils.toBnNum(shuknoRule)} কেজি = ১ হাজার",
                hajarShotokText = breakdown.textFormat,
                rate = rate,
                rateText = "১ হাজার = ৳ ${BengaliUtils.toBnNum(rate)} (${BengaliUtils.toBnNum(shuknoRule)} কেজি)",
                totalPrice = breakdown.totalPrice
            )
        )
        shuknoSeller = ""
        shuknoBags = ""
        shuknoKg = ""
        shuknoGm = ""
        shuknoRate = ""
        onToast("✅ শুকনো সুপারি ক্রয় এন্ট্রি সফলভাবে যোগ হয়েছে")
    }

    fun handleEditEntry(originalIdx: Int) {
        val entry = entries.getOrNull(originalIdx) ?: return
        if (entry.type == "shukno") {
            currentTab = "shukno"
            shuknoSeller = if (entry.seller == "সাধারণ বিক্রেতা") "" else entry.seller
            shuknoBags = BengaliUtils.toBnNum(entry.bags)
            shuknoRule = entry.rule
            val totGm = (entry.weightKg * 1000.0).roundToLong()
            val kg = totGm / 1000L
            val gm = totGm % 1000L
            shuknoKg = if (kg > 0L) BengaliUtils.toBnNum(kg) else ""
            shuknoGm = if (gm > 0L) BengaliUtils.toBnNum(gm) else ""
            shuknoRate = if (entry.rate > 0.0) BengaliUtils.toBnNum(entry.rate) else ""
        } else {
            currentTab = "kacha"
            kachaSeller = if (entry.seller == "সাধারণ বিক্রেতা") "" else entry.seller
            kachaRule = entry.rule
            val eTiPerKuri = entry.rule * TI_PER_GHA_KROY
            val totTi = (entry.kuri * eTiPerKuri).roundToInt()
            val eKuri = totTi / eTiPerKuri
            val eRem = totTi % eTiPerKuri
            val eGha = eRem / TI_PER_GHA_KROY
            val eTi = eRem % TI_PER_GHA_KROY
            kachaKuri = if (eKuri > 0) BengaliUtils.toBnNum(eKuri) else ""
            kachaGha = if (eGha > 0) BengaliUtils.toBnNum(eGha) else ""
            kachaTi = if (eTi > 0) BengaliUtils.toBnNum(eTi) else ""
            kachaRate = if (entry.rate > 0.0) BengaliUtils.toBnNum(entry.rate) else ""
        }

        val nextMap = kroyDb.toMutableMap()
        val updated = entries.filterIndexed { i, _ -> i != originalIdx }
        if (updated.isEmpty()) nextMap.remove(activeDate) else nextMap[activeDate] = updated
        onKroyDbChange(nextMap)
        scope.launch { scrollState.animateScrollTo(0) }
        onToast("✏️ পরিবর্তনের জন্য ইনপুট বক্সে নেওয়া হয়েছে")
    }

    fun handleDeleteEntry(originalIdx: Int) {
        onOpenConfirmModal("ক্রয় হিসাব মুছুন", "আপনি কি নিশ্চিত যে এই চালানটি ক্রয় খাতা থেকে মুছতে চান?") {
            val nextMap = kroyDb.toMutableMap()
            val updated = entries.filterIndexed { i, _ -> i != originalIdx }
            if (updated.isEmpty()) nextMap.remove(activeDate) else nextMap[activeDate] = updated
            onKroyDbChange(nextMap)
            onToast("🗑️ ক্রয় হিসাব মুছে ফেলা হয়েছে")
        }
    }

    fun handleResetKroy() {
        if (entries.isEmpty()) {
            onToast("ℹ️ এই দিনের খাতা ইতিমধ্যে ফাঁকা")
            return
        }
        val msg = when (currentTab) {
            "kacha" -> "$dateBn-এর কাঁচা-পাকা সুপারি ক্রয় হিসাব মুছে ফেলতে চান?"
            "shukno" -> "$dateBn-এর শুকনো সুপারি ক্রয় হিসাব মুছে ফেলতে চান?"
            else -> "$dateBn-এর সমস্ত (কাঁচা ও শুকনো) ক্রয় হিসাব মুছে ফেলতে চান?"
        }
        onOpenConfirmModal("খাতা খালি করুন", msg) {
            val nextMap = kroyDb.toMutableMap()
            val remaining = when (currentTab) {
                "kacha" -> entries.filter { it.type == "shukno" }
                "shukno" -> entries.filter { it.type != "shukno" }
                else -> emptyList()
            }
            if (remaining.isEmpty()) nextMap.remove(activeDate) else nextMap[activeDate] = remaining
            onKroyDbChange(nextMap)
            onToast("🗑️ ক্রয় খাতা মুছে ফেলা হয়েছে")
        }
    }

    fun handleCopyReport() {
        if (entries.isEmpty()) return
        val sb = StringBuilder()
        when (currentTab) {
            "kacha" -> {
                sb.append("--- দৈনিক কাঁচা-পাকা সুপারি ক্রয় খাতা ---\n")
                sb.append("তারিখ: $dateBn (নিয়ম: ${BengaliUtils.toBnNum(kachaRule)} ঘা = ১ কুড়ি)\n")
                sb.append("মোট চালান: ${BengaliUtils.toBnNum(kachaEntries.size)} জন\n\n")
                kachaEntries.forEachIndexed { idx, (_, e) ->
                    sb.append("${BengaliUtils.toBnNum(idx + 1)}. [${e.time}] ${e.seller} - ${e.qtyText} | দর: ৳ ${BengaliUtils.toBnNum(e.rate.roundToInt())} | মোট: ৳ ${BengaliUtils.formatTwoDecimals(e.totalPrice)}\n")
                }
                sb.append("\nমোট কেনা সুপারি: $kachaQtyText\n")
                sb.append("মোট খরচ: ৳ ${BengaliUtils.formatTwoDecimals(totalKachaSpent)}\n")
            }
            "shukno" -> {
                sb.append("--- দৈনিক শুকনো সুপারি ক্রয় খাতা ---\n")
                sb.append("তারিখ: $dateBn (নিয়ম: ${BengaliUtils.toBnNum(shuknoRule)} কেজি = ১ হাজার)\n")
                sb.append("মোট চালান: ${BengaliUtils.toBnNum(shuknoEntries.size)} জন\n\n")
                shuknoEntries.forEachIndexed { idx, (_, e) ->
                    sb.append("${BengaliUtils.toBnNum(idx + 1)}. [${e.time}] ${e.seller} - ${e.qtyText} | ভাঙানো: ${e.hajarShotokText} | মোট: ৳ ${BengaliUtils.formatTwoDecimals(e.totalPrice)}\n")
                }
                sb.append("\nমোট শুকনো ওজন: ${BengaliUtils.formatWeightKgGm(totalShuknoWeight)}\n")
                sb.append("মোট খরচ: ৳ ${BengaliUtils.formatTwoDecimals(totalShuknoSpent)}\n")
            }
            else -> {
                sb.append("--- দৈনিক সমন্বিত সুপারি ক্রয় খাতা ---\n")
                sb.append("তারিখ: $dateBn | মোট চালান: ${BengaliUtils.toBnNum(entries.size)} জন\n\n")
                if (kachaEntries.isNotEmpty()) {
                    sb.append("[কাঁচা-পাকা সুপারি]\n")
                    kachaEntries.forEachIndexed { idx, (_, e) ->
                        sb.append("${BengaliUtils.toBnNum(idx + 1)}. ${e.seller} - ${e.qtyText} | ৳ ${BengaliUtils.formatTwoDecimals(e.totalPrice)}\n")
                    }
                    sb.append("উপমোট: ৳ ${BengaliUtils.formatTwoDecimals(totalKachaSpent)}\n\n")
                }
                if (shuknoEntries.isNotEmpty()) {
                    sb.append("[শুকনো সুপারি]\n")
                    shuknoEntries.forEachIndexed { idx, (_, e) ->
                        sb.append("${BengaliUtils.toBnNum(idx + 1)}. ${e.seller} - ${e.qtyText} | ৳ ${BengaliUtils.formatTwoDecimals(e.totalPrice)}\n")
                    }
                    sb.append("উপমোট: ৳ ${BengaliUtils.formatTwoDecimals(totalShuknoSpent)}\n\n")
                }
                sb.append("সর্বমোট খরচ: ৳ ${BengaliUtils.formatTwoDecimals(grandTotalSpent)}\n")
            }
        }
        sb.append("\nCreated by Rahat Sharif\n")
        if (MemoExporter.copyToClipboard(context, sb.toString())) {
            onToast("📋 ক্রয় খাতা রিপোর্ট কপি হয়েছে!")
        }
    }

    fun handleDownloadJpg() {
        if (entries.isEmpty()) {
            onToast("⚠️ সেভ করার জন্য এই তারিখে কোনো ক্রয় হিসাব নেই")
            return
        }
        onToast("⏳ মেমো ছবি তৈরি ও সেভ হচ্ছে...")
        scope.launch {
            val res = when (currentTab) {
                "kacha" -> {
                    val rows = kachaEntries.mapIndexed { idx, (_, e) ->
                        listOf(
                            BengaliUtils.toBnNum(idx + 1),
                            "${e.seller}\n(${e.time})",
                            e.qtyText,
                            "৳ ${BengaliUtils.toBnNum(e.rate.roundToInt())}\n(${BengaliUtils.toBnNum(e.rule)} ঘা)",
                            "৳ ${BengaliUtils.formatTwoDecimals(e.totalPrice)}"
                        )
                    }
                    MemoExporter.saveMemoImageDirectly(
                        context = context,
                        fileName = "Kacha_Kroy_Khata_${activeDate}_${System.currentTimeMillis()}.jpg",
                        title = "দৈনিক কাঁচা-পাকা সুপারি ক্রয় খাতা",
                        subtitle = "তারিখ: $dateBn | ${BengaliUtils.toBnNum(kachaRule)} ঘা = ১ কুড়ি",
                        headers = listOf("নং", "বিক্রেতা", "পরিমাণ", "দর", "খরচ (৳)"),
                        colWeights = listOf(0.6f, 1.5f, 1.8f, 1.1f, 1.2f),
                        rows = rows,
                        summaryRows = listOf(
                            "মোট চালান:" to "${BengaliUtils.toBnNum(kachaEntries.size)} জন",
                            "মোট কেনা সুপারি:" to kachaQtyText,
                            "গড় দর (প্রতি কুড়ি):" to "৳ ${BengaliUtils.formatTwoDecimals(avgKachaRate)}"
                        ),
                        grandTotalLabel = "সর্বমোট কাঁচা-পাকা খরচ:",
                        grandTotalValue = "৳ ${BengaliUtils.formatTwoDecimals(totalKachaSpent)}"
                    )
                }
                "shukno" -> {
                    val rows = shuknoEntries.mapIndexed { idx, (_, e) ->
                        listOf(
                            BengaliUtils.toBnNum(idx + 1),
                            "${e.seller}\n(${e.time})",
                            "${e.qtyText}\n${e.hajarShotokText}",
                            "৳ ${BengaliUtils.toBnNum(e.rate.roundToInt())}",
                            "৳ ${BengaliUtils.formatTwoDecimals(e.totalPrice)}"
                        )
                    }
                    MemoExporter.saveMemoImageDirectly(
                        context = context,
                        fileName = "Shukno_Kroy_Khata_${activeDate}_${System.currentTimeMillis()}.jpg",
                        title = "দৈনিক শুকনো সুপারি ক্রয় খাতা",
                        subtitle = "তারিখ: $dateBn | ${BengaliUtils.toBnNum(shuknoRule)} কেজি = ১ হাজার",
                        headers = listOf("নং", "বিক্রেতা", "বস্তা ও পরিমাণ", "দর", "খরচ (৳)"),
                        colWeights = listOf(0.6f, 1.5f, 1.9f, 1.0f, 1.2f),
                        rows = rows,
                        summaryRows = listOf(
                            "মোট চালান:" to "${BengaliUtils.toBnNum(shuknoEntries.size)} জন",
                            "মোট বস্তা:" to "${BengaliUtils.toBnNum(totalShuknoBags)} টি",
                            "সর্বমোট ওজন:" to BengaliUtils.formatWeightKgGm(totalShuknoWeight)
                        ),
                        grandTotalLabel = "সর্বমোট শুকনো খরচ:",
                        grandTotalValue = "৳ ${BengaliUtils.formatTwoDecimals(totalShuknoSpent)}"
                    )
                }
                else -> {
                    val rows = entries.mapIndexed { idx, e ->
                        listOf(
                            BengaliUtils.toBnNum(idx + 1),
                            "${e.seller}\n(${if (e.type == "shukno") "শুকনো" else "কাঁচা-পাকা"})",
                            e.qtyText,
                            "৳ ${BengaliUtils.formatTwoDecimals(e.totalPrice)}"
                        )
                    }
                    MemoExporter.saveMemoImageDirectly(
                        context = context,
                        fileName = "Supari_Kroy_Khata_${activeDate}_${System.currentTimeMillis()}.jpg",
                        title = "দৈনিক সমন্বিত সুপারি ক্রয় খাতা",
                        subtitle = "তারিখ: $dateBn | আড়ত / পাইকারি হিসাব",
                        headers = listOf("নং", "বিক্রেতা ও ধরন", "পরিমাণ", "খরচ (৳)"),
                        colWeights = listOf(0.7f, 1.8f, 2.0f, 1.3f),
                        rows = rows,
                        summaryRows = listOf(
                            "মোট চালান:" to "${BengaliUtils.toBnNum(entries.size)} জন",
                            "কাঁচা-পাকা খরচ:" to "৳ ${BengaliUtils.formatTwoDecimals(totalKachaSpent)}",
                            "শুকনো খরচ:" to "৳ ${BengaliUtils.formatTwoDecimals(totalShuknoSpent)}"
                        ),
                        grandTotalLabel = "সর্বমোট খরচ:",
                        grandTotalValue = "৳ ${BengaliUtils.formatTwoDecimals(grandTotalSpent)}"
                    )
                }
            }
            onToast(res.second)
        }
    }

    fun handlePrint() {
        if (entries.isEmpty()) {
            onToast("প্রিন্ট করার মতো কোনো ক্রয় হিসাব নেই!")
            return
        }
        val rowsHtml = entries.mapIndexed { idx, e ->
            val typeTag = if (e.type == "shukno") "শুকনো" else "কাঁচা-পাকা"
            """
            <tr>
              <td style="text-align:center;">${BengaliUtils.toBnNum(idx + 1)}</td>
              <td><strong>${e.seller}</strong><br><small>$typeTag • ${e.time}</small></td>
              <td>${e.qtyText}</td>
              <td style="text-align:right;font-weight:bold;color:#047857;">৳ ${BengaliUtils.formatTwoDecimals(e.totalPrice)}</td>
            </tr>
            """.trimIndent()
        }.joinToString("")

        val body = """
            <h2 style="text-align:center;margin-bottom:4px;">দৈনিক সুপারি ক্রয় খাতা</h2>
            <p style="text-align:center;color:#475569;margin-top:0;">তারিখ: $dateBn</p>
            <table>
              <thead><tr><th>নং</th><th>বিক্রেতা</th><th>পরিমাণ</th><th style="text-align:right;">খরচ (৳)</th></tr></thead>
              <tbody>$rowsHtml</tbody>
            </table>
            <div class="summary">
              <div class="row"><span>মোট চালান:</span><strong>${BengaliUtils.toBnNum(entries.size)} জন</strong></div>
              <div class="row"><span>কাঁচা-পাকা মোট:</span><strong>৳ ${BengaliUtils.formatTwoDecimals(totalKachaSpent)}</strong></div>
              <div class="row"><span>শুকনো মোট:</span><strong>৳ ${BengaliUtils.formatTwoDecimals(totalShuknoSpent)}</strong></div>
              <div class="row total"><span>সর্বমোট খরচ:</span><span>৳ ${BengaliUtils.formatTwoDecimals(grandTotalSpent)}</span></div>
            </div>
            <p style="text-align:center;color:#64748b;font-size:12px;">সুপারি হিসাব অ্যাপ • Created by Rahat Sharif</p>
        """.trimIndent()

        onToast("🖨️ প্রিন্ট প্রক্রিয়া শুরু হচ্ছে...")
        MemoExporter.printReceiptHtml(context, "সুপারি ক্রয় খাতা", body)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundGray)
            .verticalScroll(scrollState)
            .padding(14.dp)
    ) {
        // Date Header Bar
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = Color.White,
            border = BorderStroke(1.dp, BorderLight)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("খাতার তারিখ", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                    Text(
                        text = if (isToday) "আজকের খাতা ($dateBn)" else dateBn,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = EmeraldDark
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedButton(
                        onClick = { showDatePicker() },
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.CalendarToday, contentDescription = "তারিখ পরিবর্তন", tint = EmeraldPrimary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("তারিখ", fontSize = 12.sp, color = TextDark, fontWeight = FontWeight.Bold)
                    }
                    if (!isToday) {
                        Button(
                            onClick = { onActiveDateChange(BengaliUtils.getTodayDateStr()) },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text("আজকে", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // 3 Segmented Tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(BorderLight)
                .padding(4.dp)
        ) {
            SubTabItem("কাঁচা-পাকা", currentTab == "kacha", Modifier.weight(1f)) { currentTab = "kacha" }
            SubTabItem("শুকনো", currentTab == "shukno", Modifier.weight(1f)) { currentTab = "shukno" }
            SubTabItem("সর্বমোট", currentTab == "all", Modifier.weight(1f)) { currentTab = "all" }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Dashboard Cards
        when (currentTab) {
            "kacha" -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    DashboardStatCard(
                        title = "মোট কাঁচা-পাকা",
                        mainValue = kachaQtyText,
                        subValue = "দশমিক: ${BengaliUtils.formatTwoDecimals(totalKachaKuri)} কুড়ি",
                        bgColor = EmeraldLight,
                        borderColor = EmeraldBorder,
                        accentColor = EmeraldDark,
                        modifier = Modifier.weight(1f)
                    )
                    DashboardStatCard(
                        title = "কাঁচা-পাকা খরচ",
                        mainValue = "৳ ${BengaliUtils.formatIntegerCurrency(totalKachaSpent)}",
                        subValue = "চালান: ${BengaliUtils.toBnNum(kachaEntries.size)} জন | গড়: ৳${BengaliUtils.formatIntegerCurrency(avgKachaRate)}",
                        bgColor = BlueLight,
                        borderColor = Color(0xFFBFDBFE),
                        accentColor = BlueAccent,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            "shukno" -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    DashboardStatCard(
                        title = "মোট শুকনো সুপারি",
                        mainValue = BengaliUtils.formatWeightKgGm(totalShuknoWeight),
                        subValue = shuknoBreakdown.textFormat,
                        bgColor = WarningLight,
                        borderColor = Color(0xFFFCD34D),
                        accentColor = Color(0xFF92400E),
                        modifier = Modifier.weight(1f)
                    )
                    DashboardStatCard(
                        title = "শুকনো বাবদ খরচ",
                        mainValue = "৳ ${BengaliUtils.formatIntegerCurrency(totalShuknoSpent)}",
                        subValue = "চালান: ${BengaliUtils.toBnNum(shuknoEntries.size)} জন | বস্তা: ${BengaliUtils.toBnNum(totalShuknoBags)} টি",
                        bgColor = DangerLight,
                        borderColor = Color(0xFFFECACA),
                        accentColor = DangerRed,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            else -> {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        DashboardStatCard(
                            title = "কাঁচা-পাকা",
                            mainValue = kachaQtyText,
                            subValue = "খরচ: ৳ ${BengaliUtils.formatIntegerCurrency(totalKachaSpent)}",
                            bgColor = EmeraldLight,
                            borderColor = EmeraldBorder,
                            accentColor = EmeraldDark,
                            modifier = Modifier.weight(1f)
                        )
                        DashboardStatCard(
                            title = "শুকনো সুপারি",
                            mainValue = BengaliUtils.formatWeightKgGm(totalShuknoWeight),
                            subValue = "খরচ: ৳ ${BengaliUtils.formatIntegerCurrency(totalShuknoSpent)}",
                            bgColor = WarningLight,
                            borderColor = Color(0xFFFCD34D),
                            accentColor = Color(0xFF92400E),
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = BlueLight,
                        border = BorderStroke(1.5.dp, Color(0xFF93C5FD))
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("দিনশেষে সর্বমোট খরচ", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E40AF))
                                Text("মোট চালান: ${BengaliUtils.toBnNum(entries.size)} জন", fontSize = 11.5.sp, color = BlueAccent)
                            }
                            Text(
                                "৳ ${BengaliUtils.formatIntegerCurrency(grandTotalSpent)}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Black,
                                color = BlueAccent
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Direct Entry Form for Kacha
        if (currentTab == "kacha" || currentTab == "all") {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = Color.White,
                border = BorderStroke(1.dp, BorderLight)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("🍃 কাঁচা-পাকা সুপারি সরাসরি ক্রয় এন্ট্রি", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = TextDark)

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("regular" to "সাধারণ এন্ট্রি (দর দিয়ে)", "rate-check" to "দর যাচাই (মোট টাকায়)").forEach { (mode, label) ->
                            val isSel = kachaEntryMode == mode
                            Surface(
                                modifier = Modifier.weight(1f).clickable { kachaEntryMode = mode },
                                shape = RoundedCornerShape(9.dp),
                                color = if (isSel) EmeraldLight else Color.White,
                                border = BorderStroke(1.5.dp, if (isSel) EmeraldPrimary else BorderLight)
                            ) {
                                Text(
                                    text = label,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSel) EmeraldDark else TextMuted,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp)
                                )
                            }
                        }
                    }

                    OutlinedTextField(
                        value = kachaSeller,
                        onValueChange = { kachaSeller = it },
                        label = { Text("বিক্রেতার নাম (ঐচ্ছিক)") },
                        placeholder = { Text("যেমন: করিম মিয়া") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    RuleSelectorBar(
                        label = "হিসাবের নিয়ম:",
                        options = listOf(21 to "২১ ঘা = ১ কুড়ি", 20 to "২০ ঘা = ১ কুড়ি"),
                        selected = kachaRule,
                        onSelect = { kachaRule = it }
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        BnNumberInputBox("কুড়ি", kachaKuri, { kachaKuri = BengaliUtils.cleanBnInput(it) }, Modifier.weight(1f))
                        BnNumberInputBox("ঘা", kachaGha, { kachaGha = BengaliUtils.cleanBnInput(it) }, Modifier.weight(1f))
                        BnNumberInputBox("টি (পিস)", kachaTi, { kachaTi = BengaliUtils.cleanBnInput(it) }, Modifier.weight(1f))
                    }

                    if (kachaEntryMode == "regular") {
                        OutlinedTextField(
                            value = kachaRate,
                            onValueChange = { kachaRate = BengaliUtils.cleanBnInput(it) },
                            label = { Text("প্রতি কুড়ির দর (৳)") },
                            placeholder = { Text("০") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        )
                        if (liveKachaTotalPrice > 0.0) {
                            Surface(shape = RoundedCornerShape(8.dp), color = EmeraldLight, border = BorderStroke(1.dp, EmeraldBorder)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("হিসাবকৃত মোট খরচ:", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = EmeraldDark)
                                    Text("৳ ${BengaliUtils.formatTwoDecimals(liveKachaTotalPrice)}", fontSize = 15.sp, fontWeight = FontWeight.Black, color = EmeraldDark)
                                }
                            }
                        }
                        Button(
                            onClick = { handleAddDirectKacha() },
                            modifier = Modifier.fillMaxWidth().height(46.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("কাঁচা-পাকা ক্রয় খাতায় জমা করুন", fontWeight = FontWeight.Bold)
                        }
                    } else {
                        OutlinedTextField(
                            value = kachaTotalPriceInput,
                            onValueChange = { kachaTotalPriceInput = BengaliUtils.cleanBnInput(it) },
                            label = { Text("উক্ত পরিমাণের মোট দাম (৳)") },
                            placeholder = { Text("০") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        )
                        if (liveKachaCheckRatePerKuri > 0.0) {
                            Surface(shape = RoundedCornerShape(8.dp), color = EmeraldLight, border = BorderStroke(1.dp, EmeraldBorder)) {
                                Column(modifier = Modifier.fillMaxWidth().padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    SummaryLine("যাচাইকৃত ১ কুড়ির দর:", "৳ ${BengaliUtils.toBnNum(liveKachaCheckRatePerKuri.roundToInt())} / কুড়ি", valueColor = DangerRed)
                                    SummaryLine("প্রতি ঘার দর:", "৳ ${BengaliUtils.formatTwoDecimals(liveKachaCheckRatePerGha)}", valueColor = EmeraldDark)
                                }
                            }
                        }
                        Button(
                            onClick = { handleAddRateCheckedKacha() },
                            modifier = Modifier.fillMaxWidth().height(46.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldDark),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("দর যাচাই করে ক্রয় খাতায় জমা করুন", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
        }

        // Direct Entry Form for Shukno
        if (currentTab == "shukno") {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = Color.White,
                border = BorderStroke(1.dp, BorderLight)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("🪵 শুকনো সুপারি সরাসরি ক্রয় এন্ট্রি", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = TextDark)
                    OutlinedTextField(
                        value = shuknoSeller,
                        onValueChange = { shuknoSeller = it },
                        label = { Text("বিক্রেতার নাম (ঐচ্ছিক)") },
                        placeholder = { Text("যেমন: খলিল ব্যাপারী") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                    RuleSelectorBar(
                        label = "হিসাবের নিয়ম:",
                        options = listOf(82 to "৮২ কেজি = ১ হাজার", 80 to "৮০ কেজি = ১ হাজার"),
                        selected = shuknoRule,
                        onSelect = { shuknoRule = it }
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        BnNumberInputBox("বস্তা", shuknoBags, { shuknoBags = BengaliUtils.cleanBnInput(it) }, Modifier.weight(1f), placeholder = "১")
                        BnNumberInputBox("কেজি", shuknoKg, { shuknoKg = BengaliUtils.cleanBnInput(it) }, Modifier.weight(1f))
                        BnNumberInputBox("গ্রাম", shuknoGm, { shuknoGm = BengaliUtils.cleanBnInput(it) }, Modifier.weight(1f))
                    }
                    OutlinedTextField(
                        value = shuknoRate,
                        onValueChange = { shuknoRate = BengaliUtils.cleanBnInput(it) },
                        label = { Text("প্রতি হাজারের দর (৳)") },
                        placeholder = { Text("০") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                    if (liveShuknoPrice > 0.0) {
                        Surface(shape = RoundedCornerShape(8.dp), color = WarningLight, border = BorderStroke(1.dp, Color(0xFFFCD34D))) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("হিসাবকৃত মোট খরচ:", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = Color(0xFF78350F))
                                Text("৳ ${BengaliUtils.formatIntegerCurrency(liveShuknoPrice)}", fontSize = 15.sp, fontWeight = FontWeight.Black, color = WarningAmber)
                            }
                        }
                    }
                    Button(
                        onClick = { handleAddDirectShukno() },
                        modifier = Modifier.fillMaxWidth().height(46.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = WarningAmber),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("শুকনো সুপারি ক্রয় খাতায় জমা করুন", fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
        }

        // Ledger Table Card
        val visibleEntries = when (currentTab) {
            "kacha" -> kachaEntries
            "shukno" -> shuknoEntries
            else -> indexedEntries
        }

        Surface(
            shape = RoundedCornerShape(16.dp),
            color = Color.White,
            border = BorderStroke(1.5.dp, BorderLight),
            shadowElevation = 2.dp
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = when (currentTab) {
                        "kacha" -> "দৈনিক কাঁচা-পাকা সুপারি ক্রয় খাতা"
                        "shukno" -> "দৈনিক শুকনো সুপারি ক্রয় খাতা"
                        else -> "দৈনিক সমন্বিত সুপারি ক্রয় খাতা"
                    },
                    fontSize = 15.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = TextDark,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    text = "তারিখ: $dateBn",
                    fontSize = 11.5.sp,
                    color = TextMuted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(top = 2.dp, bottom = 10.dp)
                )

                if (visibleEntries.isEmpty()) {
                    Text(
                        text = "📭 এই তারিখে কোনো ক্রয় এন্ট্রি নেই।",
                        fontSize = 13.sp,
                        color = TextMuted,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(vertical = 22.dp)
                    )
                } else {
                    visibleEntries.forEachIndexed { listIdx, (originalIdx, entry) ->
                        val isShukno = entry.type == "shukno"
                        Surface(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp),
                            color = BackgroundGray,
                            border = BorderStroke(1.dp, BorderLight)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            "${BengaliUtils.toBnNum(listIdx + 1)}. ${entry.seller}",
                                            fontSize = 13.5.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = TextDark
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            if (isShukno) "🪵 শুকনো" else "🍃 কাঁচা",
                                            fontSize = 10.5.sp,
                                            color = if (isShukno) WarningAmber else EmeraldDark,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Text(
                                        "${entry.qtyText} • ${entry.time}",
                                        fontSize = 11.5.sp,
                                        color = TextMuted
                                    )
                                    if (isShukno && entry.hajarShotokText.isNotEmpty()) {
                                        Text(entry.hajarShotokText, fontSize = 11.sp, color = Color(0xFF92400E))
                                    } else {
                                        Text(entry.rateText, fontSize = 11.sp, color = EmeraldDark)
                                    }
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        "৳ ${BengaliUtils.formatTwoDecimals(entry.totalPrice)}",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Black,
                                        color = if (isShukno) Color(0xFFB45309) else EmeraldDark
                                    )
                                    Row {
                                        IconButton(onClick = { handleEditEntry(originalIdx) }, modifier = Modifier.size(28.dp)) {
                                            Icon(Icons.Default.Edit, contentDescription = "এডিট", tint = BlueAccent, modifier = Modifier.size(16.dp))
                                        }
                                        IconButton(onClick = { handleDeleteEntry(originalIdx) }, modifier = Modifier.size(28.dp)) {
                                            Icon(Icons.Default.Delete, contentDescription = "মুছুন", tint = DangerRed, modifier = Modifier.size(16.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (entries.isNotEmpty()) {
            Spacer(modifier = Modifier.height(14.dp))
            ExportActionsGrid(
                onCopy = { handleCopyReport() },
                onJpgSave = { handleDownloadJpg() },
                onPrint = { handlePrint() },
                onClearAll = { handleResetKroy() }
            )
        }
        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun DashboardStatCard(
    title: String,
    mainValue: String,
    subValue: String,
    bgColor: Color,
    borderColor: Color,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        color = bgColor,
        border = BorderStroke(1.5.dp, borderColor)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(title, fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = accentColor)
            Spacer(modifier = Modifier.height(4.dp))
            Text(mainValue, fontSize = 15.5.sp, fontWeight = FontWeight.Black, color = accentColor)
            Spacer(modifier = Modifier.height(2.dp))
            Text(subValue, fontSize = 10.5.sp, color = accentColor.copy(alpha = 0.85f), lineHeight = 14.sp)
        }
    }
}
