import axios from "axios";

export async function fetchNearbyHospitals(location) {
  const { lat, lng } = location;

  try {
    const query = `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:10000,${lat},${lng});
);
out body;
`;

    const response = await axios.post(
      "https://overpass-api.de/api/interpreter",
      query.trim(),
      {
        headers: {
          "Content-Type": "text/plain",
          "Accept": "application/json",
        },
        timeout: 10000,
      }
    );

    const elements = (response.data.elements || [])

      // 🚫 STRONG FILTER (removes maternity, clinic, etc.)
      .filter((el) => {
        const name = (el.tags?.name || "").toLowerCase();

        return !(
          name.includes("maternity") ||
          name.includes("clinic") ||
          name.includes("nursing") ||
          name.includes("dental") ||
          name.includes("child") ||
          name.includes("women") ||
          el.tags?.healthcare === "maternity"
        );
      })

      // ✅ MAP + SIZE SCORING
      .map((el) => {
        const name = el.tags?.name || "Nearby Hospital";
        const isNamed = !!el.tags?.name;
        const isEmergency = el.tags?.emergency === "yes";
        const tagCount = Object.keys(el.tags || {}).length;

        // 🔥 SIZE SCORE (bigger hospital = higher score)
        const sizeScore =
          (isNamed ? 0.4 : 0.1) +
          (isEmergency ? 0.4 : 0.1) +
          (tagCount > 5 ? 0.2 : 0.1);

        return {
          id: el.id,
          name,
          lat: el.lat,
          lng: el.lon,
          address:
            el.tags?.["addr:full"] ||
            el.tags?.["addr:street"] ||
            "Near your location",

          // 🏥 simulate bigger hospitals
          availableBeds: 20 + Math.floor(sizeScore * 30),
          icuBeds: 5 + Math.floor(sizeScore * 10),
          specialistsOnDuty: ["general"],
          emergencyReadiness: 0.6 + sizeScore,

          sizeScore, // 🔥 key field
        };
      })

      // 🔝 PRIORITIZE BIG HOSPITALS FIRST
      .sort((a, b) => (b.sizeScore || 0) - (a.sizeScore || 0))

      // limit results
      .slice(0, 10);

    // 🧪 DEBUG (check selected hospitals)
    console.log("🏥 Final hospitals:", elements.map(h => h.name));

    return elements;

  } catch (error) {
    console.error(
      "❌ OSM fetch error:",
      error.response?.data || error.message
    );
    return [];
  }
} 