package com.supari.calculator.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.supari.calculator.model.KroyEntry
import com.supari.calculator.ui.theme.*
import com.supari.calculator.utils.BengaliUtils

@Composable
fun KroyKhataScreen(
    entries: List<KroyEntry>,
    onDeleteEntry: (Int) -> Unit
) {
    val totalExpense = entries.sumOf { it.totalPrice }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundGray)
            .padding(14.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = EmeraldLight),
                border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldPrimary.copy(alpha = 0.4f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "আজকের মোট খরিদ খরচ",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = TextMuted
                    )
                    Text(
                        text = BengaliUtils.formatCurrency(totalExpense),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = EmeraldDark
                    )
                    Text(
                        text = "মোট লট / এন্ট্রি: ${BengaliUtils.toBnNum(entries.size)} টি",
                        fontSize = 12.sp,
                        color = TextMuted
                    )
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
        }

        if (entries.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "আজকের দিনে এখনো কোনো ক্রয় হিসাব এন্ট্রি করা হয়নি।",
                        fontSize = 13.sp,
                        color = TextMuted
                    )
                }
            }
        }

        itemsIndexed(entries) { index, entry ->
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = entry.seller,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = if (entry.type == "kacha") EmeraldLight else Color(0xFFFEF3C7)
                            ) {
                                Text(
                                    text = if (entry.type == "kacha") "কাঁচা-পাকা" else "শুকনো",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (entry.type == "kacha") EmeraldDark else WarningAmber,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        Text(
                            text = entry.qtyText,
                            fontSize = 12.sp,
                            color = TextDark,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = entry.rateText,
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                        Text(
                            text = "মোট: ৳ ${BengaliUtils.toBnNum(String.format("%.2f", entry.totalPrice))}",
                            fontWeight = FontWeight.Bold,
                            color = EmeraldDark,
                            fontSize = 13.sp
                        )
                    }

                    IconButton(onClick = { onDeleteEntry(index) }) {
                        Icon(imageVector = Icons.Default.Delete, contentDescription = "মুছুন", tint = DangerRed)
                    }
                }
            }
        }
    }
}
