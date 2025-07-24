import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { MapPin, Settings, Plus, User as UserIcon, LogOut, Download, Filter, Trash2, Edit3, Cloud } from "lucide-react";
import POIModal from "@/components/POI/POIModal";
import SettingsPanel from "@/components/POI/SettingsPanel";

declare global {
  interface Window {
    L: any;
    editPOI: (id: number) => void;
    deletePOI: (id: number) => void;
  }
}

type UserType = User & { role: string };

interface Poi {
  id: number;
  name: string;
  description: string | null;
  type: string;
  latitude: string;
  longitude: string;
  createdBy: string;
  createdAt: string;
}

export default function SimpleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showPOIModal, setShowPOIModal] = useState(false);
  const [editingPOI, setEditingPOI] = useState<Poi | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(["Restroom", "Water Fountain", "Food Stop", "Fuel Station", "Meeting Point"])
  );

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch POIs
  const { data: pois = [], isLoading } = useQuery<Poi[]>({
    queryKey: ["/api/pois"],
    retry: false,
  });

  // Create POI mutation
  const createPOIMutation = useMutation({
    mutationFn: async (poiData: any) => {
      const response = await apiRequest("POST", "/api/pois", poiData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pois"] });
      setShowPOIModal(false);
      setSelectedLocation(null);
      toast({
        title: "Success",
        description: "POI created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create POI",
        variant: "destructive",
      });
    },
  });

  // Update POI mutation
  const updatePOIMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/pois/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pois"] });
      setShowPOIModal(false);
      setEditingPOI(null);
      toast({
        title: "Success",
        description: "POI updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update POI",
        variant: "destructive",
      });
    },
  });

  // Delete POI mutation
  const deletePOIMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pois/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pois"] });
      toast({
        title: "Success",
        description: "POI deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete POI",
        variant: "destructive",
      });
    },
  });

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

    // Add click handler for adding POIs
    map.on("click", (e: any) => {
      const currentUser = user as UserType;
      if (currentUser && currentUser.role !== "Viewer") {
        setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setShowPOIModal(true);
      }
    });

    mapInstanceRef.current = map;

    // Global functions for popup buttons
    window.editPOI = (id: number) => {
      const poi = pois.find(p => p.id === id);
      if (poi) {
        setEditingPOI(poi);
        setShowPOIModal(true);
      }
    };

    window.deletePOI = (id: number) => {
      if (confirm("Are you sure you want to delete this POI?")) {
        deletePOIMutation.mutate(id);
      }
    };

    // Force resize after a short delay
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
  };

  // Update markers when POIs change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !pois) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current.clear();

    // Add new markers
    pois.forEach((poi: Poi) => {
      if (!visibleCategories.has(poi.type)) return;

      const categoryColors = {
        "Restroom": "#1976D2",
        "Water Fountain": "#0288D1",
        "Food Stop": "#388E3C",
        "Fuel Station": "#F57C00",
        "Meeting Point": "#7B1FA2"
      };

      const marker = window.L.circleMarker([parseFloat(poi.latitude), parseFloat(poi.longitude)], {
        color: "#ffffff",
        fillColor: categoryColors[poi.type as keyof typeof categoryColors] || "#666666",
        fillOpacity: 0.8,
        radius: 8,
        weight: 2
      }).addTo(mapInstanceRef.current);

      const currentUser = user as UserType;
      const canEdit = currentUser && currentUser.role !== "Viewer" && 
        (currentUser.role === "Admin" || poi.createdBy === currentUser.id);

      const popupContent = `
        <div class="p-3 min-w-[200px]">
          <h4 class="font-semibold text-gray-900 mb-2">${poi.name}</h4>
          <p class="text-sm text-gray-600 mb-3">${poi.description || 'No description'}</p>
          <div class="flex items-center space-x-2 mb-3">
            <span class="inline-block w-3 h-3 rounded-full" style="background-color: ${categoryColors[poi.type as keyof typeof categoryColors]}"></span>
            <span class="text-xs font-medium text-gray-700">${poi.type}</span>
          </div>
          ${canEdit ? `
            <div class="flex space-x-2">
              <button onclick="window.editPOI(${poi.id})" class="text-xs px-3 py-1 bg-primary text-white rounded hover:bg-blue-700 transition-colors">
                Edit
              </button>
              <button onclick="window.deletePOI(${poi.id})" class="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.set(poi.id, marker);
    });
  }, [pois, visibleCategories, user]);

  const handleAddPOI = () => {
    const currentUser = user as UserType;
    if (!currentUser || currentUser.role === "Viewer") {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to add POIs",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Select Location",
      description: "Click on the map to select a location for the new POI",
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-primary text-white";
      case "Editor":
        return "bg-green-600 text-white";
      case "Viewer":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
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
      
      {/* Top User Bar */}
      <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">POI Management</h1>
              <p className="text-xs text-gray-600">Click on the map to add POIs</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user && (() => {
              const currentUser = user as UserType;
              return (
                <>
                  <span className={`px-2 py-1 text-xs rounded-md font-medium ${getRoleColor(currentUser.role)}`}>
                    {currentUser.role}
                  </span>
                  <div className="flex items-center space-x-2">
                    {currentUser.profileImageUrl ? (
                      <img 
                        src={currentUser.profileImageUrl} 
                        alt="Profile" 
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {currentUser.firstName && currentUser.lastName ? 
                        `${currentUser.firstName} ${currentUser.lastName}` : 
                        currentUser.email || 'User'
                      }
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="p-1.5 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Add POI Button - Large floating button */}
      <div className="absolute bottom-24 right-6 z-40">
        <Button
          onClick={handleAddPOI}
          size="lg"
          className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-8 h-8" />
        </Button>
      </div>

      {/* Settings Button */}
      <div className="absolute bottom-6 right-6 z-40">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowSettings(!showSettings)}
          className="w-12 h-12 rounded-full shadow-lg bg-white hover:bg-gray-50"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel 
          visibleCategories={visibleCategories}
          setVisibleCategories={setVisibleCategories}
          pois={pois}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* POI Modal */}
      {showPOIModal && (
        <POIModal
          isOpen={showPOIModal}
          onClose={() => {
            setShowPOIModal(false);
            setSelectedLocation(null);
            setEditingPOI(null);
          }}
          selectedLocation={selectedLocation}
          editingPOI={editingPOI}
          onSubmit={(data) => {
            if (editingPOI) {
              updatePOIMutation.mutate({ id: editingPOI.id, data });
            } else {
              createPOIMutation.mutate(data);
            }
          }}
          isSubmitting={createPOIMutation.isPending || updatePOIMutation.isPending}
        />
      )}
    </div>
  );
}