package com.supari.calculator.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
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
import com.supari.calculator.ui.theme.*
import com.supari.calculator.utils.BengaliUtils

@Composable
fun ShuknoScreen(
    bags: List<Double>,
    onAddBag: (Double) -> Unit,
    onDeleteBag: (Int) -> Unit,
    onClearAll: () -> Unit,
    baseRule: Int,
    onBaseRuleChange: (Int) -> Unit,
    pricePerHajar: String,
    onPricePerHajarChange: (String) -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) } // 0: বস্তা হিসাব, 1: মোট ওজন হিসাব

    // Input States for Basta Tab
    var bagKg by remember { mutableStateOf("") }
    var bagGm by remember { mutableStateOf("") }

    // Deducted Empty Bag State
    var emptyKg by remember { mutableStateOf("") }
    var emptyGm by remember { mutableStateOf("") }
    var deductedEmptyKg by remember { mutableStateOf(0.0) }

    // Direct Weight Tab
    var directKg by remember { mutableStateOf("") }
    var directGm by remember { mutableStateOf("") }

    val rateNum = BengaliUtils.parseBnDouble(pricePerHajar)

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
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (selectedTab == 0) EmeraldPrimary else Color.Transparent)
                        .clickable { selectedTab = 0 }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "বস্তা হিসাব",
                        color = if (selectedTab == 0) Color.White else TextDark,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (selectedTab == 1) EmeraldPrimary else Color.Transparent)
                        .clickable { selectedTab = 1 }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "মোট ওজন হিসাব",
                        color = if (selectedTab == 1) Color.White else TextDark,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
        }

        // Settings Grid (Rule + Rate)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CardBackground)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "হিসাবের নিয়ম:", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Row {
                            RuleButton(label = "৮২ কেজি = ১০০০", isSelected = baseRule == 82) { onBaseRuleChange(82) }
                            Spacer(modifier = Modifier.width(6.dp))
                            RuleButton(label = "৮০ কেজি = ১০০০", isSelected = baseRule == 80) { onBaseRuleChange(80) }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = pricePerHajar,
                        onValueChange = { onPricePerHajarChange(BengaliUtils.toBnNum(it)) },
                        label = { Text("হাজারের দাম (৳)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
        }

        if (selectedTab == 0) {
            // New Bag Input (Kg + Gm)
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = bagKg,
                        onValueChange = { bagKg = BengaliUtils.toBnNum(it) },
                        label = { Text("কেজি") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = bagGm,
                        onValueChange = { bagGm = BengaliUtils.toBnNum(it) },
                        label = { Text("গ্রাম") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    Button(
                        onClick = {
                            val kg = BengaliUtils.parseBnDouble(bagKg)
                            val gm = BengaliUtils.parseBnDouble(bagGm)
                            val totalWeight = kg + gm / 1000.0
                            if (totalWeight > 0) {
                                onAddBag(totalWeight)
                                bagKg = ""
                                bagGm = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp)
                    ) {
                        Text("যোগ করুন", fontWeight = FontWeight.Bold)
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))
            }

            // Calculation Summary Card
            if (bags.isNotEmpty()) {
                val totalGrossWeight = bags.sum()
                val netWeight = (totalGrossWeight - deductedEmptyKg).coerceAtLeast(0.0)
                val breakdown = BengaliUtils.calculateShuknoBreakdown(netWeight, baseRule, rateNum)

                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = EmeraldLight),
                        border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldPrimary.copy(alpha = 0.3f))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("মোট বস্তা:", fontSize = 13.sp, color = TextMuted)
                                Text("${BengaliUtils.toBnNum(bags.size)} টি", fontWeight = FontWeight.Bold)
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("সুপারির নিট ওজন:", fontSize = 13.sp, color = TextMuted)
                                Text(BengaliUtils.formatWeightKgGm(netWeight), fontWeight = FontWeight.Bold)
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("মোট সুপারি:", fontSize = 13.sp, color = TextMuted)
                                Text(breakdown.textFormat, fontWeight = FontWeight.Bold, color = EmeraldDark)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("সর্বমোট দাম:", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Text("৳ ${breakdown.priceStr}", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = EmeraldDark)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                }
            }

            // Bags List
            itemsIndexed(bags) { index, grossWeight ->
                val breakdown = BengaliUtils.calculateShuknoBreakdown(grossWeight, baseRule, rateNum)
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
                        Column {
                            Text(
                                text = "বস্তা ${BengaliUtils.toBnNum(index + 1)}: ${BengaliUtils.formatWeightKgGm(grossWeight)}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Text(
                                text = "${breakdown.textFormat} | ৳ ${breakdown.priceStr}",
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }

                        IconButton(onClick = { onDeleteBag(index) }) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "মুছুন", tint = DangerRed)
                        }
                    }
                }
            }
        } else {
            // Direct Weight Calculation Tab
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = directKg,
                        onValueChange = { directKg = BengaliUtils.toBnNum(it) },
                        label = { Text("মোট কেজি") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = directGm,
                        onValueChange = { directGm = BengaliUtils.toBnNum(it) },
                        label = { Text("গ্রাম") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                val dirKg = BengaliUtils.parseBnDouble(directKg)
                val dirGm = BengaliUtils.parseBnDouble(directGm)
                val totalWeight = dirKg + dirGm / 1000.0

                if (totalWeight > 0) {
                    val directBreakdown = BengaliUtils.calculateShuknoBreakdown(totalWeight, baseRule, rateNum)
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = EmeraldLight)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "ওজন: ${BengaliUtils.formatWeightKgGm(totalWeight)}", fontWeight = FontWeight.Bold)
                            Text(text = "সুপারি: ${directBreakdown.textFormat}", color = EmeraldDark, fontWeight = FontWeight.Bold)
                            Text(text = "দাম: ৳ ${directBreakdown.priceStr}", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = EmeraldDark)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RuleButton(label: String, isSelected: Boolean, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = if (isSelected) EmeraldPrimary else BackgroundGray,
        border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) EmeraldPrimary else BorderLight),
        modifier = Modifier.clickable { onClick() }
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = if (isSelected) Color.White else TextDark,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
        )
    }
}
