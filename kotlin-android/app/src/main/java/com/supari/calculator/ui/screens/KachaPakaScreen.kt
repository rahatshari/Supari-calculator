package com.supari.calculator.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.supari.calculator.model.KachaItem
import com.supari.calculator.model.KachaRateCheckResult
import com.supari.calculator.ui.theme.*
import com.supari.calculator.utils.BengaliUtils

@Composable
fun KachaPakaScreen(
    items: List<KachaItem>,
    onAddItem: (KachaItem) -> Unit,
    onDeleteItem: (Int) -> Unit,
    onClearAll: () -> Unit,
    ghaRule: Int,
    onGhaRuleChange: (Int) -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) } // 0: মূল হিসাব, 1: দর যাচাই

    // Input States for Main Calculation
    var inputKuri by remember { mutableStateOf("") }
    var inputGha by remember { mutableStateOf("") }
    var inputTi by remember { mutableStateOf("") }
    var inputRate by remember { mutableStateOf("") }

    // Input States for Rate Checker
    var checkKuri by remember { mutableStateOf("") }
    var checkGha by remember { mutableStateOf("") }
    var checkTi by remember { mutableStateOf("") }
    var checkPrice by remember { mutableStateOf("") }
    var rateCheckResult by remember { mutableStateOf<KachaRateCheckResult?>(null) }

    val tiPerGha = 10
    val tiPerKuri = ghaRule * tiPerGha

    // Live Gha Rate Preview
    val parsedRate = BengaliUtils.parseBnDouble(inputRate)
    val liveGhaRate = if (parsedRate > 0) String.format("%.2f", parsedRate / ghaRule) else null

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundGray)
            .padding(14.dp)
    ) {
        // Tab Selector
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(BorderLight)
                    .padding(4.dp)
            ) {
                TabButton(
                    text = "মূল হিসাব",
                    isSelected = selectedTab == 0,
                    modifier = Modifier.weight(1f),
                    onClick = { selectedTab = 0 }
                )
                TabButton(
                    text = "দর যাচাই",
                    isSelected = selectedTab == 1,
                    modifier = Modifier.weight(1f),
                    onClick = { selectedTab = 1 }
                )
            }
            Spacer(modifier = Modifier.height(14.dp))
        }

        if (selectedTab == 0) {
            // Rule Dropdown / Switcher
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = CardBackground)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "হিসাবের নিয়ম:",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDark
                        )
                        Row {
                            RuleOptionButton(
                                label = "২১ ঘা = ১ কুড়ি",
                                isSelected = ghaRule == 21,
                                onClick = { onGhaRuleChange(21) }
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            RuleOptionButton(
                                label = "২০ ঘা = ১ কুড়ি",
                                isSelected = ghaRule == 20,
                                onClick = { onGhaRuleChange(20) }
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            // Input Fields Grid (কুড়ি, ঘা, টি)
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = inputKuri,
                        onValueChange = { inputKuri = BengaliUtils.toBnNum(it) },
                        label = { Text("কুড়ি") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = inputGha,
                        onValueChange = { inputGha = BengaliUtils.toBnNum(it) },
                        label = { Text("ঘা") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = inputTi,
                        onValueChange = { inputTi = BengaliUtils.toBnNum(it) },
                        label = { Text("টি (পিস)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Rate Input
                OutlinedTextField(
                    value = inputRate,
                    onValueChange = { inputRate = BengaliUtils.toBnNum(it) },
                    label = { Text("প্রতি কুড়ির দাম (৳)") },
                    supportingText = {
                        liveGhaRate?.let {
                            Text("১ ঘা = ৳ ${BengaliUtils.toBnNum(it)}", color = EmeraldDark, fontWeight = FontWeight.Bold)
                        }
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Action Buttons
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onClearAll,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = DangerRed)
                    ) {
                        Text("রিপোর্ট মুছুন")
                    }

                    Button(
                        onClick = {
                            val kuriVal = BengaliUtils.parseBnDouble(inputKuri)
                            val ghaVal = BengaliUtils.parseBnDouble(inputGha)
                            val tiVal = BengaliUtils.parseBnDouble(inputTi)
                            val rateVal = BengaliUtils.parseBnDouble(inputRate)

                            val totalTi = kuriVal * tiPerKuri + ghaVal * tiPerGha + tiVal
                            if (totalTi > 0 && rateVal > 0) {
                                val totalKuri = totalTi / tiPerKuri.toDouble()
                                val totalPrice = Math.round(totalKuri * rateVal * 100.0) / 100.0
                                val ghaRateVal = rateVal / ghaRule.toDouble()

                                val parts = mutableListOf<String>()
                                if (kuriVal > 0) parts.add("${BengaliUtils.toBnNum(kuriVal)} কুড়ি")
                                if (ghaVal > 0) parts.add("${BengaliUtils.toBnNum(ghaVal)} ঘা")
                                if (tiVal > 0) parts.add("${BengaliUtils.toBnNum(tiVal)} টি")
                                val qtyString = if (parts.isNotEmpty()) parts.joinToString(" ") else "${BengaliUtils.toBnNum(totalTi)} টি"

                                onAddItem(
                                    KachaItem(
                                        kuri = kuriVal,
                                        gha = ghaVal,
                                        ti = tiVal,
                                        totalTi = totalTi,
                                        totalKuri = totalKuri,
                                        rate = rateVal,
                                        ghaRate = ghaRateVal,
                                        totalPrice = totalPrice,
                                        qtyString = qtyString
                                    )
                                )

                                // Clear inputs cleanly
                                inputKuri = ""
                                inputGha = ""
                                inputTi = ""
                                inputRate = ""
                            }
                        },
                        modifier = Modifier.weight(1.5f),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                    ) {
                        Text("হিসাব যোগ করুন", fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))
            }

            // Calculation Summary Card
            if (items.isNotEmpty()) {
                item {
                    val grandTotal = items.sumOf { it.totalPrice }
                    val totalTiSum = items.sumOf { it.totalTi }
                    val finalKuri = (totalTiSum / tiPerKuri).toInt()
                    val remAfterKuri = totalTiSum % tiPerKuri
                    val finalGha = (remAfterKuri / tiPerGha).toInt()
                    val finalTi = (remAfterKuri % tiPerGha).toInt()

                    val parts = mutableListOf<String>()
                    if (finalKuri > 0) parts.add("${BengaliUtils.toBnNum(finalKuri)} কুড়ি")
                    if (finalGha > 0) parts.add("${BengaliUtils.toBnNum(finalGha)} ঘা")
                    if (finalTi > 0) parts.add("${BengaliUtils.toBnNum(finalTi)} টি")
                    val finalQtyText = if (parts.isNotEmpty()) parts.joinToString(" ") else "০ কুড়ি"

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = EmeraldLight),
                        border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldPrimary.copy(alpha = 0.3f))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            SummaryLine(label = "মোট এন্ট্রি:", value = "${BengaliUtils.toBnNum(items.size)} টি")
                            SummaryLine(label = "সর্বমোট সুপারি:", value = finalQtyText)
                            SummaryLine(
                                label = "সর্বমোট দাম:",
                                value = BengaliUtils.formatCurrency(grandTotal),
                                isBold = true,
                                color = EmeraldDark
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                }
            }

            // List of Items
            itemsIndexed(items) { index, item ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(containerColor = CardBackground)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${BengaliUtils.toBnNum(index + 1)}. ${item.qtyString}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Text(
                                text = "দর: ৳ ${BengaliUtils.toBnNum(item.rate)} / কুড়ি (১ ঘা = ৳ ${BengaliUtils.toBnNum(String.format("%.2f", item.ghaRate))})",
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                            Text(
                                text = "মোট: ৳ ${BengaliUtils.toBnNum(String.format("%.2f", item.totalPrice))}",
                                fontWeight = FontWeight.ExtraBold,
                                color = EmeraldDark,
                                fontSize = 14.sp
                            )
                        }

                        IconButton(onClick = { onDeleteItem(index) }) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "মুছুন", tint = DangerRed)
                        }
                    }
                }
            }
        } else {
            // Subtab 1: দর যাচাই (Rate Checker)
            item {
                Text(
                    text = "ক্রেতা নির্দিষ্ট পরিমাণের যে দাম বলেছে তা লিখুন। এক কুড়ির দাম বের হয়ে যাবে।",
                    fontSize = 13.sp,
                    color = TextMuted,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = checkKuri,
                        onValueChange = { checkKuri = BengaliUtils.toBnNum(it) },
                        label = { Text("কুড়ি") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = checkGha,
                        onValueChange = { checkGha = BengaliUtils.toBnNum(it) },
                        label = { Text("ঘা") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = checkTi,
                        onValueChange = { checkTi = BengaliUtils.toBnNum(it) },
                        label = { Text("টি") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = checkPrice,
                    onValueChange = { checkPrice = BengaliUtils.toBnNum(it) },
                    label = { Text("উক্ত পরিমাণের মোট দাম (৳)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = {
                        val kVal = BengaliUtils.parseBnDouble(checkKuri)
                        val gVal = BengaliUtils.parseBnDouble(checkGha)
                        val tVal = BengaliUtils.parseBnDouble(checkTi)
                        val pVal = BengaliUtils.parseBnDouble(checkPrice)

                        val totalTiVal = kVal * tiPerKuri + gVal * tiPerGha + tVal
                        if (totalTiVal > 0 && pVal > 0) {
                            val pricePerTi = pVal / totalTiVal
                            val pricePerGha = pricePerTi * tiPerGha
                            val pricePerKuri = pricePerTi * tiPerKuri
                            val totalKuriVal = totalTiVal / tiPerKuri.toDouble()

                            val parts = mutableListOf<String>()
                            if (kVal > 0) parts.add("${BengaliUtils.toBnNum(kVal)} কুড়ি")
                            if (gVal > 0) parts.add("${BengaliUtils.toBnNum(gVal)} ঘা")
                            if (tVal > 0) parts.add("${BengaliUtils.toBnNum(tVal)} টি")
                            val qtyText = if (parts.isNotEmpty()) parts.joinToString(" ") else "${BengaliUtils.toBnNum(totalTiVal)} টি"

                            rateCheckResult = KachaRateCheckResult(
                                pricePerKuri = pricePerKuri,
                                pricePerGha = pricePerGha,
                                totalTi = totalTiVal,
                                totalKuri = totalKuriVal,
                                totalPrice = pVal,
                                qtyText = qtyText
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Text("১ কুড়ির দর বের করুন", fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Rate Check Result Card
                rateCheckResult?.let { res ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = EmeraldLight),
                        border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldPrimary.copy(alpha = 0.4f))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "সুপারির পরিমাণ: ${res.qtyText}", fontSize = 13.sp, color = TextDark)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "১ কুড়ির দাম: ৳ ${BengaliUtils.toBnNum(Math.round(res.pricePerKuri))}",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = EmeraldDark
                            )
                            Text(
                                text = "১ ঘার দাম: ৳ ${BengaliUtils.toBnNum(String.format("%.2f", res.pricePerGha))}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextDark
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            // Direct 1-Click Addition to Main Calculation list
                            Button(
                                onClick = {
                                    val newItem = KachaItem(
                                        kuri = BengaliUtils.parseBnDouble(checkKuri),
                                        gha = BengaliUtils.parseBnDouble(checkGha),
                                        ti = BengaliUtils.parseBnDouble(checkTi),
                                        totalTi = res.totalTi,
                                        totalKuri = res.totalKuri,
                                        rate = Math.round(res.pricePerKuri).toDouble(),
                                        ghaRate = res.pricePerGha,
                                        totalPrice = res.totalPrice,
                                        qtyString = res.qtyText
                                    )
                                    onAddItem(newItem)
                                    selectedTab = 0 // Switch back to main list
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                            ) {
                                Text("➕ কাঁচা-পাকা মূল হিসাব তালিকায় যোগ করুন", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TabButton(
    text: String,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) EmeraldPrimary else Color.Transparent)
            .clickable { onClick() }
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (isSelected) Color.White else TextDark,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
        )
    }
}

@Composable
private fun RuleOptionButton(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = if (isSelected) EmeraldPrimary else BackgroundGray,
        border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) EmeraldPrimary else BorderLight),
        modifier = Modifier.clickable { onClick() }
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = if (isSelected) Color.White else TextDark,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
        )
    }
}

@Composable
private fun SummaryLine(
    label: String,
    value: String,
    isBold: Boolean = false,
    color: Color = TextDark
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 13.sp, color = TextMuted)
        Text(
            text = value,
            fontSize = if (isBold) 16.sp else 13.sp,
            fontWeight = if (isBold) FontWeight.ExtraBold else FontWeight.Bold,
            color = color
        )
    }
}
