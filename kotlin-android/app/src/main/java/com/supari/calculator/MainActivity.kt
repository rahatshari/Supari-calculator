package com.supari.calculator

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.supari.calculator.model.*
import com.supari.calculator.ui.components.*
import com.supari.calculator.ui.screens.*
import com.supari.calculator.ui.theme.*
import com.supari.calculator.utils.BengaliUtils
import com.supari.calculator.utils.StorageManager
import com.supari.calculator.utils.UpdateChecker
import kotlinx.coroutines.launch
import java.util.Date

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val storage = StorageManager(applicationContext)
        setContent {
            SupariCalculatorTheme {
                SupariCalculatorApp(storage = storage)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SupariCalculatorApp(storage: StorageManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var currentView by remember { mutableStateOf(AppView.HOME) }

    // Global Persistent Settings
    var kroyKhataEnabled by remember { mutableStateOf(storage.isKroyKhataEnabled()) }
    var autoUpdateEnabled by remember { mutableStateOf(storage.isAutoUpdateEnabled()) }

    // Kacha Calculator State
    var kachaGhaRule by remember { mutableIntStateOf(storage.getKachaGhaRule()) }
    var kachaItems by remember { mutableStateOf(storage.getKachaDraftItems()) }

    // Shukno Calculator State
    var shuknoBaseRule by remember { mutableIntStateOf(storage.getShuknoBaseRule()) }
    var shuknoPricePerHajar by remember { mutableStateOf(storage.getShuknoPricePerHajar()) }
    var shuknoDeductedEmptyKg by remember { mutableDoubleStateOf(storage.getShuknoDeductedEmptyKg()) }
    var shuknoBags by remember { mutableStateOf(storage.getShuknoBags()) }

    // History State
    var kachaHistory by remember { mutableStateOf(storage.getKachaHistory()) }
    var shuknoHistory by remember { mutableStateOf(storage.getShuknoHistory()) }

    // Kroy Khata DB State
    var kroyDb by remember { mutableStateOf(storage.getKroyDb()) }
    var activeKroyDate by remember { mutableStateOf(BengaliUtils.getTodayDateStr()) }

    // Dialog States
    var showSettingsModal by remember { mutableStateOf(false) }
    var showHistoryModal by remember { mutableStateOf(false) }
    var pendingKroyItem by remember { mutableStateOf<PendingKroyItem?>(null) }
    var confirmDialogState by remember { mutableStateOf<Triple<String, String, () -> Unit>?>(null) }

    // Update Checker State
    var updateInfo by remember { mutableStateOf<AppUpdateInfo?>(null) }
    var showUpdateModal by remember { mutableStateOf(false) }

    fun showToast(msg: String) {
        scope.launch {
            snackbarHostState.currentSnackbarData?.dismiss()
            snackbarHostState.showSnackbar(message = msg, duration = SnackbarDuration.Short)
        }
    }

    // Background Auto Update Check on Start & Network Restore
    LaunchedEffect(autoUpdateEnabled) {
        if (autoUpdateEnabled) {
            val info = UpdateChecker.checkForUpdates(context)
            if (info.hasUpdate) {
                updateInfo = info
                showUpdateModal = true
            }
        }
    }

    DisposableEffect(autoUpdateEnabled) {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                if (autoUpdateEnabled && updateInfo?.hasUpdate != true) {
                    scope.launch {
                        val info = UpdateChecker.checkForUpdates(context)
                        if (info.hasUpdate) {
                            updateInfo = info
                            showUpdateModal = true
                        }
                    }
                }
            }
        }
        if (autoUpdateEnabled) {
            runCatching { cm?.registerDefaultNetworkCallback(callback) }
        }
        onDispose {
            runCatching { cm?.unregisterNetworkCallback(callback) }
        }
    }

    // Android System Back Navigation
    BackHandler(enabled = currentView != AppView.HOME) {
        currentView = AppView.HOME
    }

    val headerTitle = when (currentView) {
        AppView.HOME -> "সুপারি হিসাব"
        AppView.KACHA_PAKA -> "কাঁচা-পাকা সুপারি"
        AppView.SHUKNO -> "শুকনো সুপারি"
        AppView.KROY_KHATA -> "দৈনিক ক্রয় খাতা"
    }

    Scaffold(
        containerColor = BackgroundGray,
        snackbarHost = {
            SnackbarHost(hostState = snackbarHostState) { data ->
                Snackbar(
                    modifier = Modifier.padding(12.dp),
                    containerColor = Color(0xFF0F172A),
                    contentColor = Color.White,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(data.visuals.message, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                }
            }
        },
        topBar = {
            Surface(
                color = EmeraldPrimary,
                shadowElevation = 4.dp
            ) {
                TopAppBar(
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = EmeraldPrimary,
                        titleContentColor = Color.White,
                        navigationIconContentColor = Color.White,
                        actionIconContentColor = Color.White
                    ),
                    navigationIcon = {
                        if (currentView != AppView.HOME) {
                            IconButton(onClick = { currentView = AppView.HOME }) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "ফিরে যান")
                            }
                        }
                    },
                    title = {
                        Text(
                            text = headerTitle,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    },
                    actions = {
                        IconButton(onClick = { showHistoryModal = true }) {
                            Icon(Icons.Default.History, contentDescription = "হিস্ট্রি")
                        }
                        IconButton(onClick = { showSettingsModal = true }) {
                            Icon(Icons.Default.Settings, contentDescription = "সেটিংস")
                        }
                    }
                )
            }
        },
        bottomBar = {
            Surface(
                color = CardBackground,
                border = BorderStroke(1.dp, BorderLight)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Created by Rahat Sharif",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMuted
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentView) {
                AppView.HOME -> {
                    HomeScreen(
                        kroyKhataEnabled = kroyKhataEnabled,
                        updateInfo = updateInfo,
                        onOpenUpdateModal = { showUpdateModal = true },
                        onNavigate = { target -> currentView = target }
                    )
                }
                AppView.KACHA_PAKA -> {
                    KachaPakaScreen(
                        items = kachaItems,
                        onItemsChange = { next ->
                            kachaItems = next
                            storage.saveKachaDraftItems(next)
                        },
                        ghaRule = kachaGhaRule,
                        onGhaRuleChange = { r ->
                            kachaGhaRule = r
                            storage.setKachaGhaRule(r)
                        },
                        kroyKhataEnabled = kroyKhataEnabled,
                        onOpenConfirmModal = { t, m, onOk -> confirmDialogState = Triple(t, m, onOk) },
                        onToast = { showToast(it) },
                        onSaveHistory = { items, rule, grandTotal ->
                            val record = KachaHistoryRecord(
                                id = System.currentTimeMillis(),
                                date = BengaliUtils.getTodayDateBengali(),
                                time = BengaliUtils.formatBnTime(Date()),
                                rule = rule,
                                items = items,
                                grandTotal = grandTotal
                            )
                            val updated = listOf(record) + kachaHistory
                            kachaHistory = updated
                            storage.saveKachaHistory(updated)
                            showToast("💾 কাঁচা-পাকা হিসাব হিস্ট্রিতে সেভ হয়েছে")
                        },
                        onOpenKroyAddModal = { item -> pendingKroyItem = item }
                    )
                }
                AppView.SHUKNO -> {
                    ShuknoScreen(
                        bags = shuknoBags,
                        onBagsChange = { next ->
                            shuknoBags = next
                            storage.saveShuknoBags(next)
                        },
                        baseRule = shuknoBaseRule,
                        onBaseRuleChange = { r ->
                            shuknoBaseRule = r
                            storage.setShuknoBaseRule(r)
                        },
                        pricePerHajar = shuknoPricePerHajar,
                        onPricePerHajarChange = { p ->
                            shuknoPricePerHajar = p
                            storage.setShuknoPricePerHajar(p)
                        },
                        deductedEmptyKg = shuknoDeductedEmptyKg,
                        onDeductedEmptyKgChange = { kg ->
                            shuknoDeductedEmptyKg = kg
                            storage.setShuknoDeductedEmptyKg(kg)
                        },
                        kroyKhataEnabled = kroyKhataEnabled,
                        onOpenConfirmModal = { t, m, onOk -> confirmDialogState = Triple(t, m, onOk) },
                        onToast = { showToast(it) },
                        onSaveHistory = { bags, rule, rate, emptyKg, totalStr ->
                            val record = ShuknoHistoryRecord(
                                id = System.currentTimeMillis(),
                                date = BengaliUtils.getTodayDateBengali(),
                                time = BengaliUtils.formatBnTime(Date()),
                                rule = rule,
                                rate = rate,
                                emptyBagKg = emptyKg,
                                bags = bags,
                                totalPrice = totalStr
                            )
                            val updated = listOf(record) + shuknoHistory
                            shuknoHistory = updated
                            storage.saveShuknoHistory(updated)
                            showToast("💾 শুকনো সুপারি হিসাব হিস্ট্রিতে সেভ হয়েছে")
                        },
                        onOpenKroyAddModal = { item -> pendingKroyItem = item }
                    )
                }
                AppView.KROY_KHATA -> {
                    KroyKhataScreen(
                        kroyDb = kroyDb,
                        onKroyDbChange = { next ->
                            kroyDb = next
                            storage.saveKroyDb(next)
                        },
                        activeDate = activeKroyDate,
                        onActiveDateChange = { d -> activeKroyDate = d },
                        onOpenConfirmModal = { t, m, onOk -> confirmDialogState = Triple(t, m, onOk) },
                        onToast = { showToast(it) }
                    )
                }
            }
        }
    }

    // Dialogs
    confirmDialogState?.let { (title, msg, onConfirm) ->
        ConfirmActionDialog(
            title = title,
            message = msg,
            onConfirm = onConfirm,
            onDismiss = { confirmDialogState = null }
        )
    }

    pendingKroyItem?.let { item ->
        KroyConfirmDialog(
            pendingItem = item,
            onConfirm = { seller ->
                val dateKey = BengaliUtils.getTodayDateStr()
                val newEntry = KroyEntry(
                    id = System.currentTimeMillis(),
                    time = BengaliUtils.formatBnTime(Date()),
                    seller = seller,
                    type = item.type,
                    qtyText = item.qtyText,
                    kuri = item.kuri,
                    bags = item.bags,
                    weightKg = item.weightKg,
                    rule = item.rule,
                    ruleText = item.ruleText,
                    hajarShotokText = item.hajarShotokText,
                    rate = item.rate,
                    rateText = item.rateText,
                    totalPrice = item.totalPrice
                )
                val nextMap = kroyDb.toMutableMap()
                nextMap[dateKey] = (nextMap[dateKey] ?: emptyList()) + newEntry
                kroyDb = nextMap
                storage.saveKroyDb(nextMap)
                activeKroyDate = dateKey
                pendingKroyItem = null
                showToast("✅ দৈনিক ক্রয় খাতায় সফলভাবে জমা হয়েছে")
            },
            onDismiss = { pendingKroyItem = null }
        )
    }

    if (showSettingsModal) {
        SettingsDialog(
            kroyKhataEnabled = kroyKhataEnabled,
            onToggleKroyKhata = { enabled ->
                kroyKhataEnabled = enabled
                storage.setKroyKhataEnabled(enabled)
                if (!enabled && currentView == AppView.KROY_KHATA) {
                    currentView = AppView.HOME
                }
            },
            autoUpdateEnabled = autoUpdateEnabled,
            onToggleAutoUpdate = { enabled ->
                autoUpdateEnabled = enabled
                storage.setAutoUpdateEnabled(enabled)
                showToast(if (enabled) "✅ অটোমেটিক আপডেট চেক চালু হয়েছে" else "ℹ️ অটোমেটিক আপডেট চেক বন্ধ করা হয়েছে")
            },
            onShowUpdateModal = { info ->
                updateInfo = info
                showSettingsModal = false
                showUpdateModal = true
            },
            onToast = { showToast(it) },
            onDismiss = { showSettingsModal = false }
        )
    }

    if (showUpdateModal && updateInfo != null) {
        UpdateNotificationDialog(
            updateInfo = updateInfo!!,
            onDismiss = { showUpdateModal = false }
        )
    }

    if (showHistoryModal) {
        HistoryDialog(
            currentView = currentView,
            kroyKhataEnabled = kroyKhataEnabled,
            kachaHistory = kachaHistory,
            shuknoHistory = shuknoHistory,
            kroyDb = kroyDb,
            onLoadKacha = { rec ->
                kachaGhaRule = rec.rule
                kachaItems = rec.items
                storage.setKachaGhaRule(rec.rule)
                storage.saveKachaDraftItems(rec.items)
                currentView = AppView.KACHA_PAKA
                showToast("📂 হিস্ট্রি থেকে কাঁচা-পাকা হিসাব খোলা হয়েছে")
            },
            onDeleteKacha = { id ->
                val updated = kachaHistory.filterNot { it.id == id }
                kachaHistory = updated
                storage.saveKachaHistory(updated)
                showToast("🗑️ হিস্ট্রি মুছে ফেলা হয়েছে")
            },
            onLoadShukno = { rec ->
                shuknoBaseRule = rec.rule
                shuknoPricePerHajar = rec.rate
                shuknoDeductedEmptyKg = rec.emptyBagKg
                shuknoBags = rec.bags
                storage.setShuknoBaseRule(rec.rule)
                storage.setShuknoPricePerHajar(rec.rate)
                storage.setShuknoDeductedEmptyKg(rec.emptyBagKg)
                storage.saveShuknoBags(rec.bags)
                currentView = AppView.SHUKNO
                showToast("📂 হিস্ট্রি থেকে শুকনো সুপারি হিসাব খোলা হয়েছে")
            },
            onDeleteShukno = { id ->
                val updated = shuknoHistory.filterNot { it.id == id }
                shuknoHistory = updated
                storage.saveShuknoHistory(updated)
                showToast("🗑️ হিস্ট্রি মুছে ফেলা হয়েছে")
            },
            onLoadKroyDate = { dateStr ->
                activeKroyDate = dateStr
                currentView = AppView.KROY_KHATA
                showToast("📂 ${BengaliUtils.formatBnDateShort(dateStr)}-এর ক্রয় খাতা খোলা হয়েছে")
            },
            onDeleteKroyDate = { dateStr ->
                val nextMap = kroyDb.toMutableMap()
                nextMap.remove(dateStr)
                kroyDb = nextMap
                storage.saveKroyDb(nextMap)
                showToast("🗑️ ক্রয় খাতার হিস্ট্রি মুছে ফেলা হয়েছে")
            },
            onDismiss = { showHistoryModal = false }
        )
    }
}
