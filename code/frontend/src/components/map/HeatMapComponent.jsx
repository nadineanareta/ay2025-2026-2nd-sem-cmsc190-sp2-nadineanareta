import React, { useRef, useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { HeatmapLayerFactory } from "@vgrid/react-leaflet-heatmap-layer";
import L from "leaflet";
import { Icon } from "@iconify/react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HeatmapLayer = HeatmapLayerFactory();

const HeatMapComponent = ({ dataPoints, findUserLocation = false }) => {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showToast, setShowToast] = useState(true);

  // Define bounds for the Philippines
  const southWest = [4.64, 116.91];
  const northEast = [21.12, 127.34];
  const bounds = [southWest, northEast];

  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setLocationError(null);
          setShowToast(false);

          // Fly to user's location if map is available
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 13);
          }
        },
        (error) => {
          setLocationError(
            "Your browser not have permission to use your location."
          );
          console.error("Error getting location:", error);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  };

  const locationIcon = new L.Icon({
    iconUrl: "/images/mdi--location.png",
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [1, -34],
  });

  useEffect(() => {
    if (findUserLocation) {
      locateUser();
    } else {
      setShowToast(false);
      setUserLocation(null);
      setLocationError(null);
    }
  }, [findUserLocation]);

  //This is for showing the toast when there is a location error and
  //the user has opted to share their location
  useEffect(() => {
    if (locationError && findUserLocation) {
      setShowToast(true);
    }
  }, [locationError, findUserLocation]);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={[12.8797, 121.774]}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        maxBounds={bounds} // Restrict map view to the Philippines bounds
        maxBoundsViscosity={1.0} // Elastic dragging within bounds
      >
        <HeatmapLayer
          points={dataPoints}
          longitudeExtractor={(m) => {
            var item_latitude = 0.0;
            var item_longitude = 0.0;
            if (m.cropdex_image_datum.coordinates) {
              let substring = m.cropdex_image_datum.coordinates.replace(
                "(",
                ""
              );
              substring = substring.replace(")", "");
              let split_string = substring.split(",");
              item_latitude = parseFloat(split_string[0]);
              item_longitude = parseFloat(split_string[1]);
              if (isNaN(item_latitude) || isNaN(item_longitude)) {
                item_latitude = 0.0;
                item_longitude = 0.0;
              }
            }
            return item_longitude;
          }}
          latitudeExtractor={(m) => {
            var item_latitude = 0.0;
            var item_longitude = 0.0;
            if (m.cropdex_image_datum.coordinates) {
              let substring = m.cropdex_image_datum.coordinates.replace(
                "(",
                ""
              );
              substring = substring.replace(")", "");
              let split_string = substring.split(",");
              item_latitude = parseFloat(split_string[0]);
              item_longitude = parseFloat(split_string[1]);
              if (isNaN(item_latitude) || isNaN(item_longitude)) {
                item_latitude = 0.0;
                item_longitude = 0.0;
              }
            }
            return item_latitude;
          }}
          intensityExtractor={(m) => 1}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Show user location marker if available */}
        {userLocation && (
          <Marker position={userLocation} icon={locationIcon}>
            <Popup>Your current location</Popup>
          </Marker>
        )}
      </MapContainer>
      {/* Location button */}
      {findUserLocation && (
        <button
          onClick={locateUser}
          className="absolute top-24 left-2.5 z-1000 p-2 bg-white border-2 border-black/30 rounded-[4px] cursor-pointer"
          title="Find my location"
        >
          <Icon icon="f7:location-fill" className="size-3.5" />
        </button>
      )}

      {/* Error message */}
      {showToast && locationError && (
        <div className="relative">
          <motion.div
            key="location-error-toast"
            className="absolute bottom-3 left-1/2 translate-x-[-50%] z-1000 rounded-sm bg-spidhive-light-green text-spidhive-white pb-3 pt-4 px-6 select-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              default: { delay: 2, duration: 0.5, ease: "easeInOut" },
            }}
          >
            <X
              onClick={() => setShowToast(false)}
              className="absolute right-2 top-1 size-4 cursor-pointer"
            />
            {locationError}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HeatMapComponent;
