import { literalT } from "../../i18n/runtimeTamil";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { T } from "../../constants/theme";

const DEFAULT_PLACE = {
  name: "Chennai",
  admin1: "Tamil Nadu",
  country: "India",
  latitude: 13.0878,
  longitude: 80.2785,
};

const WEATHER_CODE = {
  0: ["Clear sky", "weather-sunny", "#f59e0b"],
  1: ["Mainly clear", "weather-sunny", "#f59e0b"],
  2: ["Partly cloudy", "weather-partly-cloudy", "#3b82f6"],
  3: ["Overcast", "weather-cloudy", "#64748b"],
  45: ["Fog", "weather-fog", "#64748b"],
  48: ["Rime fog", "weather-fog", "#64748b"],
  51: ["Light drizzle", "weather-rainy", "#0ea5e9"],
  53: ["Drizzle", "weather-rainy", "#0ea5e9"],
  55: ["Heavy drizzle", "weather-pouring", "#0284c7"],
  61: ["Light rain", "weather-rainy", "#0ea5e9"],
  63: ["Rain", "weather-pouring", "#0284c7"],
  65: ["Heavy rain", "weather-pouring", "#0369a1"],
  71: ["Light snow", "weather-snowy", "#60a5fa"],
  73: ["Snow", "weather-snowy-heavy", "#3b82f6"],
  75: ["Heavy snow", "weather-snowy-heavy", "#2563eb"],
  80: ["Rain showers", "weather-partly-rainy", "#0ea5e9"],
  81: ["Showers", "weather-partly-rainy", "#0284c7"],
  82: ["Heavy showers", "weather-pouring", "#0369a1"],
  95: ["Thunderstorm", "weather-lightning-rainy", "#7c3aed"],
  96: ["Storm with hail", "weather-lightning-rainy", "#7c3aed"],
  99: ["Severe storm", "weather-lightning-rainy", "#6d28d9"],
};

const POPULAR_PLACES = [
  DEFAULT_PLACE,
  { name: "Coimbatore", admin1: "Tamil Nadu", country: "India", latitude: 11.0168, longitude: 76.9558 },
  { name: "Madurai", admin1: "Tamil Nadu", country: "India", latitude: 9.9252, longitude: 78.1198 },
  { name: "Tiruchirappalli", admin1: "Tamil Nadu", country: "India", latitude: 10.7905, longitude: 78.7047 },
  { name: "Salem", admin1: "Tamil Nadu", country: "India", latitude: 11.6643, longitude: 78.146 },
];

const getWeatherMeta = (code) => WEATHER_CODE[code] || ["Weather update", "weather-cloudy-clock", T.maroon];
const placeLabel = (place) => [place?.name, place?.admin1, place?.country].filter(Boolean).join(", ");
const kmhToMs = (value) => (value == null ? null : Math.round((Number(value) / 3.6) * 10) / 10);
const timeText = (iso) => {
  if (!iso) return "--";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

function MetricCard({ icon, label, value, color = T.maroon }) {
  return (
    <View style={s.metricCard}>
      <View style={[s.metricIcon, { backgroundColor: color + "16" }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
    </View>
  );
}

function ForecastDay({ item }) {
  const [label, icon, color] = getWeatherMeta(item.weathercode);
  const day = new Date(item.time).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
  return (
    <View style={s.dayCard}>
      <Text style={s.dayName}>{day}</Text>
      <Icon name={icon} size={26} color={color} />
      <Text style={s.dayTemp}>{Math.round(item.temperature_2m_max)}{'\u00B0'} / {Math.round(item.temperature_2m_min)}{'\u00B0'}</Text>
      <Text style={s.dayDesc} numberOfLines={1}>{label}</Text>
      <Text style={s.dayRain}>{item.precipitation_probability_max ?? 0}% rain</Text>
    </View>
  );
}

export default function WeatherScreen({ navigation, route }) {
  const initialPlace = route?.params?.place || null;
  const [place, setPlace] = useState(initialPlace || DEFAULT_PLACE);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const current = weather?.current_weather;
  const currentMeta = useMemo(() => getWeatherMeta(current?.weathercode), [current?.weathercode]);
  const hourlyNowIndex = useMemo(() => {
    const hours = weather?.hourly?.time || [];
    if (!hours.length) return 0;
    const now = Date.now();
    let best = 0;
    hours.forEach((h, index) => {
      if (Math.abs(new Date(h).getTime() - now) < Math.abs(new Date(hours[best]).getTime() - now)) best = index;
    });
    return best;
  }, [weather]);

  const loadWeather = useCallback(async (targetPlace = place) => {
    setError("");
    const params = new URLSearchParams({
      latitude: String(targetPlace.latitude),
      longitude: String(targetPlace.longitude),
      current_weather: "true",
      hourly: "temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,visibility,uv_index",
      daily: "weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max",
      timezone: "auto",
      forecast_days: "7",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!res.ok) throw new Error("Weather service unavailable");
    const data = await res.json();
    setWeather(data);
    setPlace(targetPlace);
  }, [place]);

  useEffect(() => {
    loadWeather(place).catch((err) => setError(err.message || "Unable to load weather")).finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadWeather(place);
    } catch (err) {
      setError(err.message || "Unable to refresh weather");
    } finally {
      setRefreshing(false);
    }
  };

  const searchPlaces = async () => {
    const text = query.trim();
    if (text.length < 2) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ name: text, count: "8", language: "en", format: "json" });
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
      const data = await res.json();
      setSuggestions(data.results || []);
    } catch {
      Alert.alert("Search failed", "Please check your internet connection and try again.");
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location permission needed", "Allow location access to show nearby weather.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nearby = await Location.reverseGeocodeAsync(position.coords).catch(() => []);
      const first = nearby?.[0] || {};
      await loadWeather({
        name: first.city || first.district || "Current location",
        admin1: first.region,
        country: first.country,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setSuggestions([]);
      setQuery("");
    } catch {
      Alert.alert("Location failed", "Could not read your current location.");
    } finally {
      setLoading(false);
    }
  };

  const daily = (weather?.daily?.time || []).map((time, index) => ({
    time,
    weathercode: weather.daily.weathercode?.[index],
    temperature_2m_max: weather.daily.temperature_2m_max?.[index],
    temperature_2m_min: weather.daily.temperature_2m_min?.[index],
    precipitation_probability_max: weather.daily.precipitation_probability_max?.[index],
    uv_index_max: weather.daily.uv_index_max?.[index],
    sunrise: weather.daily.sunrise?.[index],
    sunset: weather.daily.sunset?.[index],
  }));

  if (loading && !weather) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={T.maroon} size="large" />
        <Text style={s.loadingText}>{literalT("Loading live weather...")}</Text>
      </View>
    );
  }

  const humidity = weather?.hourly?.relativehumidity_2m?.[hourlyNowIndex];
  const feels = weather?.hourly?.apparent_temperature?.[hourlyNowIndex];
  const rain = weather?.hourly?.precipitation_probability?.[hourlyNowIndex];
  const visibility = weather?.hourly?.visibility?.[hourlyNowIndex];
  const uv = weather?.hourly?.uv_index?.[hourlyNowIndex];

  return (
    <View style={s.root}>
      <StatusBar backgroundColor="#0f766e" barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f766e" colors={["#0f766e"]} />}>
        <LinearGradient colors={["#0f766e", "#0891b2", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroTop}>
            <TouchableOpacity style={s.circleBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.locationBtn} onPress={useCurrentLocation} activeOpacity={0.82}>
              <Icon name="crosshairs-gps" size={18} color="#fff" />
              <Text style={s.locationBtnTxt}>{literalT("Use my location")}</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.heroKicker}>{literalT("Live Weather")}</Text>
          <Text style={s.placeName} numberOfLines={2}>{placeLabel(place)}</Text>
          <View style={s.currentRow}>
            <Icon name={currentMeta[1]} size={70} color="#fff" />
            <View style={s.tempWrap}>
              <Text style={s.temp}>{current?.temperature != null ? Math.round(current.temperature) : "--"}{'\u00B0'}</Text>
              <Text style={s.condition}>{currentMeta[0]}</Text>
            </View>
          </View>
          <View style={s.heroFacts}>
            <Text style={s.heroFact}>Wind {current?.windspeed ?? "--"} km/h</Text>
            <Text style={s.heroFact}>Updated {timeText(current?.time)}</Text>
          </View>
        </LinearGradient>

        <View style={s.searchCard}>
          <View style={s.searchRow}>
            <Icon name="magnify" size={22} color={T.textM} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search city, district, or area"
              placeholderTextColor="#94a3b8"
              style={s.searchInput}
              returnKeyType="search"
              onSubmitEditing={searchPlaces}
            />
            <TouchableOpacity style={s.searchBtn} onPress={searchPlaces} activeOpacity={0.82}>
              {searching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.searchBtnTxt}>Search</Text>}
            </TouchableOpacity>
          </View>
          {suggestions.length > 0 && (
            <View style={s.suggestions}>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={`${item.id}-${item.latitude}`}
                  style={s.suggestionItem}
                  onPress={() => {
                    loadWeather(item).catch(() => setError("Unable to load selected area"));
                    setSuggestions([]);
                    setQuery("");
                  }}>
                  <Icon name="map-marker-outline" size={18} color="#0f766e" />
                  <Text style={s.suggestionText} numberOfLines={1}>{placeLabel(item)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {!!error && <Text style={s.errorText}>{error}</Text>}

        <View style={s.popularRow}>
          {POPULAR_PLACES.map((p) => (
            <TouchableOpacity key={p.name} style={s.popularChip} onPress={() => loadWeather(p)} activeOpacity={0.8}>
              <Text style={s.popularTxt}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.metricsGrid}>
          <MetricCard icon="thermometer-lines" label="Feels like" value={`${Math.round(feels ?? current?.temperature ?? 0)}\u00B0`} color="#ef4444" />
          <MetricCard icon="water-percent" label="Humidity" value={`${humidity ?? "--"}%`} color="#0ea5e9" />
          <MetricCard icon="weather-pouring" label="Rain chance" value={`${rain ?? "--"}%`} color="#2563eb" />
          <MetricCard icon="weather-windy" label="Wind" value={`${kmhToMs(current?.windspeed) ?? "--"} m/s`} color="#64748b" />
          <MetricCard icon="eye-outline" label="Visibility" value={visibility ? `${Math.round(visibility / 1000)} km` : "--"} color="#16a34a" />
          <MetricCard icon="white-balance-sunny" label="UV index" value={uv != null ? Math.round(uv) : "--"} color="#f59e0b" />
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{literalT("7-Day Forecast")}</Text>
            <Text style={s.sectionSub}>Open-Meteo live data</Text>
          </View>
          <FlatList
            horizontal
            data={daily}
            keyExtractor={(item) => item.time}
            renderItem={({ item }) => <ForecastDay item={item} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dayList}
          />
        </View>

        <View style={s.sunCard}>
          <View style={s.sunItem}>
            <Icon name="weather-sunset-up" size={28} color="#f59e0b" />
            <Text style={s.sunLabel}>Sunrise</Text>
            <Text style={s.sunValue}>{timeText(daily[0]?.sunrise)}</Text>
          </View>
          <View style={s.sunDivider} />
          <View style={s.sunItem}>
            <Icon name="weather-sunset-down" size={28} color="#ef4444" />
            <Text style={s.sunLabel}>Sunset</Text>
            <Text style={s.sunValue}>{timeText(daily[0]?.sunset)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  loadingText: { marginTop: 10, color: T.textM, fontWeight: "700" },
  scrollContent: { paddingBottom: 34 },
  hero: { paddingTop: Platform.OS === "ios" ? 54 : 42, paddingHorizontal: 18, paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  circleBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  locationBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  locationBtnTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },
  heroKicker: { color: "rgba(255,255,255,0.72)", fontSize: 13, fontWeight: "800", textTransform: "uppercase" },
  placeName: { color: "#fff", fontSize: 26, lineHeight: 32, fontWeight: "900", marginTop: 4 },
  currentRow: { flexDirection: "row", alignItems: "center", marginTop: 22, gap: 18 },
  tempWrap: { flex: 1 },
  temp: { color: "#fff", fontSize: 54, lineHeight: 58, fontWeight: "900" },
  condition: { color: "rgba(255,255,255,0.86)", fontSize: 16, fontWeight: "800" },
  heroFacts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  heroFact: { color: "#fff", backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, overflow: "hidden", fontSize: 12, fontWeight: "800" },
  searchCard: { marginHorizontal: 16, marginTop: -18, backgroundColor: "#fff", borderRadius: 18, padding: 10, borderWidth: 1, borderColor: "#e2e8f0", elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: { flex: 1, minHeight: 42, color: T.text, fontSize: 14, fontWeight: "700" },
  searchBtn: { width: 78, height: 38, borderRadius: 12, backgroundColor: "#0f766e", alignItems: "center", justifyContent: "center" },
  searchBtnTxt: { color: "#fff", fontSize: 12, fontWeight: "900" },
  suggestions: { borderTopWidth: 1, borderTopColor: "#e2e8f0", marginTop: 8, paddingTop: 6 },
  suggestionItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  suggestionText: { flex: 1, color: T.text, fontSize: 13, fontWeight: "700" },
  errorText: { color: "#b91c1c", marginHorizontal: 18, marginTop: 12, fontSize: 12, fontWeight: "700" },
  popularRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  popularChip: { backgroundColor: "#ecfeff", borderColor: "#a5f3fc", borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  popularTxt: { color: "#0f766e", fontSize: 12, fontWeight: "900" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, paddingTop: 18 },
  metricCard: { width: "48%", backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e2e8f0", elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  metricIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  metricLabel: { color: T.textM, fontSize: 12, fontWeight: "800" },
  metricValue: { color: T.text, fontSize: 20, fontWeight: "900", marginTop: 2 },
  section: { paddingTop: 22 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { color: T.text, fontSize: 18, fontWeight: "900" },
  sectionSub: { color: T.textM, fontSize: 11, fontWeight: "700" },
  dayList: { paddingHorizontal: 16, gap: 10 },
  dayCard: { width: 124, backgroundColor: "#fff", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  dayName: { color: T.text, fontSize: 13, fontWeight: "900", marginBottom: 10 },
  dayTemp: { color: T.text, fontSize: 14, fontWeight: "900", marginTop: 8 },
  dayDesc: { color: T.textM, fontSize: 11, fontWeight: "700", marginTop: 2 },
  dayRain: { color: "#0f766e", fontSize: 11, fontWeight: "900", marginTop: 8 },
  sunCard: { flexDirection: "row", marginHorizontal: 16, marginTop: 20, backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#e2e8f0", elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  sunItem: { flex: 1, alignItems: "center" },
  sunDivider: { width: 1, backgroundColor: "#e2e8f0", marginHorizontal: 12 },
  sunLabel: { color: T.textM, fontSize: 12, fontWeight: "800", marginTop: 8 },
  sunValue: { color: T.text, fontSize: 17, fontWeight: "900", marginTop: 3 },
});
