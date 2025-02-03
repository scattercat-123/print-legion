export const getDistance = (coords1: string, coords2: string) => {
  const [lat1_deg, lon1_deg] = coords1.split(",").map(Number);
  const [lat2_deg, lon2_deg] = coords2.split(",").map(Number);

  const lat1 = lat1_deg * (Math.PI / 180);
  const lon1 = lon1_deg * (Math.PI / 180);
  const lat2 = lat2_deg * (Math.PI / 180);
  const lon2 = lon2_deg * (Math.PI / 180);

  const { sin, cos, sqrt, atan2 } = Math;

  const R = 6371;
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = sin(dLat / 2) * sin(dLat / 2) + cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2);
  const c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return R * c;
};

export const getDistanceDecimalDegrees = (coords1: string, coords2: string) => {
  const [lat1_deg, lon1_deg] = coords1.split(",").map(Number);
  const [lat2_deg, lon2_deg] = coords2.split(",").map(Number);

  return Math.sqrt(Math.pow(lat1_deg - lat2_deg, 2) + Math.pow(lon1_deg - lon2_deg, 2));
};
