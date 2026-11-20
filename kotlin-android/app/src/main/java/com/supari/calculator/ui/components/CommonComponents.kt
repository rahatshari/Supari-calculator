package com.supari.calculator.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.supari.calculator.BuildConfig
import com.supari.calculator.model.AppUpdateInfo
import com.supari.calculator.model.AppView
import com.supari.calculator.model.KachaHistoryRecord
import com.supari.calculator.model.KroyEntry
import com.supari.calculator.model.PendingKroyItem
import com.supari.calculator.model.ShuknoHistoryRecord
import com.supari.calculator.ui.theme.*
import com.supari.calculator.utils.BengaliUtils
import com.supari.calculator.utils.UpdateChecker
import kotlinx.coroutines.launch

@Composable
fun SupariLogoVector(size: Dp = 80.dp) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFFECFDF5), Color(0xFFD1FAE5))
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(size * 0.72f)) {
            val w = this.size.width
            val h = this.size.height

            // Betel nut body
            val bodyPath = Path().apply {
                moveTo(w * 0.50f, h * 0.14f)
                cubicTo(w * 0.84f, h * 0.14f, w * 0.88f, h * 0.52f, w * 0.70f, h * 0.82f)
                cubicTo(w * 0.60f, h * 0.96f, w * 0.40f, h * 0.96f, w * 0.30f, h * 0.82f)
                cubicTo(w * 0.12f, h * 0.52f, w * 0.16f, h * 0.14f, w * 0.50f, h * 0.14f)
                close()
            }
            drawPath(
                path = bodyPath,
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFFF59E0B), Color(0xFFEA580C), Color(0xFF15803D)),
                    center = Offset(w * 0.38f, h * 0.35f),
                    radius = w * 0.65f
                )
            )

            // Green calyx stem top
            val capPath = Path().apply {
                moveTo(w * 0.43f, h * 0.18f)
                cubicTo(w * 0.47f, h * 0.08f, w * 0.53f, h * 0.08f, w * 0.57f, h * 0.18f)
                close()
            }
            drawPath(path = capPath, color = Color(0xFF166534))

            // Highlight gloss
            rotate(degrees = -22f, pivot = Offset(w * 0.38f, h * 0.36f)) {
                drawOval(
                    color = Color.White.copy(alpha = 0.28f),
                    topLeft = Offset(w * 0.32f, h * 0.25f),
                    size = androidx.compose.ui.geometry.Size(w * 0.12f, h * 0.22f)
                )
            }
        }
    }
}

@Composable
fun ConfirmActionDialog(
    title: String,
    message: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color.White,
        title = {
            Text(text = title, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = TextDark)
        },
        text = {
            Text(text = message, fontSize = 14.sp, color = TextMuted)
        },
        confirmButton = {
            Button(
                onClick = {
                    onConfirm()
                    onDismiss()
                },
                colors = ButtonDefaults.buttonColors(containerColor = DangerRed),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("হ্যাঁ, নিশ্চিত", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = onDismiss,
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("বাতিল", color = TextMuted, fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
fun KroyConfirmDialog(
    pendingItem: PendingKroyItem,
    onConfirm: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var sellerName by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color.White,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = EmeraldPrimary)
                Spacer(modifier = Modifier.width(8.dp))
                Text("ক্রয় খাতায় যোগ করুন", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
            }
        },
        text = {
            Column {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = EmeraldLight,
                    border = BorderStroke(1.dp, EmeraldBorder)
                ) {
                    Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
                        Text(
                            text = if (pendingItem.type == "kacha") "🍃 কাঁচা-পাকা সুপারি" else "🪵 শুকনো সুপারি",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldDark
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = "পরিমাণ: ${pendingItem.qtyText}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextDark)
                        Text(text = pendingItem.rateText, fontSize = 12.sp, color = TextMuted)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "মোট টাকা: ${BengaliUtils.formatCurrency(pendingItem.totalPrice)}",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = EmeraldDark
                        )
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = sellerName,
                    onValueChange = { sellerName = it },
                    label = { Text("বিক্রেতার নাম (ঐচ্ছিক)") },
                    placeholder = { Text("যেমন: করিম মিয়া") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(sellerName.trim().ifEmpty { "সাধারণ বিক্রেতা" }) },
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("খাতায় জমা দিন", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss, shape = RoundedCornerShape(10.dp)) {
                Text("বাতিল", color = TextMuted)
            }
        }
    )
}

@Composable
fun SettingsDialog(
    kroyKhataEnabled: Boolean,
    onToggleKroyKhata: (Boolean) -> Unit,
    autoUpdateEnabled: Boolean,
    onToggleAutoUpdate: (Boolean) -> Unit,
    onShowUpdateModal: (AppUpdateInfo) -> Unit,
    onToast: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isChecking by remember { mutableStateOf(false) }
    var statusText by remember { mutableStateOf<String?>(null) }
    var foundUpdate by remember { mutableStateOf<AppUpdateInfo?>(null) }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.93f)
                .widthIn(max = 430.dp),
            shape = RoundedCornerShape(18.dp),
            color = Color.White,
            shadowElevation = 8.dp
        ) {
            Column(
                modifier = Modifier
                    .padding(18.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(EmeraldLight),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Settings, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("অ্যাপ সেটিংস", fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = TextDark)
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "বন্ধ করুন", tint = TextMuted)
                    }
                }

                HorizontalDivider(color = BorderLight, modifier = Modifier.padding(vertical = 10.dp))

                // Card 1: দৈনিক সুপারি ক্রয় খাতা
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = if (kroyKhataEnabled) EmeraldLight else BackgroundGray,
                    border = BorderStroke(1.5.dp, if (kroyKhataEnabled) EmeraldBorder else BorderLight)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (kroyKhataEnabled) EmeraldVibrant else Color(0xFFCBD5E1)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text("দৈনিক সুপারি ক্রয় খাতা", fontSize = 14.5.sp, fontWeight = FontWeight.ExtraBold, color = TextDark)
                                    Text(
                                        "ক্রয় চালান ট্র্যাকিং ও দিনশেষের মোট খরচের হিসাব",
                                        fontSize = 11.5.sp,
                                        color = TextMuted,
                                        lineHeight = 15.sp
                                    )
                                }
                            }
                            Switch(
                                checked = kroyKhataEnabled,
                                onCheckedChange = onToggleKroyKhata,
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = EmeraldVibrant
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Card 2: অ্যাপ আপডেট (Clean: Auto Update Switch + Manual Check & Install Button ONLY, No Links!)
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White,
                    border = BorderStroke(1.5.dp, BorderLight)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("অ্যাপ আপডেট", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = TextDark)
                                Text("নেটিভ অ্যান্ড্রয়েড সংস্করণ", fontSize = 11.sp, color = TextMuted)
                            }
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Color(0xFFDCFCE7),
                                border = BorderStroke(1.dp, Color(0xFFBBF7D0))
                            ) {
                                Text(
                                    text = "v${BengaliUtils.toBnNum(BuildConfig.VERSION_NAME)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = EmeraldDark,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Auto Update Check Toggle
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (autoUpdateEnabled) EmeraldLight else BackgroundGray,
                            border = BorderStroke(1.dp, if (autoUpdateEnabled) EmeraldBorder else BorderLight)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                                    Text("অটোমেটিক আপডেট চেক করুন", fontSize = 13.5.sp, fontWeight = FontWeight.Bold, color = TextDark)
                                    Text(
                                        "অ্যাপ চালু হলে বা ইন্টারনেট পেলে স্বয়ংক্রিয়ভাবে নতুন আপডেট জানাবে",
                                        fontSize = 11.sp,
                                        color = TextMuted,
                                        lineHeight = 14.sp
                                    )
                                }
                                Switch(
                                    checked = autoUpdateEnabled,
                                    onCheckedChange = onToggleAutoUpdate,
                                    colors = SwitchDefaults.colors(
                                        checkedThumbColor = Color.White,
                                        checkedTrackColor = EmeraldVibrant
                                    )
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        if (foundUpdate?.hasUpdate == true) {
                            Button(
                                onClick = {
                                    onToast("📥 নতুন APK ডাউনলোড ও ইনস্টল শুরু হচ্ছে...")
                                    UpdateChecker.openApkDownload(context, foundUpdate?.apkUrl)
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    "নতুন APK ইনস্টল করুন (v${BengaliUtils.toBnNum(foundUpdate?.latestVersion ?: "")})",
                                    fontWeight = FontWeight.ExtraBold
                                )
                            }
                        } else {
                            OutlinedButton(
                                onClick = {
                                    if (!isChecking) {
                                        isChecking = true
                                        statusText = null
                                        scope.launch {
                                            val info = UpdateChecker.checkForUpdates(context)
                                            isChecking = false
                                            if (info.hasUpdate) {
                                                foundUpdate = info
                                                statusText = "নতুন আপডেট পাওয়া গেছে: v${BengaliUtils.toBnNum(info.latestVersion)}"
                                                onShowUpdateModal(info)
                                            } else {
                                                statusText = "আপনার অ্যাপটি সর্বশেষ ভার্সনে আছে (v${BengaliUtils.toBnNum(BuildConfig.VERSION_NAME)})"
                                                onToast("✅ অ্যাপটি সর্বশেষ ভার্সনে আছে")
                                            }
                                        }
                                    }
                                },
                                enabled = !isChecking,
                                modifier = Modifier.fillMaxWidth(),
                                border = BorderStroke(1.5.dp, EmeraldPrimary),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                if (isChecking) {
                                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = EmeraldPrimary)
                                } else {
                                    Icon(Icons.Default.Refresh, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(18.dp))
                                }
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (isChecking) "আপডেট চেক হচ্ছে..." else "আপডেট চেক করুন ও ইনস্টল করুন",
                                    color = EmeraldPrimary,
                                    fontWeight = FontWeight.ExtraBold
                                )
                            }
                        }

                        statusText?.let { msg ->
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = msg,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (msg.contains("পাওয়া গেছে")) EmeraldDark else TextMuted
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("ঠিক আছে", fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 2.dp))
                }
            }
        }
    }
}

@Composable
fun UpdateNotificationDialog(
    updateInfo: AppUpdateInfo,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .widthIn(max = 420.dp),
            shape = RoundedCornerShape(20.dp),
            color = Color.White,
            border = BorderStroke(1.5.dp, Color(0xFFA7F3D0)),
            shadowElevation = 10.dp
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Surface(shape = RoundedCornerShape(10.dp), color = Color(0xFFD1FAE5)) {
                            Text(
                                "নতুন ভার্সন রিলিজ",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = EmeraldDark,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("সুপারি হিসাব আপডেট!", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = TextDark)
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "বন্ধ", tint = TextMuted)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = BackgroundGray,
                    border = BorderStroke(1.dp, BorderLight)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("বর্তমান ভার্সন:", fontSize = 11.sp, color = TextMuted)
                            Text("v${BengaliUtils.toBnNum(updateInfo.currentVersion)}", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                        Text("➔", fontSize = 18.sp, fontWeight = FontWeight.Black, color = EmeraldPrimary)
                        Column(horizontalAlignment = Alignment.End) {
                            Text("নতুন ভার্সন:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = EmeraldDark)
                            Text("v${BengaliUtils.toBnNum(updateInfo.latestVersion)}", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = EmeraldPrimary)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = EmeraldLight,
                    border = BorderStroke(1.dp, Color(0xFFBBF7D0))
                ) {
                    Text(
                        text = updateInfo.releaseNotes,
                        fontSize = 12.5.sp,
                        color = Color(0xFF166534),
                        lineHeight = 18.sp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 140.dp)
                            .verticalScroll(rememberScrollState())
                            .padding(12.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        UpdateChecker.openApkDownload(context, updateInfo.apkUrl.ifEmpty { updateInfo.downloadUrl })
                        onDismiss()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Download, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        "নতুন APK ইনস্টল করুন (v${BengaliUtils.toBnNum(updateInfo.latestVersion)})",
                        fontWeight = FontWeight.ExtraBold
                    )
                }

                if (updateInfo.downloadUrl.isNotBlank()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = {
                            UpdateChecker.openApkDownload(context, updateInfo.downloadUrl)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.OpenInNew, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("গিটহাব রিলিজ পেজে দেখুন", fontSize = 12.5.sp, color = TextDark)
                    }
                }

                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                ) {
                    Text("পরে মনে করিয়ে দিন", fontSize = 12.sp, color = TextMuted)
                }
            }
        }
    }
}

@Composable
fun HistoryDialog(
    currentView: AppView,
    kroyKhataEnabled: Boolean,
    kachaHistory: List<KachaHistoryRecord>,
    shuknoHistory: List<ShuknoHistoryRecord>,
    kroyDb: Map<String, List<KroyEntry>>,
    onLoadKacha: (KachaHistoryRecord) -> Unit,
    onDeleteKacha: (Long) -> Unit,
    onLoadShukno: (ShuknoHistoryRecord) -> Unit,
    onDeleteShukno: (Long) -> Unit,
    onLoadKroyDate: (String) -> Unit,
    onDeleteKroyDate: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var activeTab by remember {
        mutableIntStateOf(
            when {
                currentView == AppView.SHUKNO -> 1
                currentView == AppView.KROY_KHATA && kroyKhataEnabled -> 2
                else -> 0
            }
        )
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.84f)
                .widthIn(max = 460.dp),
            shape = RoundedCornerShape(18.dp),
            color = Color.White,
            shadowElevation = 8.dp
        ) {
            Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("সেভ করা হিসাবের হিস্ট্রি", fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = TextDark)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "বন্ধ", tint = TextMuted)
                    }
                }

                // Subtabs
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(BorderLight)
                        .padding(4.dp)
                ) {
                    HistoryTabBtn("কাঁচা-পাকা", activeTab == 0, Modifier.weight(1f)) { activeTab = 0 }
                    HistoryTabBtn("শুকনো সুপারি", activeTab == 1, Modifier.weight(1f)) { activeTab = 1 }
                    if (kroyKhataEnabled) {
                        HistoryTabBtn("ক্রয় খাতা", activeTab == 2, Modifier.weight(1f)) { activeTab = 2 }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    when (activeTab) {
                        0 -> {
                            if (kachaHistory.isEmpty()) {
                                item { EmptyHistoryState("🍃", "কোনো কাঁচা-পাকা সুপারির হিসাব সেভ করা নেই।") }
                            } else {
                                items(kachaHistory, key = { it.id }) { rec ->
                                    HistoryRecordCard(
                                        title = "${rec.date} (${rec.time})",
                                        subtitle = "নিয়ম: ${BengaliUtils.toBnNum(rec.rule)} ঘা = ১ কুড়ি | এন্ট্রি: ${BengaliUtils.toBnNum(rec.items.size)}টি",
                                        amount = "৳ ${rec.grandTotal}",
                                        onLoad = {
                                            onLoadKacha(rec)
                                            onDismiss()
                                        },
                                        onDelete = { onDeleteKacha(rec.id) }
                                    )
                                }
                            }
                        }
                        1 -> {
                            if (shuknoHistory.isEmpty()) {
                                item { EmptyHistoryState("🪵", "কোনো শুকনো সুপারির হিসাব সেভ করা নেই।") }
                            } else {
                                items(shuknoHistory, key = { it.id }) { rec ->
                                    val netW = (rec.bags.sum() - rec.emptyBagKg).coerceAtLeast(0.0)
                                    HistoryRecordCard(
                                        title = "${rec.date} (${rec.time})",
                                        subtitle = "${BengaliUtils.toBnNum(rec.bags.size)} বস্তা | নিট: ${BengaliUtils.formatWeightKgGm(netW)}",
                                        amount = "৳ ${rec.totalPrice}",
                                        onLoad = {
                                            onLoadShukno(rec)
                                            onDismiss()
                                        },
                                        onDelete = { onDeleteShukno(rec.id) }
                                    )
                                }
                            }
                        }
                        2 -> {
                            val dates = kroyDb.keys.filter { (kroyDb[it]?.isNotEmpty()) == true }.sortedDescending()
                            if (dates.isEmpty()) {
                                item { EmptyHistoryState("🛒", "কোনো সংরক্ষিত ক্রয় খাতার হিসাব নেই।") }
                            } else {
                                items(dates, key = { it }) { dateStr ->
                                    val entries = kroyDb[dateStr] ?: emptyList()
                                    val totCost = entries.sumOf { it.totalPrice }
                                    HistoryRecordCard(
                                        title = BengaliUtils.formatBnDate(dateStr),
                                        subtitle = "মোট এন্ট্রি: ${BengaliUtils.toBnNum(entries.size)} টি",
                                        amount = BengaliUtils.formatCurrency(totCost),
                                        onLoad = {
                                            onLoadKroyDate(dateStr)
                                            onDismiss()
                                        },
                                        onDelete = { onDeleteKroyDate(dateStr) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HistoryTabBtn(label: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) EmeraldPrimary else Color.Transparent)
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 12.5.sp,
            fontWeight = FontWeight.Bold,
            color = if (selected) Color.White else TextDark
        )
    }
}

@Composable
private fun EmptyHistoryState(icon: String, text: String) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(40.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(icon, fontSize = 32.sp)
        Spacer(modifier = Modifier.height(8.dp))
        Text(text, fontSize = 13.sp, color = TextMuted)
    }
}

@Composable
private fun HistoryRecordCard(
    title: String,
    subtitle: String,
    amount: String,
    onLoad: () -> Unit,
    onDelete: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = BackgroundGray,
        border = BorderStroke(1.dp, BorderLight)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontSize = 13.5.sp, fontWeight = FontWeight.ExtraBold, color = TextDark)
                Text(subtitle, fontSize = 11.5.sp, color = TextMuted)
                Text(amount, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = EmeraldDark)
            }
            Row {
                IconButton(onClick = onLoad) {
                    Icon(Icons.Default.FolderOpen, contentDescription = "খুলুন", tint = EmeraldPrimary)
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "মুছুন", tint = DangerRed)
                }
            }
        }
    }
}
