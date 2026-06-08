// Utility function to get province/state from coordinates using OpenStreetMap's Nominatim API
const USER_AGENT = 'SpidHive-Platform/1.0 (Contact: admin@spidhive.com)';
async function getProvinceFromCoords(coordinateString) {
  if (!coordinateString) return "Unknown Location";
  const cleanCoords = coordinateString.replace(/[() ]/g, '');
  const [lat, lon] = cleanCoords.split(',');

  if (!lat || !lon) return "Unknown Location";

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.trim()}&lon=${lon.trim()}`, {
      headers: { 'User-Agent': USER_AGENT }
    });
    const data = await response.json();
    if (data && data.address) {
      const locationName = data.address.province || data.address.state || data.address.region || data.address.city;     
			console.log(`Geocoding success: (${lat.trim()}, ${lon.trim()}) -> ${locationName}`); 
      return locationName || "Unknown Location";
    }
		
    
    return "Unknown Location";

  } catch (error) {
    console.error("Geocoding failed:", error);
    return "Unknown Location";
  }
}

module.exports = { getProvinceFromCoords };