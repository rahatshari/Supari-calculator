package com.supari.calculator.ui.screens

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
import com.supari.calculator.model.KachaItem
import com.supari.calculator.model.KachaRateCheckResult
import com.supari.calculator.model.PendingKroyItem
import com.supari.calculator.ui.theme.*
import com.supari.calculator.utils.BengaliUtils
import com.supari.calculator.utils.MemoExporter
import kotlinx.coroutines.launch
import kotlin.math.roundToInt
import kotlin.math.roundToLong

private const val TI_PER_GHA = 10

@Composable
fun KachaPakaScreen(
    items: List<KachaItem>,
    onItemsChange: (List<KachaItem>) -> Unit,
    ghaRule: Int,
    onGhaRuleChange: (Int) -> Unit,
    kroyKhataEnabled: Boolean,
    onOpenConfirmModal: (String, String, () -> Unit) -> Unit,
    onToast: (String) -> Unit,
    onSaveHistory: (List<KachaItem>, Int, String) -> Unit,
    onOpenKroyAddModal: (PendingKroyItem) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var subtab by remember { mutableStateOf("main") } // "main" | "rate"

    // Main inputs
    var inputKuri by remember { mutableStateOf("") }
    var inputGha by remember { mutableStateOf("") }
    var inputTi by remember { mutableStateOf("") }
    var inputRate by remember { mutableStateOf("") }
    var recentBanner by remember { mutableStateOf<String?>(null) }

    // Rate Checker inputs
    var rateCheckRule by remember { mutableIntStateOf(21) }
    var findKuri by remember { mutableStateOf("") }
    var findGha by remember { mutableStateOf("") }
    var findTi by remember { mutableStateOf("") }
    var findPrice by remember { mutableStateOf("") }
    var rateCheckResult by remember { mutableStateOf<KachaRateCheckResult?>(null) }

    val currentRateVal = BengaliUtils.parseBnDouble(inputRate)
    val liveGhaRate = if (currentRateVal > 0.0) {
        BengaliUtils.formatTwoDecimals(currentRateVal / ghaRule.toDouble())
    } else null

    // Calculations for summary
    val totalTi = items.sumOf { it.totalTi }
    val totalKuri = items.sumOf { it.totalKuri }
    val grandTotal = items.sumOf { it.totalPrice }

    val tiPerKuri = ghaRule * TI_PER_GHA
    val totalTiInt = totalTi.roundToInt()
    val finalKuri = totalTiInt / tiPerKuri
    val remAfterKuri = totalTiInt % tiPerKuri
    val finalGha = remAfterKuri / TI_PER_GHA
    val finalTi = remAfterKuri % TI_PER_GHA

    val finalQtyParts = mutableListOf<String>()
    if (finalKuri > 0) finalQtyParts.add("${BengaliUtils.toBnNum(finalKuri)} কুড়ি")
    if (finalGha > 0) finalQtyParts.add("${BengaliUtils.toBnNum(finalGha)} ঘা")
    if (finalTi > 0) finalQtyParts.add("${BengaliUtils.toBnNum(finalTi)} টি")
    val finalQtyText = if (finalQtyParts.isNotEmpty()) finalQtyParts.joinToString(" ") else "০ কুড়ি"
    val avgGhaRate = if (totalKuri > 0.0) grandTotal / totalKuri / ghaRule.toDouble() else 0.0

    fun handleAddItem() {
        val kuri = BengaliUtils.parseBnDouble(inputKuri)
        val gha = BengaliUtils.parseBnDouble(inputGha)
        val ti = BengaliUtils.parseBnDouble(inputTi)
        val rate = BengaliUtils.parseBnDouble(inputRate)

        val itemTi = kuri * tiPerKuri + gha * TI_PER_GHA + ti
        if (itemTi <= 0.0 || rate <= 0.0) {
            onToast("⚠️ সঠিক পরিমাণ ও প্রতি কুড়ির দর (টাকা) লিখুন")
            return
        }

        val itemKuri = itemTi / tiPerKuri.toDouble()
        val totalPrice = ((itemKuri * rate) * 100.0).roundToLong() / 100.0
        val ghaRateVal = rate / ghaRule.toDouble()
        val qtyInfo = BengaliUtils.formatKachaItemQty(kuri, gha, ti, ghaRule, TI_PER_GHA)

        val newItem = KachaItem(
            id = System.currentTimeMillis(),
            kuri = kuri,
            gha = gha,
            ti = ti,
            totalTi = itemTi,
            totalKuri = itemKuri,
            rate = rate,
            ghaRate = ghaRateVal,
            totalPrice = totalPrice,
            qtyString = qtyInfo.displayString
        )

        onItemsChange(items + newItem)
        recentBanner =
            "সর্বশেষ যোগ: ${qtyInfo.displayString} | কুড়ির দর: ${BengaliUtils.toBnNum(rate)} ৳ " +
                "(১ ঘা = ৳ ${BengaliUtils.formatTwoDecimals(ghaRateVal)})\n" +
                "মোট: ৳ ${BengaliUtils.formatTwoDecimals(totalPrice)}"

        inputKuri = ""
        inputGha = ""
        inputTi = ""
        inputRate = ""
        onToast("✅ কাঁচা-পাকা হিসাব যোগ করা হয়েছে")
    }

    fun handleEditItem(index: Int) {
        val item = items[index]
        inputKuri = if (item.kuri > 0.0) BengaliUtils.toBnNum(item.kuri) else ""
        inputGha = if (item.gha > 0.0) BengaliUtils.toBnNum(item.gha) else ""
        inputTi = if (item.ti > 0.0) BengaliUtils.toBnNum(item.ti) else ""
        inputRate = if (item.rate > 0.0) BengaliUtils.toBnNum(item.rate) else ""
        onItemsChange(items.filterIndexed { i, _ -> i != index })
        recentBanner = null
        scope.launch { scrollState.animateScrollTo(0) }
        onToast("✏️ পরিবর্তনের জন্য ইনপুট বক্সে নেওয়া হয়েছে")
    }

    fun handleDeleteItem(index: Int) {
        onOpenConfirmModal(
            "আইটেম মুছুন",
            "আপনি কি নিশ্চিত যে এই হিসাবটি তালিকা থেকে মুছতে চান?"
        ) {
            onItemsChange(items.filterIndexed { i, _ -> i != index })
            recentBanner = null
            onToast("🗑️ হিসাবটি মুছে ফেলা হয়েছে")
        }
    }

    fun handleResetReport() {
        if (items.isEmpty()) {
            onToast("ℹ️ রিপোর্ট ইতিমধ্যে ফাঁকা আছে")
            return
        }
        onOpenConfirmModal(
            "রিপোর্ট মুছুন",
            "আপনি কি নিশ্চিত যে সম্পূর্ণ কাঁচা-পাকা সুপারি রিপোর্ট মুছে ফেলতে চান?"
        ) {
            onItemsChange(emptyList())
            recentBanner = null
            onToast("🗑️ সম্পূর্ণ রিপোর্ট মুছে ফেলা হয়েছে")
        }
    }

    fun handleCopyReport() {
        if (items.isEmpty()) return
        val sb = StringBuilder()
        sb.append("--- কাঁচা-পাকা সুপারি হিসাব রসিদ ---\n")
        sb.append("তারিখ: ${BengaliUtils.getTodayDateBengali()}\n")
        sb.append("হিসাবের নিয়ম: ${BengaliUtils.toBnNum(ghaRule)} ঘা = ১ কুড়ি\n\n")
        items.forEachIndexed { idx, item ->
            val ghaRate = if (item.ghaRate > 0) item.ghaRate else item.rate / ghaRule.toDouble()
            sb.append(
                "${BengaliUtils.toBnNum(idx + 1)}. ${item.qtyString} | দর: ${BengaliUtils.toBnNum(item.rate)} ৳ / কুড়ি " +
                    "(১ ঘা = ${BengaliUtils.formatTwoDecimals(ghaRate)} ৳) | দাম: ${BengaliUtils.formatTwoDecimals(item.totalPrice)} ৳\n"
            )
        }
        sb.append("\nসর্বমোট সুপারি: $finalQtyText\n")
        sb.append("প্রতি ঘায়ের গড় দাম: ৳ ${BengaliUtils.formatTwoDecimals(avgGhaRate)}\n")
        sb.append("সর্বমোট দাম: ৳ ${BengaliUtils.formatTwoDecimals(grandTotal)}\n")
        sb.append("\nCreated by Rahat Sharif\n")

        if (MemoExporter.copyToClipboard(context, sb.toString())) {
            onToast("📋 কাঁচা-পাকা রসিদ কপি হয়েছে!")
        }
    }

    fun handleDownloadJpg() {
        if (items.isEmpty()) {
            onToast("⚠️ সেভ করার জন্য কোনো হিসাব নেই")
            return
        }
        onToast("⏳ মেমো ছবি তৈরি ও সেভ হচ্ছে...")
        val rows = items.mapIndexed { idx, item ->
            val ghaRate = if (item.ghaRate > 0) item.ghaRate else item.rate / ghaRule.toDouble()
            listOf(
                BengaliUtils.toBnNum(idx + 1),
                item.qtyString,
                "${BengaliUtils.toBnNum(item.rate)} ৳\n(১ ঘা = ৳ ${BengaliUtils.formatTwoDecimals(ghaRate)})",
                "৳ ${BengaliUtils.formatTwoDecimals(item.totalPrice)}"
            )
        }
        val summaryRows = listOf(
            "মোট এন্ট্রি:" to "${BengaliUtils.toBnNum(items.size)}টি",
            "সর্বমোট সুপারি:" to finalQtyText,
            "মোট কুড়ি (দশমিক):" to BengaliUtils.formatTwoDecimals(totalKuri),
            "প্রতি ঘায়ের গড় দাম:" to "৳ ${BengaliUtils.formatTwoDecimals(avgGhaRate)}"
        )
        val fileName = "Kacha_Paka_Supari_${System.currentTimeMillis()}.jpg"
        scope.launch {
            val (_, msg) = MemoExporter.saveMemoImageDirectly(
                context = context,
                fileName = fileName,
                title = "কাঁচা-পাকা সুপারি বিক্রির রসিদ",
                subtitle = "তারিখ: ${BengaliUtils.getNowDateTimeBengali()} | নিয়ম: ${BengaliUtils.toBnNum(ghaRule)} ঘা = ১ কুড়ি",
                headers = listOf("নং", "পরিমাণ", "দর (কুড়ি/ঘা)", "মোট টাকা"),
                colWeights = listOf(0.8f, 2.3f, 2.0f, 1.5f),
                rows = rows,
                summaryRows = summaryRows,
                grandTotalLabel = "সর্বমোট দাম:",
                grandTotalValue = "৳ ${BengaliUtils.formatTwoDecimals(grandTotal)}"
            )
            onToast(msg)
        }
    }

    fun handlePrint() {
        if (items.isEmpty()) {
            onToast("প্রিন্ট করার মতো কোনো হিসাব নেই!")
            return
        }
        val rowsHtml = items.mapIndexed { idx, item ->
            val ghaRate = if (item.ghaRate > 0) item.ghaRate else item.rate / ghaRule.toDouble()
            """
            <tr>
              <td style="text-align:center;">${BengaliUtils.toBnNum(idx + 1)}</td>
              <td>${item.qtyString}</td>
              <td>${BengaliUtils.toBnNum(item.rate)} ৳/কুড়ি<br><small>(১ ঘা = ৳ ${BengaliUtils.formatTwoDecimals(ghaRate)})</small></td>
              <td style="text-align:right;font-weight:bold;color:#047857;">৳ ${BengaliUtils.formatTwoDecimals(item.totalPrice)}</td>
            </tr>
            """.trimIndent()
        }.joinToString("")

        val body = """
            <h2 style="text-align:center;margin-bottom:4px;">কাঁচা-পাকা সুপারি বিক্রির রসিদ</h2>
            <p style="text-align:center;color:#475569;margin-top:0;">তারিখ: ${BengaliUtils.getNowDateTimeBengali()} | নিয়ম: ${BengaliUtils.toBnNum(ghaRule)} ঘা = ১ কুড়ি</p>
            <table>
              <thead>
                <tr><th>নং</th><th>পরিমাণ</th><th>দর</th><th style="text-align:right;">মোট (৳)</th></tr>
              </thead>
              <tbody>$rowsHtml</tbody>
            </table>
            <div class="summary">
              <div class="row"><span>মোট এন্ট্রি:</span><strong>${BengaliUtils.toBnNum(items.size)}টি</strong></div>
              <div class="row"><span>সর্বমোট সুপারি:</span><strong>$finalQtyText</strong></div>
              <div class="row"><span>প্রতি ঘায়ের গড় দাম:</span><strong>৳ ${BengaliUtils.formatTwoDecimals(avgGhaRate)}</strong></div>
              <div class="row total"><span>সর্বমোট দাম:</span><span>৳ ${BengaliUtils.formatTwoDecimals(grandTotal)}</span></div>
            </div>
            <p style="text-align:center;color:#64748b;font-size:12px;">সুপারি হিসাব অ্যাপ • Created by Rahat Sharif</p>
        """.trimIndent()

        onToast("🖨️ প্রিন্ট প্রক্রিয়া শুরু হচ্ছে...")
        MemoExporter.printReceiptHtml(context, "কাঁচা-পাকা সুপারি রসিদ", body)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundGray)
            .verticalScroll(scrollState)
            .padding(14.dp)
    ) {
        // Segmented Subtabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(BorderLight)
                .padding(4.dp)
        ) {
            SubTabItem("মূল হিসাব", subtab == "main", Modifier.weight(1f)) { subtab = "main" }
            SubTabItem("দর যাচাই", subtab == "rate", Modifier.weight(1f)) { subtab = "rate" }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (subtab == "main") {
            // Rule Selector Bar
            RuleSelectorBar(
                label = "হিসাবের নিয়ম:",
                options = listOf(21 to "২১ ঘা = ১ কুড়ি", 20 to "২০ ঘা = ১ কুড়ি"),
                selected = ghaRule,
                onSelect = onGhaRuleChange
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Quantity 3-column Inputs (NO live suggestion banner below inputs)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                BnNumberInputBox(
                    label = "কুড়ি",
                    value = inputKuri,
                    onValueChange = { inputKuri = BengaliUtils.cleanBnInput(it) },
                    modifier = Modifier.weight(1f)
                )
                BnNumberInputBox(
                    label = "ঘা",
                    value = inputGha,
                    onValueChange = { inputGha = BengaliUtils.cleanBnInput(it) },
                    modifier = Modifier.weight(1f)
                )
                BnNumberInputBox(
                    label = "টি (পিস)",
                    value = inputTi,
                    onValueChange = { inputTi = BengaliUtils.cleanBnInput(it) },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Rate input with live Gha badge
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color.White,
                border = BorderStroke(1.5.dp, BorderLight)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "প্রতি কুড়ির দাম (৳)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDark
                        )
                        if (liveGhaRate != null) {
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = EmeraldLight,
                                border = BorderStroke(1.dp, EmeraldBorder)
                            ) {
                                Text(
                                    text = "১ ঘা = ৳ $liveGhaRate",
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldDark,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = inputRate,
                        onValueChange = { inputRate = BengaliUtils.cleanBnInput(it) },
                        placeholder = { Text("০") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action Buttons: Reset & Add
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = { handleResetReport() },
                    modifier = Modifier.weight(1f).height(48.dp),
                    border = BorderStroke(1.5.dp, DangerRed),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = DangerRed),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("রিপোর্ট মুছুন", fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = { handleAddItem() },
                    modifier = Modifier.weight(1.3f).height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("হিসাব যোগ করুন", fontWeight = FontWeight.ExtraBold)
                }
            }

            recentBanner?.let { banner ->
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = EmeraldLight,
                    border = BorderStroke(1.dp, EmeraldBorder)
                ) {
                    Text(
                        text = banner,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = EmeraldDark,
                        lineHeight = 19.sp,
                        modifier = Modifier.fillMaxWidth().padding(12.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Receipt Card
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color.White,
                border = BorderStroke(1.5.dp, BorderLight),
                shadowElevation = 2.dp
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "কাঁচা-পাকা সুপারি বিক্রির রসিদ",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextDark,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text(
                        text = "তারিখ: ${BengaliUtils.getTodayDateBengali()} | নিয়ম: ${BengaliUtils.toBnNum(ghaRule)} ঘা = ১ কুড়ি",
                        fontSize = 11.5.sp,
                        color = TextMuted,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(top = 2.dp, bottom = 10.dp)
                    )

                    // Table Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFF1F5F9))
                            .padding(horizontal = 8.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("নং", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = TextMuted, modifier = Modifier.width(26.dp))
                        Text("পরিমাণ", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = TextMuted, modifier = Modifier.weight(1.4f))
                        Text("দর", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = TextMuted, modifier = Modifier.weight(1.1f))
                        Text("মোট (৳)", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = TextMuted, textAlign = TextAlign.End, modifier = Modifier.weight(1f))
                        Text("অ্যাকশন", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextMuted, textAlign = TextAlign.Center, modifier = Modifier.width(if (kroyKhataEnabled) 82.dp else 56.dp))
                    }

                    if (items.isEmpty()) {
                        Text(
                            text = "এখনো কোনো হিসাব যোগ করা হয়নি।",
                            fontSize = 13.sp,
                            color = TextMuted,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().padding(vertical = 22.dp)
                        )
                    } else {
                        items.forEachIndexed { idx, item ->
                            val itemGhaRate = if (item.ghaRate > 0) item.ghaRate else item.rate / ghaRule.toDouble()
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 6.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    BengaliUtils.toBnNum(idx + 1),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextMuted,
                                    modifier = Modifier.width(26.dp)
                                )
                                Text(
                                    item.qtyString,
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextDark,
                                    modifier = Modifier.weight(1.4f).padding(end = 4.dp)
                                )
                                Column(modifier = Modifier.weight(1.1f)) {
                                    Text(
                                        "${BengaliUtils.toBnNum(item.rate)} ৳/কুড়ি",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextDark
                                    )
                                    Text(
                                        "(১ ঘা=৳${BengaliUtils.formatTwoDecimals(itemGhaRate)})",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = EmeraldDark
                                    )
                                }
                                Text(
                                    "৳ ${BengaliUtils.formatTwoDecimals(item.totalPrice)}",
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = EmeraldDark,
                                    textAlign = TextAlign.End,
                                    modifier = Modifier.weight(1f)
                                )
                                Row(
                                    modifier = Modifier.width(if (kroyKhataEnabled) 82.dp else 56.dp),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    if (kroyKhataEnabled) {
                                        IconButton(
                                            onClick = {
                                                onOpenKroyAddModal(
                                                    PendingKroyItem(
                                                        type = "kacha",
                                                        qtyText = item.qtyString,
                                                        kuri = item.totalKuri,
                                                        rule = ghaRule,
                                                        ruleText = "${BengaliUtils.toBnNum(ghaRule)} ঘা = ১ কুড়ি",
                                                        rate = item.rate,
                                                        rateText = "দর: ৳ ${BengaliUtils.toBnNum(item.rate)} / কুড়ি (${BengaliUtils.toBnNum(ghaRule)} ঘা)",
                                                        totalPrice = item.totalPrice
                                                    )
                                                )
                                            },
                                            modifier = Modifier.size(28.dp)
                                        ) {
                                            Icon(Icons.Default.ShoppingCart, contentDescription = "ক্রয় খাতা", tint = EmeraldPrimary, modifier = Modifier.size(16.dp))
                                        }
                                    }
                                    IconButton(onClick = { handleEditItem(idx) }, modifier = Modifier.size(28.dp)) {
                                        Icon(Icons.Default.Edit, contentDescription = "এডিট", tint = BlueAccent, modifier = Modifier.size(16.dp))
                                    }
                                    IconButton(onClick = { handleDeleteItem(idx) }, modifier = Modifier.size(28.dp)) {
                                        Icon(Icons.Default.Delete, contentDescription = "মুছুন", tint = DangerRed, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                            HorizontalDivider(color = Color(0xFFF1F5F9))
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Summary Card
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = BackgroundGray,
                            border = BorderStroke(1.dp, BorderLight)
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                SummaryLine("মোট এন্ট্রি:", "${BengaliUtils.toBnNum(items.size)}টি")
                                SummaryLine("সর্বমোট সুপারি:", finalQtyText, valueColor = EmeraldDark)
                                SummaryLine("মোট কুড়ি (দশমিক):", BengaliUtils.formatTwoDecimals(totalKuri))
                                SummaryLine("প্রতি ঘায়ের গড় দাম:", "৳ ${BengaliUtils.formatTwoDecimals(avgGhaRate)}", valueColor = EmeraldDark)
                                HorizontalDivider(color = BorderLight, modifier = Modifier.padding(vertical = 4.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("সর্বমোট দাম:", fontSize = 15.5.sp, fontWeight = FontWeight.ExtraBold, color = EmeraldDark)
                                    Text(
                                        "৳ ${BengaliUtils.formatTwoDecimals(grandTotal)}",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Black,
                                        color = EmeraldDark
                                    )
                                }

                                if (kroyKhataEnabled) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Button(
                                        onClick = {
                                            val avgRate = if (totalKuri > 0.0) grandTotal / totalKuri else 0.0
                                            onOpenKroyAddModal(
                                                PendingKroyItem(
                                                    type = "kacha",
                                                    qtyText = finalQtyText,
                                                    kuri = totalKuri,
                                                    rule = ghaRule,
                                                    ruleText = "${BengaliUtils.toBnNum(ghaRule)} ঘা = ১ কুড়ি",
                                                    rate = avgRate,
                                                    rateText = "গড় দর: ৳ ${BengaliUtils.toBnNum(avgRate.roundToInt())} / কুড়ি (${BengaliUtils.toBnNum(ghaRule)} ঘা)",
                                                    totalPrice = grandTotal
                                                )
                                            )
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("এই সম্পূর্ণ হিসাবটি ক্রয় খাতায় যোগ করুন", fontSize = 12.5.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (items.isNotEmpty()) {
                Spacer(modifier = Modifier.height(14.dp))
                ExportActionsGrid(
                    onCopy = { handleCopyReport() },
                    onJpgSave = { handleDownloadJpg() },
                    onPrint = { handlePrint() },
                    onSaveHistory = {
                        onSaveHistory(items, ghaRule, BengaliUtils.formatTwoDecimals(grandTotal))
                    }
                )
            }
        } else {
            // Subtab 2: দর যাচাই (Rate Checker)
            RuleSelectorBar(
                label = "হিসাবের নিয়ম:",
                options = listOf(21 to "২১ ঘা = ১ কুড়ি", 20 to "২০ ঘা = ১ কুড়ি"),
                selected = rateCheckRule,
                onSelect = { rateCheckRule = it }
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "ক্রেতা নির্দিষ্ট পরিমাণের যে দাম বলেছে তা লিখুন। এক কুড়ির দাম বের হয়ে যাবে।",
                fontSize = 12.5.sp,
                color = TextMuted,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                BnNumberInputBox(
                    label = "কুড়ি",
                    value = findKuri,
                    onValueChange = { findKuri = BengaliUtils.cleanBnInput(it) },
                    modifier = Modifier.weight(1f)
                )
                BnNumberInputBox(
                    label = "ঘা",
                    value = findGha,
                    onValueChange = { findGha = BengaliUtils.cleanBnInput(it) },
                    modifier = Modifier.weight(1f)
                )
                BnNumberInputBox(
                    label = "টি (পিস)",
                    value = findTi,
                    onValueChange = { findTi = BengaliUtils.cleanBnInput(it) },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color.White,
                border = BorderStroke(1.5.dp, BorderLight)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("উক্ত পরিমাণের দাম (৳)", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextDark)
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = findPrice,
                        onValueChange = { findPrice = BengaliUtils.cleanBnInput(it) },
                        placeholder = { Text("০") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        findKuri = ""
                        findGha = ""
                        findTi = ""
                        findPrice = ""
                        rateCheckResult = null
                    },
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("ক্লিয়ার", color = TextDark, fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = {
                        val kuri = BengaliUtils.parseBnDouble(findKuri)
                        val gha = BengaliUtils.parseBnDouble(findGha)
                        val ti = BengaliUtils.parseBnDouble(findTi)
                        val price = BengaliUtils.parseBnDouble(findPrice)
                        val tiKuri = rateCheckRule * TI_PER_GHA
                        val totalTiVal = kuri * tiKuri + gha * TI_PER_GHA + ti

                        if (totalTiVal <= 0.0 || price <= 0.0) {
                            onToast("⚠️ সঠিক পরিমাণ ও মোট দাম দিন")
                            return@Button
                        }

                        val pricePerTi = price / totalTiVal
                        val pricePerGha = pricePerTi * TI_PER_GHA
                        val pricePerKuri = pricePerTi * tiKuri
                        val totalKuriVal = totalTiVal / tiKuri.toDouble()
                        val qtyInfo = BengaliUtils.formatKachaItemQty(kuri, gha, ti, rateCheckRule, TI_PER_GHA)

                        rateCheckResult = KachaRateCheckResult(
                            pricePerKuri = pricePerKuri,
                            pricePerGha = pricePerGha,
                            totalTi = totalTiVal,
                            totalKuri = totalKuriVal,
                            totalPrice = price,
                            qtyText = qtyInfo.displayString
                        )
                        onToast("✅ ১ কুড়ির দর বের করা হয়েছে")
                    },
                    modifier = Modifier.weight(1.4f).height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("দর যাচাই করুন", fontWeight = FontWeight.ExtraBold)
                }
            }

            rateCheckResult?.let { res ->
                Spacer(modifier = Modifier.height(14.dp))
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = EmeraldLight,
                    border = BorderStroke(1.5.dp, EmeraldBorder)
                ) {
                    Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
                        Text(
                            text = "পরিমাণ: ${res.qtyText} (মোট দাম: ৳ ${BengaliUtils.toBnNum(res.totalPrice)})",
                            fontSize = 13.sp,
                            color = TextMuted,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("১ কুড়ির দাম: ", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextDark)
                            Text(
                                "${BengaliUtils.toBnNum(res.pricePerKuri.roundToInt())} ৳",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Black,
                                color = DangerRed
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        HorizontalDivider(color = EmeraldBorder)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "১ ঘার দাম: ${BengaliUtils.formatTwoDecimals(res.pricePerGha)} ৳",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldDark
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = {
                                val kuri = BengaliUtils.parseBnDouble(findKuri)
                                val gha = BengaliUtils.parseBnDouble(findGha)
                                val ti = BengaliUtils.parseBnDouble(findTi)
                                val rate = res.pricePerKuri.roundToInt().toDouble()

                                val newItem = KachaItem(
                                    id = System.currentTimeMillis(),
                                    kuri = kuri,
                                    gha = gha,
                                    ti = ti,
                                    totalTi = res.totalTi,
                                    totalKuri = res.totalKuri,
                                    rate = rate,
                                    ghaRate = res.pricePerGha,
                                    totalPrice = res.totalPrice,
                                    qtyString = res.qtyText
                                )
                                onItemsChange(items + newItem)
                                recentBanner =
                                    "দর যাচাই থেকে যোগ: ${res.qtyText} | দর: ${BengaliUtils.toBnNum(rate)} ৳ " +
                                        "(প্রতি ঘা: ৳ ${BengaliUtils.formatTwoDecimals(res.pricePerGha)})\n" +
                                        "মোট: ৳ ${BengaliUtils.formatTwoDecimals(res.totalPrice)}"
                                subtab = "main"
                                onToast("✅ দর যাচাইকৃত হিসাবটি কাঁচা-পাকা মূল তালিকায় যোগ হয়েছে")
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("➕ কাঁচা-পাকা মূল হিসাব তালিকায় যোগ করুন", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }

                        if (kroyKhataEnabled) {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedButton(
                                onClick = {
                                    onOpenKroyAddModal(
                                        PendingKroyItem(
                                            type = "kacha",
                                            qtyText = res.qtyText,
                                            kuri = res.totalKuri,
                                            rule = rateCheckRule,
                                            ruleText = "${BengaliUtils.toBnNum(rateCheckRule)} ঘা = ১ কুড়ি",
                                            rate = res.pricePerKuri,
                                            rateText = "যাচাইকৃত দর: ৳ ${BengaliUtils.toBnNum(res.pricePerKuri.roundToInt())} / কুড়ি (${BengaliUtils.toBnNum(rateCheckRule)} ঘা)",
                                            totalPrice = res.totalPrice
                                        )
                                    )
                                },
                                modifier = Modifier.fillMaxWidth(),
                                border = BorderStroke(1.5.dp, EmeraldPrimary),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = EmeraldDark, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("এই হিসাবটি দৈনিক ক্রয় খাতায় জমা করুন", color = EmeraldDark, fontWeight = FontWeight.Bold, fontSize = 12.5.sp)
                            }
                        }
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
internal fun SubTabItem(label: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(9.dp))
            .background(if (selected) Color.White else Color.Transparent)
            .clickable { onClick() }
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = if (selected) FontWeight.ExtraBold else FontWeight.SemiBold,
            color = if (selected) EmeraldDark else TextMuted
        )
    }
}

@Composable
internal fun RuleSelectorBar(
    label: String,
    options: List<Pair<Int, String>>,
    selected: Int,
    onSelect: (Int) -> Unit
) {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = Color.White,
        border = BorderStroke(1.5.dp, BorderLight)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextDark)
            CompactRuleDropdownButton(
                options = options,
                selected = selected,
                onSelect = onSelect
            )
        }
    }
}

@Composable
internal fun CompactRuleDropdownButton(
    options: List<Pair<Int, String>>,
    selected: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedText = options.firstOrNull { it.first == selected }?.second ?: ""

    Box(modifier = modifier) {
        Surface(
            modifier = Modifier.clickable { expanded = true },
            shape = RoundedCornerShape(10.dp),
            color = if (expanded) EmeraldLight else BackgroundGray,
            border = BorderStroke(
                width = 1.5.dp,
                color = if (expanded) EmeraldPrimary else BorderLight
            )
        ) {
            Row(
                modifier = Modifier
                    .then(if (modifier == Modifier) Modifier else Modifier.fillMaxWidth())
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = selectedText,
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = EmeraldDark,
                    maxLines = 1,
                    modifier = Modifier.weight(1f, fill = false)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    imageVector = if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = "নির্বাচন করুন",
                    tint = EmeraldPrimary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            containerColor = Color.White,
            shape = RoundedCornerShape(12.dp)
        ) {
            options.forEach { (value, text) ->
                val isSel = value == selected
                DropdownMenuItem(
                    text = {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = text,
                                fontSize = 13.5.sp,
                                fontWeight = if (isSel) FontWeight.ExtraBold else FontWeight.SemiBold,
                                color = if (isSel) EmeraldDark else TextDark
                            )
                            if (isSel) {
                                Spacer(modifier = Modifier.width(10.dp))
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = null,
                                    tint = EmeraldPrimary,
                                    modifier = Modifier.size(17.dp)
                                )
                            }
                        }
                    },
                    onClick = {
                        onSelect(value)
                        expanded = false
                    },
                    modifier = Modifier.background(if (isSel) EmeraldLight else Color.Transparent)
                )
            }
        }
    }
}

@Composable
internal fun BnNumberInputBox(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "০"
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.5.dp, BorderLight)
    ) {
        Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)) {
            Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                placeholder = { Text(placeholder) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp)
            )
        }
    }
}

@Composable
internal fun SummaryLine(label: String, value: String, valueColor: Color = TextDark) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 13.sp, color = TextMuted)
        Text(value, fontSize = 13.5.sp, fontWeight = FontWeight.ExtraBold, color = valueColor)
    }
}

@Composable
internal fun ExportActionsGrid(
    onCopy: () -> Unit,
    onJpgSave: () -> Unit,
    onPrint: () -> Unit,
    onSaveHistory: (() -> Unit)? = null,
    onClearAll: (() -> Unit)? = null
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = onCopy,
                modifier = Modifier.weight(1f).height(46.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                shape = RoundedCornerShape(11.dp)
            ) {
                Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("কপি করুন", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
            Button(
                onClick = onJpgSave,
                modifier = Modifier.weight(1f).height(46.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BlueAccent),
                shape = RoundedCornerShape(11.dp)
            ) {
                Icon(Icons.Default.Image, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("JPG সেভ", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = onPrint,
                modifier = Modifier.weight(1f).height(46.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F766E)),
                shape = RoundedCornerShape(11.dp)
            ) {
                Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("প্রিন্ট করুন", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
            if (onSaveHistory != null) {
                Button(
                    onClick = onSaveHistory,
                    modifier = Modifier.weight(1f).height(46.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(11.dp)
                ) {
                    Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("সেভ করুন", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
            if (onClearAll != null) {
                OutlinedButton(
                    onClick = onClearAll,
                    modifier = Modifier.weight(1f).height(46.dp),
                    border = BorderStroke(1.5.dp, DangerRed),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = DangerRed),
                    shape = RoundedCornerShape(11.dp)
                ) {
                    Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("রিসেট করুন", fontWeight = FontWeight.Bold, fontSize = 12.5.sp)
                }
            }
        }
    }
}
