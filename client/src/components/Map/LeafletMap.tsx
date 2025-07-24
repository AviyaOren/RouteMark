import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, User, LogOut } from "lucide-react";
import SettingsPanel from "@/components/POI/SettingsPanel";
import POIModal from "@/components/POI/POIModal";
import type { Poi } from "@/types/poi";
import type { User as UserType } from "@shared/schema";

// Import Leaflet dynamically to avoid SSR issues
let L: any = null;
let leafletLoaded = false;

const loadLeaflet = async () => {
  if (leafletLoaded || typeof window === "undefined") return;
  
  try {
    const leaflet = await import("leaflet");
    L = leaflet.default;
    leafletLoaded = true;
    
    // Fix for default markers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  } catch (error) {
    console.error("Error loading Leaflet:", error);
  }
};

export default function LeafletMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showPOIModal, setShowPOIModal] = useState(false);
  const [editingPOI, setEditingPOI] = useState<Poi | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(["Restroom", "Water Fountain", "Food Stop", "Fuel Station", "Meeting Point"])
  );
  const [leafletReady, setLeafletReady] = useState(false);

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

  // Load Leaflet
  useEffect(() => {
    loadLeaflet().then(() => {
      setLeafletReady(true);
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !L || !leafletReady || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([52.5200, 13.4050], 13);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
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

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletReady, user]);

  // Update markers when POIs change
  useEffect(() => {
    if (!mapInstanceRef.current || !L || !leafletReady || !pois) return;

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

      const marker = L.circleMarker([parseFloat(poi.latitude), parseFloat(poi.longitude)], {
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
  }, [pois, visibleCategories, user, leafletReady]);

  // Global functions for popup buttons
  useEffect(() => {
    (window as any).editPOI = (id: number) => {
      const poi = pois.find((p: Poi) => p.id === id);
      if (poi) {
        setEditingPOI(poi);
        setShowPOIModal(true);
      }
    };

    (window as any).deletePOI = (id: number) => {
      if (confirm("Are you sure you want to delete this POI?")) {
        deletePOIMutation.mutate(id);
      }
    };

    return () => {
      delete (window as any).editPOI;
      delete (window as any).deletePOI;
    };
  }, [pois, deletePOIMutation]);

  const handleCreatePOI = (poiData: any) => {
    if (!selectedLocation) return;
    
    createPOIMutation.mutate({
      ...poiData,
      latitude: selectedLocation.lat.toString(),
      longitude: selectedLocation.lng.toString(),
    });
  };

  const handleUpdatePOI = (poiData: any) => {
    if (!editingPOI) return;
    
    updatePOIMutation.mutate({
      id: editingPOI.id,
      data: poiData,
    });
  };

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

  if (isLoading || !leafletReady) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
      />
      
      <div className="w-full h-full relative">
        <div ref={mapRef} className="w-full h-full" />
        
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
                          <User className="w-4 h-4 text-gray-600" />
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

        {/* Floating Add POI Button */}
        {user && (user as UserType).role !== "Viewer" && (
          <Button
            onClick={handleAddPOI}
            className="fixed top-24 right-6 w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-all duration-200 z-30 p-0 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Plus className="w-8 h-8" />
          </Button>
        )}

        {/* Settings Panel */}
        <SettingsPanel 
          pois={pois} 
          visibleCategories={visibleCategories}
          onCategoryToggle={setVisibleCategories}
        />

        {/* POI Modal */}
        <POIModal
          isOpen={showPOIModal}
          onClose={() => {
            setShowPOIModal(false);
            setSelectedLocation(null);
            setEditingPOI(null);
          }}
          onSubmit={editingPOI ? handleUpdatePOI : handleCreatePOI}
          selectedLocation={selectedLocation}
          editingPOI={editingPOI}
          isSubmitting={createPOIMutation.isPending || updatePOIMutation.isPending}
        />
      </div>
    </>
  );
}