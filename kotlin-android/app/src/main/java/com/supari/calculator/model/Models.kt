package com.supari.calculator.model

enum class AppView {
    HOME,
    KACHA_PAKA,
    SHUKNO,
    KROY_KHATA
}

data class KachaItem(
    val id: Long = System.currentTimeMillis(),
    val kuri: Double,
    val gha: Double,
    val ti: Double,
    val totalTi: Double,
    val totalKuri: Double,
    val rate: Double,
    val ghaRate: Double,
    val totalPrice: Double,
    val qtyString: String
)

data class KachaRateCheckResult(
    val pricePerKuri: Double,
    val pricePerGha: Double,
    val totalTi: Double,
    val totalKuri: Double,
    val totalPrice: Double,
    val qtyText: String
)

data class ShuknoBreakdown(
    val hajar: Int,
    val shotok: Int,
    val remainingKg: Double,
    val totalPrice: Double,
    val priceStr: String,
    val textFormat: String
)

data class KroyEntry(
    val id: Long = System.currentTimeMillis(),
    val time: String,
    val seller: String,
    val type: String, // "kacha" or "shukno"
    val qtyText: String,
    val kuri: Double = 0.0,
    val bags: Int = 1,
    val weightKg: Double = 0.0,
    val rule: Int,
    val ruleText: String,
    val hajarShotokText: String = "",
    val rate: Double,
    val rateText: String,
    val totalPrice: Double
)

data class PendingKroyItem(
    val type: String, // "kacha" or "shukno"
    val qtyText: String,
    val kuri: Double = 0.0,
    val bags: Int = 1,
    val weightKg: Double = 0.0,
    val rule: Int,
    val ruleText: String,
    val hajarShotokText: String = "",
    val rate: Double,
    val rateText: String,
    val totalPrice: Double
)

data class KachaHistoryRecord(
    val id: Long,
    val date: String,
    val time: String,
    val rule: Int,
    val items: List<KachaItem>,
    val grandTotal: String
)

data class ShuknoHistoryRecord(
    val id: Long,
    val date: String,
    val time: String,
    val rule: Int,
    val rate: String,
    val emptyBagKg: Double,
    val bags: List<Double>,
    val totalPrice: String
)

data class AppUpdateInfo(
    val hasUpdate: Boolean,
    val latestVersion: String,
    val currentVersion: String,
    val releaseTitle: String = "",
    val releaseNotes: String = "",
    val downloadUrl: String = "",
    val apkUrl: String = ""
)
