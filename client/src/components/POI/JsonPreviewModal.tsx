import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download } from "lucide-react";
import type { Poi } from "@/types/poi";

interface JsonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pois: Poi[];
}

export default function JsonPreviewModal({ isOpen, onClose, pois }: JsonPreviewModalProps) {
  const { toast } = useToast();

  const formatPoisForExport = (pois: Poi[]) => {
    return pois.map(poi => ({
      id: `poi-${poi.id}`,
      type: poi.type,
      name: poi.name,
      description: poi.description,
      location: {
        lat: parseFloat(poi.latitude),
        lng: parseFloat(poi.longitude)
      },
      created_at: poi.createdAt,
      updated_at: poi.updatedAt
    }));
  };

  const jsonString = JSON.stringify(formatPoisForExport(pois), null, 2);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      toast({
        title: "Success",
        description: "JSON copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy JSON to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
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
      description: "JSON file downloaded",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            JSON Export Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="bg-gray-900 rounded-lg p-4 h-full overflow-auto">
            <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
              {jsonString}
            </pre>
          </div>
        </div>
        
        <div className="flex space-x-3 pt-4 border-t">
          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
