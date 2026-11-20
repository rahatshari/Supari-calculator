package com.supari.calculator.utils

import android.content.Context
import android.content.SharedPreferences
import com.supari.calculator.model.KachaHistoryRecord
import com.supari.calculator.model.KachaItem
import com.supari.calculator.model.KroyEntry
import com.supari.calculator.model.ShuknoHistoryRecord
import org.json.JSONArray
import org.json.JSONObject

class StorageManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("supari_calculator_prefs", Context.MODE_PRIVATE)

    // Settings
    fun isKroyKhataEnabled(): Boolean = prefs.getBoolean("kroy_khata_enabled", false)
    fun setKroyKhataEnabled(enabled: Boolean) {
        prefs.edit().putBoolean("kroy_khata_enabled", enabled).apply()
    }

    fun isAutoUpdateEnabled(): Boolean = prefs.getBoolean("auto_update_enabled", true)
    fun setAutoUpdateEnabled(enabled: Boolean) {
        prefs.edit().putBoolean("auto_update_enabled", enabled).apply()
    }

    // Kacha Drafts
    fun getKachaGhaRule(): Int = prefs.getInt("kacha_gha_rule", 21)
    fun setKachaGhaRule(rule: Int) {
        prefs.edit().putInt("kacha_gha_rule", rule).apply()
    }

    fun getKachaDraftItems(): List<KachaItem> {
        val raw = prefs.getString("kacha_draft_items", null) ?: return emptyList()
        return parseKachaItems(raw)
    }

    fun saveKachaDraftItems(items: List<KachaItem>) {
        prefs.edit().putString("kacha_draft_items", serializeKachaItems(items).toString()).apply()
    }

    // Shukno Drafts
    fun getShuknoBaseRule(): Int = prefs.getInt("shukno_base_rule", 82)
    fun setShuknoBaseRule(rule: Int) {
        prefs.edit().putInt("shukno_base_rule", rule).apply()
    }

    fun getShuknoPricePerHajar(): String = prefs.getString("shukno_price_per_hajar", "") ?: ""
    fun setShuknoPricePerHajar(price: String) {
        prefs.edit().putString("shukno_price_per_hajar", price).apply()
    }

    fun getShuknoDeductedEmptyKg(): Double =
        java.lang.Double.longBitsToDouble(prefs.getLong("shukno_empty_kg_bits", java.lang.Double.doubleToRawLongBits(0.0)))

    fun setShuknoDeductedEmptyKg(kg: Double) {
        prefs.edit().putLong("shukno_empty_kg_bits", java.lang.Double.doubleToRawLongBits(kg)).apply()
    }

    fun getShuknoBags(): List<Double> {
        val raw = prefs.getString("shukno_bags", null) ?: return emptyList()
        return try {
            val arr = JSONArray(raw)
            List(arr.length()) { i -> arr.getDouble(i) }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun saveShuknoBags(bags: List<Double>) {
        val arr = JSONArray()
        bags.forEach { arr.put(it) }
        prefs.edit().putString("shukno_bags", arr.toString()).apply()
    }

    // Kacha History
    fun getKachaHistory(): List<KachaHistoryRecord> {
        val raw = prefs.getString("kacha_history", null) ?: return emptyList()
        return try {
            val arr = JSONArray(raw)
            val list = mutableListOf<KachaHistoryRecord>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(
                    KachaHistoryRecord(
                        id = obj.getLong("id"),
                        date = obj.optString("date", ""),
                        time = obj.optString("time", ""),
                        rule = obj.optInt("rule", 21),
                        items = parseKachaItems(obj.optJSONArray("items")?.toString() ?: "[]"),
                        grandTotal = obj.optString("grandTotal", "০.০০")
                    )
                )
            }
            list
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun saveKachaHistory(records: List<KachaHistoryRecord>) {
        val arr = JSONArray()
        records.forEach { rec ->
            val obj = JSONObject().apply {
                put("id", rec.id)
                put("date", rec.date)
                put("time", rec.time)
                put("rule", rec.rule)
                put("items", serializeKachaItems(rec.items))
                put("grandTotal", rec.grandTotal)
            }
            arr.put(obj)
        }
        prefs.edit().putString("kacha_history", arr.toString()).apply()
    }

    // Shukno History
    fun getShuknoHistory(): List<ShuknoHistoryRecord> {
        val raw = prefs.getString("shukno_history", null) ?: return emptyList()
        return try {
            val arr = JSONArray(raw)
            val list = mutableListOf<ShuknoHistoryRecord>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val bagsArr = obj.optJSONArray("bags") ?: JSONArray()
                val bags = List(bagsArr.length()) { j -> bagsArr.getDouble(j) }
                list.add(
                    ShuknoHistoryRecord(
                        id = obj.getLong("id"),
                        date = obj.optString("date", ""),
                        time = obj.optString("time", ""),
                        rule = obj.optInt("rule", 82),
                        rate = obj.optString("rate", ""),
                        emptyBagKg = obj.optDouble("emptyBagKg", 0.0),
                        bags = bags,
                        totalPrice = obj.optString("totalPrice", "০")
                    )
                )
            }
            list
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun saveShuknoHistory(records: List<ShuknoHistoryRecord>) {
        val arr = JSONArray()
        records.forEach { rec ->
            val bagsArr = JSONArray()
            rec.bags.forEach { bagsArr.put(it) }
            val obj = JSONObject().apply {
                put("id", rec.id)
                put("date", rec.date)
                put("time", rec.time)
                put("rule", rec.rule)
                put("rate", rec.rate)
                put("emptyBagKg", rec.emptyBagKg)
                put("bags", bagsArr)
                put("totalPrice", rec.totalPrice)
            }
            arr.put(obj)
        }
        prefs.edit().putString("shukno_history", arr.toString()).apply()
    }

    // Kroy Khata DB (Map<String, List<KroyEntry>>)
    fun getKroyDb(): Map<String, List<KroyEntry>> {
        val raw = prefs.getString("kroy_khata_db", null) ?: return emptyMap()
        return try {
            val root = JSONObject(raw)
            val map = mutableMapOf<String, List<KroyEntry>>()
            val keys = root.keys()
            while (keys.hasNext()) {
                val dateKey = keys.next()
                val arr = root.getJSONArray(dateKey)
                val list = mutableListOf<KroyEntry>()
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    list.add(
                        KroyEntry(
                            id = obj.optLong("id", System.currentTimeMillis()),
                            time = obj.optString("time", ""),
                            seller = obj.optString("seller", "সাধারণ বিক্রেতা"),
                            type = obj.optString("type", "kacha"),
                            qtyText = obj.optString("qtyText", ""),
                            kuri = obj.optDouble("kuri", 0.0),
                            bags = obj.optInt("bags", 1),
                            weightKg = obj.optDouble("weightKg", 0.0),
                            rule = obj.optInt("rule", 21),
                            ruleText = obj.optString("ruleText", ""),
                            hajarShotokText = obj.optString("hajarShotokText", ""),
                            rate = obj.optDouble("rate", 0.0),
                            rateText = obj.optString("rateText", ""),
                            totalPrice = obj.optDouble("totalPrice", 0.0)
                        )
                    )
                }
                map[dateKey] = list
            }
            map
        } catch (_: Exception) {
            emptyMap()
        }
    }

    fun saveKroyDb(db: Map<String, List<KroyEntry>>) {
        val root = JSONObject()
        db.forEach { (dateKey, entries) ->
            val arr = JSONArray()
            entries.forEach { e ->
                val obj = JSONObject().apply {
                    put("id", e.id)
                    put("time", e.time)
                    put("seller", e.seller)
                    put("type", e.type)
                    put("qtyText", e.qtyText)
                    put("kuri", e.kuri)
                    put("bags", e.bags)
                    put("weightKg", e.weightKg)
                    put("rule", e.rule)
                    put("ruleText", e.ruleText)
                    put("hajarShotokText", e.hajarShotokText)
                    put("rate", e.rate)
                    put("rateText", e.rateText)
                    put("totalPrice", e.totalPrice)
                }
                arr.put(obj)
            }
            root.put(dateKey, arr)
        }
        prefs.edit().putString("kroy_khata_db", root.toString()).apply()
    }

    private fun serializeKachaItems(items: List<KachaItem>): JSONArray {
        val arr = JSONArray()
        items.forEach { item ->
            val obj = JSONObject().apply {
                put("id", item.id)
                put("kuri", item.kuri)
                put("gha", item.gha)
                put("ti", item.ti)
                put("totalTi", item.totalTi)
                put("totalKuri", item.totalKuri)
                put("rate", item.rate)
                put("ghaRate", item.ghaRate)
                put("totalPrice", item.totalPrice)
                put("qtyString", item.qtyString)
            }
            arr.put(obj)
        }
        return arr
    }

    private fun parseKachaItems(json: String): List<KachaItem> {
        return try {
            val arr = JSONArray(json)
            val list = mutableListOf<KachaItem>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(
                    KachaItem(
                        id = obj.optLong("id", System.currentTimeMillis() + i),
                        kuri = obj.optDouble("kuri", 0.0),
                        gha = obj.optDouble("gha", 0.0),
                        ti = obj.optDouble("ti", 0.0),
                        totalTi = obj.optDouble("totalTi", 0.0),
                        totalKuri = obj.optDouble("totalKuri", 0.0),
                        rate = obj.optDouble("rate", 0.0),
                        ghaRate = obj.optDouble("ghaRate", 0.0),
                        totalPrice = obj.optDouble("totalPrice", 0.0),
                        qtyString = obj.optString("qtyString", "")
                    )
                )
            }
            list
        } catch (_: Exception) {
            emptyList()
        }
    }
}
