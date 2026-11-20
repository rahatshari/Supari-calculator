package com.supari.calculator.utils

import com.supari.calculator.model.ShuknoBreakdown
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt
import kotlin.math.roundToLong

data class KachaQtyInfo(
    val displayString: String,
    val rawString: String,
    val normalizedString: String,
    val normKuri: Int,
    val normGha: Int,
    val normTi: Int,
    val totalTi: Int
)

object BengaliUtils {

    private val enToBnDigits = mapOf(
        '0' to '০', '1' to '১', '2' to '২', '3' to '৩', '4' to '৪',
        '5' to '৫', '6' to '৬', '7' to '৭', '8' to '৮', '9' to '৯'
    )

    private val bnToEnDigits = mapOf(
        '০' to '0', '১' to '1', '২' to '2', '৩' to '3', '৪' to '4',
        '৫' to '5', '৬' to '6', '৭' to '7', '৮' to '8', '৯' to '9'
    )

    fun toBnNum(number: Number): String {
        val str = when (number) {
            is Double, is Float -> {
                val d = number.toDouble()
                if (d == d.toLong().toDouble()) d.toLong().toString()
                else String.format(Locale.US, "%.2f", d)
            }
            else -> number.toString()
        }
        return str.map { enToBnDigits[it] ?: it }.joinToString("")
    }

    fun toBnNum(str: String): String {
        return str.map { enToBnDigits[it] ?: it }.joinToString("")
    }

    fun cleanBnInput(input: String): String {
        val filtered = input.filter { it.isDigit() || it == '.' || bnToEnDigits.containsKey(it) }
        return toBnNum(filtered)
    }

    fun toEnNum(str: String): String {
        return str.map { bnToEnDigits[it] ?: it }.joinToString("")
    }

    fun parseBnDouble(str: String): Double {
        val clean = toEnNum(str.trim()).filter { it.isDigit() || it == '.' }
        return clean.toDoubleOrNull() ?: 0.0
    }

    fun formatTwoDecimals(value: Double): String {
        return toBnNum(String.format(Locale.US, "%.2f", value))
    }

    fun formatCurrency(amount: Double): String {
        val df = DecimalFormat("#,##0.00", DecimalFormatSymbols(Locale.US))
        return "৳ " + toBnNum(df.format(amount))
    }

    fun formatIntegerCurrency(amount: Double): String {
        val df = DecimalFormat("#,##0", DecimalFormatSymbols(Locale.US))
        return toBnNum(df.format(amount.roundToLong()))
    }

    fun formatWeightKgGm(kgTotal: Double): String {
        if (kgTotal <= 0.0) return "০ কেজি"
        val totalGm = (kgTotal * 1000.0).roundToLong()
        val kg = totalGm / 1000L
        val gm = totalGm % 1000L

        val parts = mutableListOf<String>()
        if (kg > 0) parts.add("${toBnNum(kg)} কেজি")
        if (gm > 0) parts.add("${toBnNum(gm)} গ্রাম")

        return if (parts.isEmpty()) "০ কেজি" else parts.joinToString(" ")
    }

    fun getTodayDateStr(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        return sdf.format(Date())
    }

    fun formatBnDate(dateStr: String): String {
        return try {
            val parts = dateStr.split("-")
            if (parts.size != 3) return toBnNum(dateStr)
            val cal = Calendar.getInstance()
            cal.set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt())
            val sdf = SimpleDateFormat("EEEE, dd MMMM, yyyy", Locale("bn", "BD"))
            toBnNum(sdf.format(cal.time))
        } catch (_: Exception) {
            toBnNum(dateStr)
        }
    }

    fun formatBnDateShort(dateStr: String): String {
        return try {
            val parts = dateStr.split("-")
            if (parts.size != 3) return toBnNum(dateStr)
            val cal = Calendar.getInstance()
            cal.set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt())
            val sdf = SimpleDateFormat("dd MMM, yyyy", Locale("bn", "BD"))
            toBnNum(sdf.format(cal.time))
        } catch (_: Exception) {
            toBnNum(dateStr)
        }
    }

    fun getTodayDateBengali(): String {
        val sdf = SimpleDateFormat("dd MMMM, yyyy", Locale("bn", "BD"))
        return toBnNum(sdf.format(Date()))
    }

    fun getNowDateTimeBengali(): String {
        val sdf = SimpleDateFormat("dd MMMM, yyyy, hh:mm a", Locale("bn", "BD"))
        return toBnNum(sdf.format(Date()))
    }

    fun formatBnTime(date: Date = Date()): String {
        val cal = Calendar.getInstance().apply { time = date }
        var h = cal.get(Calendar.HOUR_OF_DAY)
        val m = cal.get(Calendar.MINUTE)
        val period = when {
            h >= 12 -> "বিকাল"
            h >= 6 -> "সকাল"
            else -> "ভোর"
        }
        if (h > 12) h -= 12
        if (h == 0) h = 12
        val mStr = m.toString().padStart(2, '0')
        return "$period ${toBnNum(h)}:${toBnNum(mStr)}"
    }

    /**
     * Formats Raw Betel Nut (কাঁচা সুপারি) quantity:
     * When user enters e.g. 25 Gha, it calculates normalized Kuri and Gha
     * and returns displayString such as: "২৫ ঘা (১ কুড়ি ৪ ঘা)"
     */
    fun formatKachaItemQty(
        kuri: Double,
        gha: Double,
        ti: Double,
        ghaRule: Int,
        tiPerGha: Int = 10
    ): KachaQtyInfo {
        val tiPerKuri = ghaRule * tiPerGha
        val totalTi = (kuri * tiPerKuri + gha * tiPerGha + ti).roundToInt()

        val rawParts = mutableListOf<String>()
        if (kuri > 0) rawParts.add("${toBnNum(kuri)} কুড়ি")
        if (gha > 0) rawParts.add("${toBnNum(gha)} ঘা")
        if (ti > 0) rawParts.add("${toBnNum(ti)} টি")
        val rawString = if (rawParts.isNotEmpty()) rawParts.joinToString(" ") else "${toBnNum(totalTi)} টি"

        val normKuri = totalTi / tiPerKuri
        val remAfterKuri = totalTi % tiPerKuri
        val normGha = remAfterKuri / tiPerGha
        val normTi = remAfterKuri % tiPerGha

        val normParts = mutableListOf<String>()
        if (normKuri > 0) normParts.add("${toBnNum(normKuri)} কুড়ি")
        if (normGha > 0) normParts.add("${toBnNum(normGha)} ঘা")
        if (normTi > 0) normParts.add("${toBnNum(normTi)} টি")
        val normalizedString = if (normParts.isNotEmpty()) normParts.joinToString(" ") else "০ কুড়ি"

        var displayString = rawString
        if (rawString != normalizedString && (normKuri > 0 || gha >= ghaRule)) {
            displayString = "$rawString ($normalizedString)"
        }

        return KachaQtyInfo(
            displayString = displayString,
            rawString = rawString,
            normalizedString = normalizedString,
            normKuri = normKuri,
            normGha = normGha,
            normTi = normTi,
            totalTi = totalTi
        )
    }

    /**
     * Exact Shukno calculation matching ShuknoView.tsx:
     * Converts net weight in Kg into Hajar, Shotok, and remaining Kg/Gm using exact gram integer math.
     */
    fun calculateShuknoBreakdown(netWeightKg: Double, baseRuleKg: Int, pricePerHajar: Double): ShuknoBreakdown {
        if (netWeightKg <= 0.0) {
            return ShuknoBreakdown(0, 0, 0.0, 0.0, "০", "০ কেজি")
        }

        val totalGrams = (netWeightKg * 1000.0).roundToLong()
        val ruleGrams = baseRuleKg * 1000L
        val shotokGrams = ruleGrams / 10L

        val hajar = (totalGrams / ruleGrams).toInt()
        val remAfterHajar = totalGrams % ruleGrams
        val shotok = (remAfterHajar / shotokGrams).toInt()
        val remGrams = remAfterHajar % shotokGrams
        val remainingKg = remGrams / 1000.0

        val textBuilder = StringBuilder()
        if (hajar > 0) textBuilder.append("${toBnNum(hajar)} হাজার, ")
        if (shotok > 0 || hajar > 0) textBuilder.append("${toBnNum(shotok)} শত, ")
        textBuilder.append(formatWeightKgGm(remainingKg))

        val totalPrice = (netWeightKg / baseRuleKg.toDouble()) * pricePerHajar
        val roundedPrice = totalPrice.roundToLong().toDouble()
        val priceStr = formatIntegerCurrency(roundedPrice)

        return ShuknoBreakdown(
            hajar = hajar,
            shotok = shotok,
            remainingKg = remainingKg,
            totalPrice = roundedPrice,
            priceStr = priceStr,
            textFormat = textBuilder.toString()
        )
    }
}
