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
import com.supari.calculator.model.PendingKroyItem
import com.supari.calculator.model.ShuknoBreakdown
import com.supari.calculator.ui.theme.*
import com.supari.calculator.utils.BengaliUtils
import com.supari.calculator.utils.MemoExporter
import kotlinx.coroutines.launch
import kotlin.math.roundToLong

@Composable
fun ShuknoScreen(
    bags: List<Double>,
    onBagsChange: (List<Double>) -> Unit,
    baseRule: Int,
    onBaseRuleChange: (Int) -> Unit,
    pricePerHajar: String,
    onPricePerHajarChange: (String) -> Unit,
    deductedEmptyKg: Double,
    onDeductedEmptyKgChange: (Double) -> Unit,
    kroyKhataEnabled: Boolean,
    onOpenConfirmModal: (String, String, () -> Unit) -> Unit,
    onToast: (String) -> Unit,
    onSaveHistory: (List<Double>, Int, String, Double, String) -> Unit,
    onOpenKroyAddModal: (PendingKroyItem) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var subtab by remember { mutableStateOf("basta") } // "basta" | "direct"

    // Basta inputs
    var bagKg by remember { mutableStateOf("") }
    var bagGm by remember { mutableStateOf("") }
    var recentBanner by remember { mutableStateOf<String?>(null) }

    // Deduction toggle
    var deductionOpen by remember { mutableStateOf(false) }
    var emptyKg by remember { mutableStateOf("") }
    var emptyGm by remember { mutableStateOf("") }

    // Direct weight inputs
    var directKg by remember { mutableStateOf("") }
    var directGm by remember { mutableStateOf("") }
    var directResult by remember { mutableStateOf<Pair<Double, ShuknoBreakdown>?>(null) }

    val rateNum = BengaliUtils.parseBnDouble(pricePerHajar)
    val totalGrossWeight = bags.sum()
    val netWeight = (totalGrossWeight - deductedEmptyKg).coerceAtLeast(0.0)
    val finalBreakdown = BengaliUtils.calculateShuknoBreakdown(netWeight, baseRule, rateNum)

    fun handleAddBag() {
        val kg = BengaliUtils.parseBnDouble(bagKg)
        val gm = BengaliUtils.parseBnDouble(bagGm)
        val grossWeight = kg + gm / 1000.0
        if (grossWeight <= 0.0) {
            onToast("⚠️ দয়া করে সঠিক বস্তার ওজন লিখুন")
            return
        }
        onBagsChange(bags + grossWeight)
        val breakdown = BengaliUtils.calculateShuknoBreakdown(grossWeight, baseRule, rateNum)
        recentBanner =
            "সর্বশেষ যোগ: ${BengaliUtils.formatWeightKgGm(grossWeight)}\n" +
                "পরিমাণ: ${breakdown.textFormat}\n" +
                "মোট: ৳ ${breakdown.priceStr}"
        bagKg = ""
        bagGm = ""
        onToast("✅ বস্তা যোগ করা হয়েছে")
    }

    fun handleEditBag(index: Int) {
        val gross = bags[index]
        val totalGm = (gross * 1000.0).roundToLong()
        val kg = totalGm / 1000L
        val gm = totalGm % 1000L
        bagKg = if (kg > 0L) BengaliUtils.toBnNum(kg) else ""
        bagGm = if (gm > 0L) BengaliUtils.toBnNum(gm) else ""
        onBagsChange(bags.filterIndexed { i, _ -> i != index })
        recentBanner = null
        scope.launch { scrollState.animateScrollTo(0) }
        onToast("✏️ এডিট করার জন্য ওজন ইনপুট বক্সে নেওয়া হয়েছে")
    }

    fun handleDeleteBag(index: Int) {
        onOpenConfirmModal("বস্তা মুছুন", "আপনি কি নিশ্চিত যে এই বস্তার হিসাবটি মুছতে চান?") {
            onBagsChange(bags.filterIndexed { i, _ -> i != index })
            onToast("🗑️ বস্তা মুছে ফেলা হয়েছে")
        }
    }

    fun handleResetReport() {
        if (bags.isEmpty()) {
            onToast("ℹ️ কোনো হিসাব তালিকাভুক্ত নেই")
            return
        }
        onOpenConfirmModal("রিসেট করুন", "আপনি কি নিশ্চিত যে শুকনো সুপারি হিসাব রিসেট করতে চান?") {
            onBagsChange(emptyList())
            onDeductedEmptyKgChange(0.0)
            bagKg = ""
            bagGm = ""
            emptyKg = ""
            emptyGm = ""
            recentBanner = null
            onToast("🗑️ সম্পূর্ণ হিসাব মুছে ফেলা হয়েছে")
        }
    }

    fun handleApplyDeduction() {
        val kg = BengaliUtils.parseBnDouble(emptyKg)
        val gm = BengaliUtils.parseBnDouble(emptyGm)
        val emptyW = kg + gm / 1000.0
        onDeductedEmptyKgChange(emptyW)
        emptyKg = ""
        emptyGm = ""
        if (emptyW > 0.0) {
            onToast("✅ মোট ওজন থেকে ${BengaliUtils.formatWeightKgGm(emptyW)} খালি বস্তার ওজন বাদ দেওয়া হয়েছে")
        } else {
            onToast("ℹ️ কোনো ওজন বাদ দেওয়া হয়নি")
        }
    }

    fun handleClearDeduction() {
        onDeductedEmptyKgChange(0.0)
        emptyKg = ""
        emptyGm = ""
        onToast("🗑️ খালি বস্তার বাদ দেওয়া ওজন ক্লিয়ার করা হয়েছে")
    }

    fun handleCopyReport() {
        if (bags.isEmpty()) return
        val sb = StringBuilder()
        sb.append("--- শুকনো সুপারি বিক্রির রসিদ ---\n")
        sb.append("হিসাবের নিয়ম: ১ হাজার = ${BengaliUtils.toBnNum(baseRule)} কেজি | দর: ৳ ${BengaliUtils.formatIntegerCurrency(rateNum)}\n\n")
        bags.forEachIndexed { idx, gross ->
            val row = BengaliUtils.calculateShuknoBreakdown(gross, baseRule, rateNum)
            sb.append("বস্তা ${BengaliUtils.toBnNum(idx + 1)}: ${BengaliUtils.formatWeightKgGm(gross)} | ${row.textFormat} | ৳ ${row.priceStr}\n")
        }
        sb.append("\nমোট বস্তা: ${BengaliUtils.toBnNum(bags.size)}টি\n")
        if (deductedEmptyKg > 0.0) {
            sb.append("বস্তাসহ মোট ওজন: ${BengaliUtils.formatWeightKgGm(totalGrossWeight)}\n")
            sb.append("বাদ দেওয়া বস্তার ওজন: ${BengaliUtils.formatWeightKgGm(deductedEmptyKg)}\n")
        }
        sb.append("সুপারির নিট ওজন: ${BengaliUtils.formatWeightKgGm(netWeight)}\n")
        sb.append("মোট সুপারি: ${finalBreakdown.textFormat}\n")
        sb.append("সর্বমোট দাম: ৳ ${finalBreakdown.priceStr}\n")
        sb.append("\nCreated by Rahat Sharif\n")

        if (MemoExporter.copyToClipboard(context, sb.toString())) {
            onToast("📋 শুকনো সুপারি রসিদ কপি হয়েছে!")
        }
    }

    fun handleDownloadJpg() {
        if (bags.isEmpty()) {
            onToast("⚠️ সেভ করার জন্য কোনো বস্তা যোগ করা হয়নি")
            return
        }
        onToast("⏳ মেমো ছবি তৈরি ও সেভ হচ্ছে...")
        val rows = bags.mapIndexed { idx, gross ->
            val row = BengaliUtils.calculateShuknoBreakdown(gross, baseRule, rateNum)
            listOf(
                BengaliUtils.toBnNum(idx + 1),
                BengaliUtils.formatWeightKgGm(gross),
                row.textFormat,
                "৳ ${row.priceStr}"
            )
        }
        val summaryRows = buildList {
            add("মোট বস্তা:" to "${BengaliUtils.toBnNum(bags.size)}টি")
            if (deductedEmptyKg > 0.0) {
                add("বস্তাসহ মোট ওজন:" to BengaliUtils.formatWeightKgGm(totalGrossWeight))
                add("বাদ দেওয়া বস্তার ওজন:" to "- ${BengaliUtils.formatWeightKgGm(deductedEmptyKg)}")
            }
            add("সুপারির নিট ওজন:" to BengaliUtils.formatWeightKgGm(netWeight))
            add("মোট সুপারি:" to finalBreakdown.textFormat)
        }
        val fileName = "Shukno_Supari_${System.currentTimeMillis()}.jpg"
        scope.launch {
            val (_, msg) = MemoExporter.saveMemoImageDirectly(
                context = context,
                fileName = fileName,
                title = "শুকনো সুপারি বিক্রির রসিদ",
                subtitle = "তারিখ: ${BengaliUtils.getNowDateTimeBengali()} | ১ হাজার = ${BengaliUtils.toBnNum(baseRule)} কেজি | দর: ৳ ${BengaliUtils.formatIntegerCurrency(rateNum)}",
                headers = listOf("বস্তা", "ওজন", "সুপারি পরিমাণ", "দাম (৳)"),
                colWeights = listOf(0.8f, 1.6f, 2.3f, 1.3f),
                rows = rows,
                summaryRows = summaryRows,
                grandTotalLabel = "সর্বমোট দাম:",
                grandTotalValue = "৳ ${finalBreakdown.priceStr}"
            )
            onToast(msg)
        }
    }

    fun handlePrint() {
        if (bags.isEmpty()) {
            onToast("প্রিন্ট করার মতো কোনো হিসাব নেই!")
            return
        }
        val rowsHtml = bags.mapIndexed { idx, gross ->
            val row = BengaliUtils.calculateShuknoBreakdown(gross, baseRule, rateNum)
            """
            <tr>
              <td style="text-align:center;">${BengaliUtils.toBnNum(idx + 1)}</td>
              <td>${BengaliUtils.formatWeightKgGm(gross)}</td>
              <td>${row.textFormat}</td>
              <td style="text-align:right;font-weight:bold;color:#047857;">৳ ${row.priceStr}</td>
            </tr>
            """.trimIndent()
        }.joinToString("")

        val deductionHtml = if (deductedEmptyKg > 0.0) {
            """
            <div class="row"><span>বস্তাসহ মোট ওজন:</span><strong>${BengaliUtils.formatWeightKgGm(totalGrossWeight)}</strong></div>
            <div class="row" style="color:#dc2626;"><span>বাদ দেওয়া বস্তার ওজন:</span><strong>- ${BengaliUtils.formatWeightKgGm(deductedEmptyKg)}</strong></div>
            """.trimIndent()
        } else ""

        val body = """
            <h2 style="text-align:center;margin-bottom:4px;">শুকনো সুপারি বিক্রির রসিদ</h2>
            <p style="text-align:center;color:#475569;margin-top:0;">তারিখ: ${BengaliUtils.getNowDateTimeBengali()} | ১ হাজার = ${BengaliUtils.toBnNum(baseRule)} কেজি | দর = ৳ ${BengaliUtils.formatIntegerCurrency(rateNum)}</p>
            <table>
              <thead>
                <tr><th>বস্তা</th><th>ওজন</th><th>পরিমাণ</th><th style="text-align:right;">দাম (৳)</th></tr>
              </thead>
              <tbody>$rowsHtml</tbody>
            </table>
            <div class="summary">
              <div class="row"><span>মোট বস্তা:</span><strong>${BengaliUtils.toBnNum(bags.size)}টি</strong></div>
              $deductionHtml
              <div class="row"><span>সুপারির নিট ওজন:</span><strong>${BengaliUtils.formatWeightKgGm(netWeight)}</strong></div>
              <div class="row"><span>মোট সুপারি:</span><strong>${finalBreakdown.textFormat}</strong></div>
              <div class="row total"><span>সর্বমোট দাম:</span><span>৳ ${finalBreakdown.priceStr}</span></div>
            </div>
            <p style="text-align:center;color:#64748b;font-size:12px;">সুপারি হিসাব অ্যাপ • Created by Rahat Sharif</p>
        """.trimIndent()

        onToast("🖨️ প্রিন্ট প্রক্রিয়া শুরু হচ্ছে...")
        MemoExporter.printReceiptHtml(context, "শুকনো সুপারি রসিদ", body)
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
            SubTabItem("বস্তা হিসাব", subtab == "basta", Modifier.weight(1f)) { subtab = "basta" }
            SubTabItem("মোট ওজন হিসাব", subtab == "direct", Modifier.weight(1f)) { subtab = "direct" }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Settings Grid: Rule & Rate per Hajar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Surface(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                color = Color.White,
                border = BorderStroke(1.dp, BorderLight)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text("হিসাবের নিয়ম", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                    Spacer(modifier = Modifier.height(8.dp))
                    CompactRuleDropdownButton(
                        options = listOf(82 to "৮২ কেজি = ১ হাজার", 80 to "৮০ কেজি = ১ হাজার"),
                        selected = baseRule,
                        onSelect = onBaseRuleChange,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Surface(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                color = Color.White,
                border = BorderStroke(1.dp, BorderLight)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text("হাজারের দাম (৳)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = pricePerHajar,
                        onValueChange = { onPricePerHajarChange(BengaliUtils.cleanBnInput(it)) },
                        placeholder = { Text("০") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (subtab == "basta") {
            Text(
                text = "নতুন বস্তার ওজন (বস্তাসহ)",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = TextDark,
                modifier = Modifier.padding(bottom = 6.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = bagKg,
                    onValueChange = { bagKg = BengaliUtils.cleanBnInput(it) },
                    placeholder = { Text("কেজি") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.weight(1f).background(Color.White, RoundedCornerShape(10.dp)),
                    shape = RoundedCornerShape(10.dp)
                )
                OutlinedTextField(
                    value = bagGm,
                    onValueChange = { bagGm = BengaliUtils.cleanBnInput(it) },
                    placeholder = { Text("গ্রাম") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.weight(1f).background(Color.White, RoundedCornerShape(10.dp)),
                    shape = RoundedCornerShape(10.dp)
                )
                Button(
                    onClick = { handleAddBag() },
                    modifier = Modifier.height(54.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("যোগ করুন", fontWeight = FontWeight.ExtraBold)
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
                        text = "শুকনো সুপারি বিক্রির রসিদ",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextDark,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text(
                        text = "১ হাজার = ${BengaliUtils.toBnNum(baseRule)} কেজি | দর = ৳ ${BengaliUtils.formatIntegerCurrency(rateNum)}",
                        fontSize = 11.5.sp,
                        color = TextMuted,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(top = 2.dp, bottom = 10.dp)
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFF1F5F9))
                            .padding(horizontal = 8.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("বস্তা", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = TextMuted, modifier = Modifier.width(34.dp))
                        Text("ওজন", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = TextMuted, modifier = Modifier.weight(1.1f))
                        Text("পরিমাণ", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = TextMuted, modifier = Modifier.weight(1.3f))
                        Text("দাম (৳)", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = TextMuted, textAlign = TextAlign.End, modifier = Modifier.weight(0.9f))
                        Text("অ্যাকশন", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextMuted, textAlign = TextAlign.Center, modifier = Modifier.width(56.dp))
                    }

                    if (bags.isEmpty()) {
                        Text(
                            text = "হিসাব করার জন্য উপরে বস্তার ওজন যোগ করুন।",
                            fontSize = 13.sp,
                            color = TextMuted,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().padding(vertical = 22.dp)
                        )
                    } else {
                        bags.forEachIndexed { idx, gross ->
                            val row = BengaliUtils.calculateShuknoBreakdown(gross, baseRule, rateNum)
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
                                    modifier = Modifier.width(34.dp)
                                )
                                Text(
                                    BengaliUtils.formatWeightKgGm(gross),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextDark,
                                    modifier = Modifier.weight(1.1f)
                                )
                                Text(
                                    row.textFormat,
                                    fontSize = 11.sp,
                                    color = TextMuted,
                                    modifier = Modifier.weight(1.3f).padding(end = 4.dp)
                                )
                                Text(
                                    "৳ ${row.priceStr}",
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = EmeraldDark,
                                    textAlign = TextAlign.End,
                                    modifier = Modifier.weight(0.9f)
                                )
                                Row(modifier = Modifier.width(56.dp), horizontalArrangement = Arrangement.End) {
                                    IconButton(onClick = { handleEditBag(idx) }, modifier = Modifier.size(28.dp)) {
                                        Icon(Icons.Default.Edit, contentDescription = "এডিট", tint = BlueAccent, modifier = Modifier.size(16.dp))
                                    }
                                    IconButton(onClick = { handleDeleteBag(idx) }, modifier = Modifier.size(28.dp)) {
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
                                SummaryLine("মোট বস্তা:", "${BengaliUtils.toBnNum(bags.size)}টি")
                                if (deductedEmptyKg > 0.0) {
                                    SummaryLine("বস্তাসহ মোট ওজন:", BengaliUtils.formatWeightKgGm(totalGrossWeight))
                                    SummaryLine("বাদ দেওয়া বস্তার ওজন:", "- ${BengaliUtils.formatWeightKgGm(deductedEmptyKg)}", valueColor = DangerRed)
                                }
                                SummaryLine("সুপারির নিট ওজন:", BengaliUtils.formatWeightKgGm(netWeight))
                                SummaryLine("মোট সুপারি:", finalBreakdown.textFormat, valueColor = EmeraldDark)
                                HorizontalDivider(color = BorderLight, modifier = Modifier.padding(vertical = 4.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("সর্বমোট দাম:", fontSize = 15.5.sp, fontWeight = FontWeight.ExtraBold, color = EmeraldDark)
                                    Text("৳ ${finalBreakdown.priceStr}", fontSize = 18.sp, fontWeight = FontWeight.Black, color = EmeraldDark)
                                }

                                if (kroyKhataEnabled) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Button(
                                        onClick = {
                                            onOpenKroyAddModal(
                                                PendingKroyItem(
                                                    type = "shukno",
                                                    qtyText = "${BengaliUtils.toBnNum(bags.size)} বস্তা (${BengaliUtils.formatWeightKgGm(netWeight)})",
                                                    bags = bags.size,
                                                    weightKg = netWeight,
                                                    rule = baseRule,
                                                    ruleText = "${BengaliUtils.toBnNum(baseRule)} কেজি = ১ হাজার",
                                                    hajarShotokText = finalBreakdown.textFormat,
                                                    rate = rateNum,
                                                    rateText = "১ হাজার = ৳ ${BengaliUtils.toBnNum(rateNum)} (${BengaliUtils.toBnNum(baseRule)} কেজি)",
                                                    totalPrice = finalBreakdown.totalPrice
                                                )
                                            )
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("এই শুকনো সুপারি হিসাবটি ক্রয় খাতায় যোগ করুন", fontSize = 12.5.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                                // Empty bag deduction toggle
                                Spacer(modifier = Modifier.height(6.dp))
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { deductionOpen = !deductionOpen },
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (deductionOpen) WarningLight else Color.White,
                                    border = BorderStroke(1.dp, if (deductionOpen) WarningAmber else BorderLight)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("বস্তার ওজন বাদ দিন (খালি বস্তা)", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = TextDark)
                                        Icon(
                                            imageVector = if (deductionOpen) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                            contentDescription = null,
                                            tint = TextMuted
                                        )
                                    }
                                }

                                if (deductionOpen) {
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = Color.White,
                                        border = BorderStroke(1.dp, BorderLight)
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text("খালি বস্তার মোট ওজন লিখুন", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                                                TextButton(onClick = { handleClearDeduction() }) {
                                                    Text("মুছে দিন", fontSize = 11.5.sp, color = DangerRed, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                OutlinedTextField(
                                                    value = emptyKg,
                                                    onValueChange = { emptyKg = BengaliUtils.cleanBnInput(it) },
                                                    placeholder = { Text("কেজি") },
                                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                    singleLine = true,
                                                    modifier = Modifier.weight(1f),
                                                    shape = RoundedCornerShape(8.dp)
                                                )
                                                OutlinedTextField(
                                                    value = emptyGm,
                                                    onValueChange = { emptyGm = BengaliUtils.cleanBnInput(it) },
                                                    placeholder = { Text("গ্রাম") },
                                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                    singleLine = true,
                                                    modifier = Modifier.weight(1f),
                                                    shape = RoundedCornerShape(8.dp)
                                                )
                                                Button(
                                                    onClick = { handleApplyDeduction() },
                                                    colors = ButtonDefaults.buttonColors(containerColor = WarningAmber),
                                                    shape = RoundedCornerShape(8.dp),
                                                    modifier = Modifier.height(50.dp)
                                                ) {
                                                    Text("বাদ দিন", fontWeight = FontWeight.Bold)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (bags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(14.dp))
                ExportActionsGrid(
                    onCopy = { handleCopyReport() },
                    onJpgSave = { handleDownloadJpg() },
                    onPrint = { handlePrint() },
                    onSaveHistory = {
                        onSaveHistory(bags, baseRule, pricePerHajar, deductedEmptyKg, finalBreakdown.priceStr)
                    },
                    onClearAll = { handleResetReport() }
                )
            }
        } else {
            // Subtab 2: মোট ওজন হিসাব
            Text("সুপারির মোট ওজন", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextDark)
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                BnNumberInputBox(
                    label = "কেজি",
                    value = directKg,
                    onValueChange = { directKg = BengaliUtils.cleanBnInput(it) },
                    modifier = Modifier.weight(1f)
                )
                BnNumberInputBox(
                    label = "গ্রাম",
                    value = directGm,
                    onValueChange = { directGm = BengaliUtils.cleanBnInput(it) },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = {
                        val totalW = BengaliUtils.parseBnDouble(directKg) + BengaliUtils.parseBnDouble(directGm) / 1000.0
                        if (totalW <= 0.0) {
                            directResult = null
                            onToast("⚠️ অনুগ্রহ করে সুপারির সঠিক ওজন লিখুন")
                            return@Button
                        }
                        directResult = totalW to BengaliUtils.calculateShuknoBreakdown(totalW, baseRule, rateNum)
                    },
                    modifier = Modifier.weight(1.6f).height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("হিসাব করুন", fontWeight = FontWeight.ExtraBold)
                }
                OutlinedButton(
                    onClick = {
                        directKg = ""
                        directGm = ""
                        directResult = null
                    },
                    modifier = Modifier.weight(1f).height(48.dp),
                    border = BorderStroke(1.5.dp, DangerRed),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("ক্লিয়ার", color = DangerRed, fontWeight = FontWeight.Bold)
                }
            }

            directResult?.let { (netW, res) ->
                Spacer(modifier = Modifier.height(14.dp))
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White,
                    border = BorderStroke(1.5.dp, EmeraldBorder)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        SummaryLine("মোট ওজন:", BengaliUtils.formatWeightKgGm(netW))
                        SummaryLine("পরিমাণ:", res.textFormat, valueColor = EmeraldDark)
                        HorizontalDivider(color = BorderLight, modifier = Modifier.padding(vertical = 4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("মোট দাম:", fontSize = 15.5.sp, fontWeight = FontWeight.ExtraBold, color = EmeraldDark)
                            Text("৳ ${res.priceStr}", fontSize = 18.sp, fontWeight = FontWeight.Black, color = EmeraldDark)
                        }

                        if (kroyKhataEnabled) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Button(
                                onClick = {
                                    onOpenKroyAddModal(
                                        PendingKroyItem(
                                            type = "shukno",
                                            qtyText = "১ লট (${BengaliUtils.formatWeightKgGm(netW)})",
                                            bags = 1,
                                            weightKg = netW,
                                            rule = baseRule,
                                            ruleText = "${BengaliUtils.toBnNum(baseRule)} কেজি = ১ হাজার",
                                            hajarShotokText = res.textFormat,
                                            rate = rateNum,
                                            rateText = "১ হাজার = ৳ ${BengaliUtils.toBnNum(rateNum)} (${BengaliUtils.toBnNum(baseRule)} কেজি)",
                                            totalPrice = res.totalPrice
                                        )
                                    )
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("ক্রয় খাতায় জমা করুন", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(24.dp))
    }
}
