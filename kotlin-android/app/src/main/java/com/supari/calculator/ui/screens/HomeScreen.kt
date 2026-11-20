package com.supari.calculator.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.supari.calculator.model.AppUpdateInfo
import com.supari.calculator.model.AppView
import com.supari.calculator.ui.components.SupariLogoVector
import com.supari.calculator.ui.theme.*
import com.supari.calculator.utils.BengaliUtils

@Composable
fun HomeScreen(
    kroyKhataEnabled: Boolean,
    updateInfo: AppUpdateInfo?,
    onOpenUpdateModal: () -> Unit,
    onNavigate: (AppView) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CardBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Persistent Update Banner when newer release detected
        if (updateInfo?.hasUpdate == true) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 14.dp)
                    .clickable { onOpenUpdateModal() },
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, Color(0xFF6EE7B7)),
                shadowElevation = 3.dp
            ) {
                Row(
                    modifier = Modifier
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(EmeraldDark, EmeraldVibrant)
                            )
                        )
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "নতুন আপডেট উপলব্ধ (v${BengaliUtils.toBnNum(updateInfo.latestVersion)})!",
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 13.5.sp
                        )
                        Text(
                            text = "নতুন ফিচার পেতে এখনই ডাউনলোড ও আপডেট করুন",
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 11.sp
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color.White
                    ) {
                        Text(
                            text = "আপডেট করুন",
                            color = EmeraldDark,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Hero Logo and Title
        SupariLogoVector(size = 86.dp)

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "সুপারি হিসাব অ্যাপ",
            fontSize = 23.sp,
            fontWeight = FontWeight.ExtraBold,
            color = EmeraldDark
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "আপনি কোন হিসাবটি করতে চান নিচে নির্বাচন করুন",
            fontSize = 13.5.sp,
            fontWeight = FontWeight.Medium,
            color = TextMuted
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Card 1: কাঁচা-পাকা সুপারি হিসাব (Clean Card - No Arrow)
        ModuleCard(
            title = "কাঁচা-পাকা সুপারি হিসাব",
            subtitle = "কুড়ি, ঘা ও পিস অনুযায়ী হিসাব এবং দর যাচাই",
            iconEmoji = "🟢",
            onClick = { onNavigate(AppView.KACHA_PAKA) }
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Card 2: শুকনো সুপারির হিসাব (Clean Card - No Arrow)
        ModuleCard(
            title = "শুকনো সুপারির হিসাব",
            subtitle = "বস্তা ও মোট ওজন হিসাব এবং খালি বস্তার ওজন বাদ",
            iconEmoji = "🟤",
            onClick = { onNavigate(AppView.SHUKNO) }
        )

        if (kroyKhataEnabled) {
            Spacer(modifier = Modifier.height(14.dp))

            // Card 3: দৈনিক সুপারি ক্রয় খাতা
            ModuleCard(
                title = "দৈনিক সুপারি ক্রয় খাতা",
                subtitle = "ক্রয়কৃত সুপারি ট্র্যাকিং, মোট কুড়ি ও দিনশেষের মোট খরচের হিসাব",
                useShoppingIcon = true,
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
    iconEmoji: String = "",
    useShoppingIcon: Boolean = false,
    badgeText: String? = null,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        color = CardBackground,
        border = BorderStroke(1.5.dp, BorderLight),
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(if (useShoppingIcon) EmeraldLight else BackgroundGray),
                contentAlignment = Alignment.Center
            ) {
                if (useShoppingIcon) {
                    Icon(
                        imageVector = Icons.Default.ShoppingCart,
                        contentDescription = null,
                        tint = EmeraldPrimary,
                        modifier = Modifier.size(28.dp)
                    )
                } else {
                    Text(text = iconEmoji, fontSize = 26.sp)
                }
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = title,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextDark
                    )

                    badgeText?.let {
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = EmeraldVibrant
                        ) {
                            Text(
                                text = it,
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = subtitle,
                    fontSize = 12.5.sp,
                    color = TextMuted,
                    lineHeight = 17.sp
                )
            }
        }
    }
}
