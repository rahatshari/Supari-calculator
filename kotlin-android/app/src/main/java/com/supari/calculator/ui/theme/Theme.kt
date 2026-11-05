package com.supari.calculator.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val EmeraldPrimary = Color(0xFF059669)
val EmeraldDark = Color(0xFF047857)
val EmeraldLight = Color(0xFFECFDF5)
val BackgroundGray = Color(0xFFF8FAFC)
val CardBackground = Color(0xFFFFFFFF)
val TextDark = Color(0xFF0F172A)
val TextMuted = Color(0xFF64748B)
val BorderLight = Color(0xFFE2E8F0)
val DangerRed = Color(0xFFDC2626)
val DangerLight = Color(0xFFFEF2F2)
val WarningAmber = Color(0xFFD97706)

private val LightColorScheme = lightColorScheme(
    primary = EmeraldPrimary,
    onPrimary = Color.White,
    secondary = EmeraldDark,
    onSecondary = Color.White,
    background = BackgroundGray,
    onBackground = TextDark,
    surface = CardBackground,
    onSurface = TextDark
)

@Composable
fun SupariCalculatorTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
