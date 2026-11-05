package com.supari.calculator.utils

import com.supari.calculator.model.ShuknoBreakdown
import java.text.DecimalFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object BengaliUtils {

    private val enToBnDigits = mapOf(
        '0' to '০', '1' to '১', '2' to '২', '3' to '৩', '4' to '৪',
        '5' to '৫', '6' to '৬', '7' to '৭', '8' to '৮', '9' to '৯', '.' to '.'
    )

    private val bnToEnDigits = mapOf(
        '০' to '0', '১' to '1', '২' to '2', '৩' to '3', '৪' to '4',
        '৫' to '5', '৬' to '6', '৭' to '7', '৮' to '8', '৯' to '9', '.' to '.'
    )

    fun toBnNum(number: Number): String {
        val str = when (number) {
            is Double, is Float -> {
                val d = number.toDouble()
                if (d == d.toLong().toDouble()) d.toLong().toString() else String.format(Locale.US, "%.2f", d)
            }
            else -> number.toString()
        }
        return str.map { enToBnDigits[it] ?: it }.joinToString("")
    }

    fun toBnNum(str: String): String {
        return str.map { enToBnDigits[it] ?: it }.joinToString("")
    }

    fun toEnNum(str: String): String {
        return str.map { bnToEnDigits[it] ?: it }.joinToString("")
    }

    fun parseBnDouble(str: String): Double {
        val clean = toEnNum(str.trim()).filter { it.isDigit() || it == '.' }
        return clean.toDoubleOrNull() ?: 0.0
    }

    fun formatCurrency(amount: Double): String {
        val df = DecimalFormat("#,##,##0.00")
        return "৳ " + toBnNum(df.format(amount))
    }

    fun formatWeightKgGm(kgTotal: Double): String {
        val totalGm = Math.round(kgTotal * 1000.0)
        val kg = totalGm / 1000
        val gm = totalGm % 1000

        val parts = mutableListOf<String>()
        if (kg > 0) parts.add("${toBnNum(kg)} কেজি")
        if (gm > 0) parts.add("${toBnNum(gm)} গ্রাম")

        return if (parts.isEmpty()) "০ কেজি" else parts.joinToString(" ")
    }

    fun getTodayDateBengali(): String {
        val sdf = SimpleDateFormat("dd MMMM, yyyy", Locale("bn", "BD"))
        return toBnNum(sdf.format(Date()))
    }

    fun calculateShuknoBreakdown(netWeightKg: Double, baseRuleKg: Int, pricePerHajar: Double): ShuknoBreakdown {
        if (netWeightKg <= 0.0) {
            return ShuknoBreakdown(0, 0, 0, 0.0, "০", "০ সুপারি")
        }

        val totalPieces = (netWeightKg / baseRuleKg.toDouble()) * 1000.0
        val roundPieces = Math.round(totalPieces).toInt()

        val hajar = roundPieces / 1000
        val remHajar = roundPieces % 1000
        val shotok = remHajar / 100
        val bakiPies = remHajar % 100

        val parts = mutableListOf<String>()
        if (hajar > 0) parts.add("${toBnNum(hajar)} হাজার")
        if (shotok > 0) parts.add("${toBnNum(shotok)} শতক")
        if (bakiPies > 0) parts.add("${toBnNum(bakiPies)} পিস")

        val textFormat = if (parts.isEmpty()) "০ সুপারি" else parts.joinToString(" ")
        val totalPrice = (roundPieces.toDouble() / 1000.0) * pricePerHajar
        val priceStr = toBnNum(DecimalFormat("#,##,##0").format(Math.round(totalPrice)))

        return ShuknoBreakdown(
            hajar = hajar,
            shotok = shotok,
            bakiPies = bakiPies,
            totalPrice = totalPrice,
            priceStr = priceStr,
            textFormat = textFormat
        )
    }
}
