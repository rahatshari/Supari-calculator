package com.supari.calculator

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.supari.calculator.model.AppView
import com.supari.calculator.model.KachaItem
import com.supari.calculator.model.KroyEntry
import com.supari.calculator.ui.screens.HomeScreen
import com.supari.calculator.ui.screens.KachaPakaScreen
import com.supari.calculator.ui.screens.KroyKhataScreen
import com.supari.calculator.ui.screens.ShuknoScreen
import com.supari.calculator.ui.theme.EmeraldDark
import com.supari.calculator.ui.theme.EmeraldPrimary
import com.supari.calculator.ui.theme.SupariCalculatorTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SupariCalculatorTheme {
                SupariApp()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SupariApp() {
    var currentView by remember { mutableStateOf(AppView.HOME) }
    var kroyKhataEnabled by remember { mutableStateOf(false) }
    var isSettingsOpen by remember { mutableStateOf(false) }

    // Kacha State
    val kachaItems = remember { mutableStateListOf<KachaItem>() }
    var kachaGhaRule by remember { mutableIntStateOf(21) }

    // Shukno State
    val shuknoBags = remember { mutableStateListOf<Double>() }
    var shuknoBaseRule by remember { mutableIntStateOf(82) }
    var shuknoPricePerHajar by remember { mutableStateOf("") }

    // Kroy Khata State
    val kroyEntries = remember { mutableStateListOf<KroyEntry>() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = when (currentView) {
                            AppView.HOME -> "সুপারি হিসাব অ্যাপ"
                            AppView.KACHA_PAKA -> "কাঁচা-পাকা সুপারি হিসাব"
                            AppView.SHUKNO -> "শুকনো সুপারির হিসাব"
                            AppView.KROY_KHATA -> "দৈনিক সুপারি ক্রয় খাতা"
                        },
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                },
                navigationIcon = {
                    if (currentView != AppView.HOME) {
                        IconButton(onClick = { currentView = AppView.HOME }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "মেনু",
                                tint = Color.White
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { isSettingsOpen = true }) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "সেটিংস",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = EmeraldPrimary
                )
            )
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (currentView) {
                AppView.HOME -> HomeScreen(
                    kroyKhataEnabled = kroyKhataEnabled,
                    onNavigate = { currentView = it }
                )
                AppView.KACHA_PAKA -> KachaPakaScreen(
                    items = kachaItems,
                    onAddItem = { kachaItems.add(it) },
                    onDeleteItem = { kachaItems.removeAt(it) },
                    onClearAll = { kachaItems.clear() },
                    ghaRule = kachaGhaRule,
                    onGhaRuleChange = { kachaGhaRule = it }
                )
                AppView.SHUKNO -> ShuknoScreen(
                    bags = shuknoBags,
                    onAddBag = { shuknoBags.add(it) },
                    onDeleteBag = { shuknoBags.removeAt(it) },
                    onClearAll = { shuknoBags.clear() },
                    baseRule = shuknoBaseRule,
                    onBaseRuleChange = { shuknoBaseRule = it },
                    pricePerHajar = shuknoPricePerHajar,
                    onPricePerHajarChange = { shuknoPricePerHajar = it }
                )
                AppView.KROY_KHATA -> KroyKhataScreen(
                    entries = kroyEntries,
                    onDeleteEntry = { kroyEntries.removeAt(it) }
                )
            }

            // Settings Dialog
            if (isSettingsOpen) {
                AlertDialog(
                    onDismissRequest = { isSettingsOpen = false },
                    title = { Text(text = "অ্যাপ সেটিংস", fontWeight = FontWeight.Bold) },
                    text = {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = "দৈনিক সুপারি ক্রয় খাতা")
                            Switch(
                                checked = kroyKhataEnabled,
                                onCheckedChange = { kroyKhataEnabled = it }
                            )
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = { isSettingsOpen = false }) {
                            Text("ঠিক আছে", fontWeight = FontWeight.Bold, color = EmeraldDark)
                        }
                    }
                )
            }
        }
    }
}
