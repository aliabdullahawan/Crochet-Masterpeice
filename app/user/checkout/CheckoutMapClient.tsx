"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { LatLngLiteral } from "leaflet";

const MapClickHandler = ({ onSelect }: { onSelect: (coords: LatLngLiteral) => void }) => {
  useMapEvents({
    click: (event) => onSelect(event.latlng),
  });
  return null;
};

const MapViewUpdater = ({ center }: { center: LatLngLiteral }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export default function CheckoutMapClient({
  defaultCenter,
  markerPosition,
  onSelect,
}: {
  defaultCenter: LatLngLiteral;
  markerPosition: LatLngLiteral | null;
  onSelect: (coords: LatLngLiteral) => void;
}) {
  useEffect(() => {
    void import("leaflet").then((L) => {
      const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
      const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
      const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
      const DefaultIcon = L.Icon.Default as unknown as { mergeOptions: (opts: Record<string, string>) => void };
      DefaultIcon.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
    }).catch(() => {
      // Map still works without custom marker icons.
    });
  }, []);

  const center = markerPosition ?? defaultCenter;
  const zoom = markerPosition ? 15 : 11;

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewUpdater center={center} />
      <MapClickHandler onSelect={onSelect} />
      {markerPosition && <Marker position={markerPosition} />}
    </MapContainer>
  );
}
