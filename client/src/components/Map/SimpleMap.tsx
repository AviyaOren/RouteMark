import { useEffect, useRef } from "react";

declare global {
  interface Window {
    L: any;
  }
}

export default function SimpleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet dynamically
    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        initializeMap();
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Fix for default markers
    delete (window.L.Icon.Default.prototype as any)._getIconUrl;
    window.L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const map = window.L.map(mapRef.current, {
      center: [52.5200, 13.4050],
      zoom: 13,
      zoomControl: true
    });
    
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add a test marker
    window.L.marker([52.5200, 13.4050])
      .addTo(map)
      .bindPopup('Test marker - Map is working!')
      .openPopup();

    mapInstanceRef.current = map;

    // Force resize after a short delay
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
  };

  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1
    }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f0f0'
        }}
      />
      
      {/* Simple overlay to test visibility */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        padding: '10px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '5px',
        zIndex: 1000
      }}>
        <h3>POI Management - Test Map</h3>
        <p>If you can see this and the map, it's working!</p>
      </div>
    </div>
  );
}