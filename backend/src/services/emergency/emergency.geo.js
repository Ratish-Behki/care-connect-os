function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function roundTo(value, digits = 1) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getDistanceKm(origin, destination) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(destination.lat - origin.lat);
  const longitudeDelta = toRadians(destination.lng - origin.lng);
  const startLatitude = toRadians(origin.lat);
  const endLatitude = toRadians(destination.lat);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(startLatitude) * Math.cos(endLatitude) *
    Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function buildOSMMapUrlForLocation(location, zoom = 16) {
  return `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=${zoom}/${location.lat}/${location.lng}`;
}

export function buildOSMSearchUrl(place) {
  const query = encodeURIComponent(`${place.name} ${place.address || ""}`.trim());
  return `https://www.openstreetmap.org/search?query=${query}`;
}

export function buildOSMDirectionsUrl(origin, destination) {
  return `https://www.openstreetmap.org/directions?from=${origin.lat},${origin.lng}&to=${destination.lat},${destination.lng}`;
}

export function buildPatientLocationMapsUrl(location) {
  return buildOSMMapUrlForLocation(location, 18);
}

export function estimateTravelMinutes(distanceKm, trafficMultiplier = 1) {
  return Math.max(4, Math.round(distanceKm * 2.6 * trafficMultiplier) + 3);
}

export function getTrafficMultiplier(location) {
  const hour = new Date().getHours();
  const rushHour = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
  const cityCenterBias = Math.abs(location.lat - 28.6139) < 0.12 && Math.abs(location.lng - 77.209) < 0.14;

  if (rushHour && cityCenterBias) {
    return 1.45;
  }

  if (rushHour) {
    return 1.25;
  }

  return 1;
}
