import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet.heat/dist/leaflet-heat.js';
import { BookingDTO } from '@/lib/api';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface OrderMapProps {
  bookings: BookingDTO[];
  providerLocation?: { lat: number; lng: number };
  showClustering?: boolean;
  showRouting?: boolean;
  showHeatmap?: boolean;
  onGeofenceAlert?: (bookingId: number, distance: number) => void;
}

interface MapControllerProps {
  bookings: BookingDTO[];
  providerLocation?: { lat: number; lng: number };
  showClustering: boolean;
  showRouting: boolean;
  showHeatmap: boolean;
  onGeofenceAlert?: (bookingId: number, distance: number) => void;
}

const MapController: React.FC<MapControllerProps> = ({
  bookings,
  providerLocation,
  showClustering,
  showRouting,
  showHeatmap,
  onGeofenceAlert
}) => {
  const map = useMap();
  const markerClusterGroupRef = useRef<any>(null);
  const routingControlRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>(null);
  const providerMarkerRef = useRef<L.Marker | null>(null);
  const geofenceCircleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    // Clear existing layers
    if (markerClusterGroupRef.current) {
      map.removeLayer(markerClusterGroupRef.current);
      markerClusterGroupRef.current = null;
    }
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }
    if (providerMarkerRef.current) {
      map.removeLayer(providerMarkerRef.current);
      providerMarkerRef.current = null;
    }
    if (geofenceCircleRef.current) {
      map.removeLayer(geofenceCircleRef.current);
      geofenceCircleRef.current = null;
    }

    const validBookings = bookings.filter(b => b.latitude && b.longitude);

    if (showHeatmap && validBookings.length > 0 && HeatLayer) {
      try {
        // Create heatmap data
        const heatData: [number, number, number][] = validBookings.map(booking => [
          booking.latitude!,
          booking.longitude!,
          booking.totalPrice / 100 // Intensity based on order value
        ]);

        heatmapLayerRef.current = HeatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          max: 1.0,
          gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
        }).addTo(map);
      } catch (error) {
        console.warn('Failed to create heatmap:', error);
      }
    }
      // @ts-ignore - markercluster types
      markerClusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
      });

      validBookings.forEach(booking => {
        const marker = L.marker([booking.latitude!, booking.longitude!])
          .bindPopup(`
            <div>
              <h3>Order #${booking.id}</h3>
              <p><strong>Status:</strong> ${booking.status}</p>
              <p><strong>Total:</strong> ₹${booking.totalPrice}</p>
              <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
            </div>
          `);

        markerClusterGroupRef.current!.addLayer(marker);
      });

      map.addLayer(markerClusterGroupRef.current);
    } else {
      // Regular markers
      validBookings.forEach(booking => {
        L.marker([booking.latitude!, booking.longitude!])
          .addTo(map)
          .bindPopup(`
            <div>
              <h3>Order #${booking.id}</h3>
              <p><strong>Status:</strong> ${booking.status}</p>
              <p><strong>Total:</strong> ₹${booking.totalPrice}</p>
              <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
            </div>
          `);
      });
    }

    // Add provider location marker
    if (providerLocation) {
      providerMarkerRef.current = L.marker([providerLocation.lat, providerLocation.lng], {
        icon: L.divIcon({
          className: 'provider-marker',
          html: '<div style="background-color: green; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      })
        .addTo(map)
        .bindPopup('<div><strong>Your Location</strong></div>');

      // Add geofence circle (500m radius)
      geofenceCircleRef.current = L.circle([providerLocation.lat, providerLocation.lng], {
        color: 'green',
        fillColor: 'green',
        fillOpacity: 0.1,
        radius: 500
      }).addTo(map);

      // Check for geofence alerts
      if (onGeofenceAlert) {
        validBookings.forEach(booking => {
          if (booking.latitude && booking.longitude) {
            const distance = map.distance(
              [providerLocation.lat, providerLocation.lng],
              [booking.latitude, booking.longitude]
            );
            if (distance <= 500) {
              onGeofenceAlert(booking.id, Math.round(distance));
            }
          }
        });
      }
    }

    // Add routing if enabled and we have multiple points
    if (showRouting && validBookings.length > 1 && providerLocation && Routing) {
      try {
        const waypoints = [
          L.latLng(providerLocation.lat, providerLocation.lng),
          ...validBookings.map(b => L.latLng(b.latitude!, b.longitude!))
        ];

        routingControlRef.current = Routing.control({
          waypoints,
          routeWhileDragging: false,
          addWaypoints: false,
          createMarker: () => null, // Don't create default markers
          lineOptions: {
            styles: [{ color: 'blue', weight: 4, opacity: 0.7 }]
          }
        }).addTo(map);
      } catch (error) {
        console.warn('Failed to create routing control:', error);
      }
    }

    // Fit bounds to show all markers
    if (validBookings.length > 0) {
      const group = showClustering && markerClusterGroupRef.current
        ? markerClusterGroupRef.current
        : L.featureGroup(validBookings.map(b =>
            L.marker([b.latitude!, b.longitude!])
          ));

      if (providerLocation) {
        group.addLayer(L.marker([providerLocation.lat, providerLocation.lng]));
      }

      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [bookings, providerLocation, showClustering, showRouting, showHeatmap, map, onGeofenceAlert]);

  return null;
};

export const OrderMap: React.FC<OrderMapProps> = ({
  bookings,
  providerLocation,
  showClustering = false,
  showRouting = false,
  showHeatmap = false,
  onGeofenceAlert
}) => {
  const defaultCenter: [number, number] = [17.3850, 78.4867]; // Hyderabad

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapController
          bookings={bookings}
          providerLocation={providerLocation}
          showClustering={showClustering}
          showRouting={showRouting}
          showHeatmap={showHeatmap}
          onGeofenceAlert={onGeofenceAlert}
        />
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Orders</span>
          </div>
          {providerLocation && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Your Location</span>
            </div>
          )}
          {showHeatmap && (
            <div className="text-xs mt-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-1 bg-blue-500"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-1 bg-red-500"></div>
                <span>High Demand</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
