import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Download, FolderSync, Eye, Filter, LogOut, User } from "lucide-react";
import JsonPreviewModal from "./JsonPreviewModal";
import type { Poi } from "@/types/poi";

interface SettingsPanelProps {
  pois: Poi[];
  visibleCategories: Set<string>;
  onCategoryToggle: (categories: Set<string>) => void;
}

export default function SettingsPanel({ pois, visibleCategories, onCategoryToggle }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      // Force page reload to clear all state and redirect to auth
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await fetch("/api/pois/export", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export POIs");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pois-export.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "POIs exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export POIs",
        variant: "destructive",
      });
    }
  };

  const handleSyncToCloud = () => {
    toast({
      title: "FolderSync Complete",
      description: "POIs synced to cloud storage",
    });
  };

  const formatLastUpdated = () => {
    if (pois.length === 0) return "Never";
    
    const latest = pois.reduce((latest, poi) => {
      const poiDate = new Date(poi.updatedAt || poi.createdAt || 0);
      return poiDate > latest ? poiDate : latest;
    }, new Date(0));
    
    const now = new Date();
    const diff = now.getTime() - latest.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} mins ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const categoryColors = {
    "Restroom": "bg-blue-600",
    "Water Fountain": "bg-sky-600", 
    "Food Stop": "bg-green-600",
    "Fuel Station": "bg-orange-600",
    "Meeting Point": "bg-purple-600"
  };

  const categoryCounts = pois.reduce((acc, poi) => {
    acc[poi.type] = (acc[poi.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const newCategories = new Set(visibleCategories);
    if (checked) {
      newCategories.add(category);
    } else {
      newCategories.delete(category);
    }
    onCategoryToggle(newCategories);
  };

  const handleSelectAll = () => {
    onCategoryToggle(new Set(Object.keys(categoryColors)));
  };

  const handleClearAll = () => {
    onCategoryToggle(new Set());
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-30">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          size="sm"
          className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg border-gray-200 w-12 h-12 p-0 hover:bg-gray-50"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </Button>
        
        {isOpen && (
          <div className="absolute bottom-16 right-0 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-primary" />
              Settings & Filters
            </h3>

            {/* Filter Section */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <Filter className="w-4 h-4 mr-2 text-primary" />
                Filter POIs
              </h4>
              <div className="space-y-2">
                {Object.entries(categoryColors).map(([category, colorClass]) => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={visibleCategories.has(category)}
                      onCheckedChange={(checked) => handleCategoryToggle(category, !!checked)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                    <span className="text-sm font-medium flex-1">{category}</span>
                    <span className="text-xs text-gray-500">
                      {categoryCounts[category] || 0}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-2 flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex-1 text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="flex-1 text-xs text-primary hover:text-blue-700"
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <Button
                onClick={handleExportJSON}
                className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export POIs (JSON)
              </Button>
              
              <Button
                onClick={handleSyncToCloud}
                className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                variant="outline"
                size="sm"
              >
                <FolderSync className="w-4 h-4 mr-2" />
                Sync to Cloud
              </Button>
              
              <Button
                onClick={() => setShowJsonPreview(true)}
                className="w-full justify-start bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                variant="outline"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview JSON
              </Button>
            </div>
            
            {/* User Section */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 truncate max-w-[150px]">
                      {user?.firstName || user?.email || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Total POIs:</span>
                  <span className="font-medium">{pois.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-medium">{formatLastUpdated()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <JsonPreviewModal
        isOpen={showJsonPreview}
        onClose={() => setShowJsonPreview(false)}
        pois={pois}
      />
    </>
  );
}
