package com.supari.calculator.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.supari.calculator.model.AppView
import com.supari.calculator.ui.theme.*

@Composable
fun HomeScreen(
    kroyKhataEnabled: Boolean,
    onNavigate: (AppView) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundGray)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Hero Logo and Title
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(EmeraldLight)
                .border(2.dp, EmeraldPrimary.copy(alpha = 0.3f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(text = "🌰", fontSize = 42.sp)
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "সুপারি হিসাব অ্যাপ",
            fontSize = 22.sp,
            fontWeight = FontWeight.ExtraBold,
            color = EmeraldDark
        )

        Text(
            text = "আপনি কোন হিসাবটি করতে চান নিচে নির্বাচন করুন",
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = TextMuted
        )

        Spacer(modifier = Modifier.height(28.dp))

        // Card 1: কাঁচা-পাকা সুপারি হিসাব
        ModuleCard(
            title = "কাঁচা-পাকা সুপারি হিসাব",
            subtitle = "কুড়ি, ঘা ও পিস অনুযায়ী হিসাব এবং দর যাচাই",
            iconText = "🟢",
            onClick = { onNavigate(AppView.KACHA_PAKA) }
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Card 2: শুকনো সুপারির হিসাব
        ModuleCard(
            title = "শুকনো সুপারির হিসাব",
            subtitle = "বস্তা ও মোট ওজন হিসাব এবং খালি বস্তার ওজন বাদ",
            iconText = "🟤",
            onClick = { onNavigate(AppView.SHUKNO) }
        )

        if (kroyKhataEnabled) {
            Spacer(modifier = Modifier.height(14.dp))

            // Card 3: দৈনিক সুপারি ক্রয় খাতা
            ModuleCard(
                title = "দৈনিক সুপারি ক্রয় খাতা",
                subtitle = "ক্রয়কৃত সুপারি ট্র্যাকিং ও দিনশেষের মোট খরচের হিসাব",
                iconText = "🛒",
                badgeText = "নতুন",
                onClick = { onNavigate(AppView.KROY_KHATA) }
            )
        }
    }
}

@Composable
private fun ModuleCard(
    title: String,
    subtitle: String,
    iconText: String,
    badgeText: String? = null,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(EmeraldLight),
                contentAlignment = Alignment.Center
            ) {
                Text(text = iconText, fontSize = 24.sp)
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDark
                    )

                    badgeText?.let {
                        Spacer(modifier = Modifier.width(6.dp))
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = EmeraldPrimary
                        ) {
                            Text(
                                text = it,
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = TextMuted,
                    lineHeight = 16.sp
                )
            }

            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                tint = TextMuted,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
