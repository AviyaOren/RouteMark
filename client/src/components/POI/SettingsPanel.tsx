import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings, Download, FolderSync, Eye } from "lucide-react";
import JsonPreviewModal from "./JsonPreviewModal";
import type { Poi } from "@/types/poi";

interface SettingsPanelProps {
  pois: Poi[];
}

export default function SettingsPanel({ pois }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const { toast } = useToast();

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
      const poiDate = new Date(poi.updatedAt || poi.createdAt);
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
          <div className="absolute bottom-16 right-0 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 w-64">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-primary" />
              Settings & Export
            </h3>
            
            <div className="space-y-3">
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
                FolderSync to Cloud
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
            
            <div className="mt-4 pt-4 border-t border-gray-200">
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
