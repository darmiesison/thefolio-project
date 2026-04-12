import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function InteractiveMap() {
  // Shelter locations with coordinates
  const shelters = [
    {
      name: "Happy Paws Shelter",
      address: "123 Cat Street, Sample City",
      latitude: 40.7128,
      longitude: -74.006,
    },
    {
      name: "Feline Friends Center",
      address: "456 Whisker Avenue, Demo Town",
      latitude: 40.758,
      longitude: -73.9855,
    },
  ];

  // Center of map (between the two locations)
  const center = [40.7354, -73.9955];

  return (
    <MapContainer center={center} zoom={12} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {shelters.map((shelter, idx) => (
        <Marker key={idx} position={[shelter.latitude, shelter.longitude]}>
          <Popup>
            <div>
              <h3>{shelter.name}</h3>
              <p>{shelter.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default InteractiveMap;
