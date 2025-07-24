import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin } from "lucide-react";
import { insertPoiSchema } from "@shared/schema";
import type { Poi } from "@/types/poi";

interface POIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  selectedLocation: { lat: number; lng: number } | null;
  editingPOI: Poi | null;
  isSubmitting: boolean;
}

const poiCategories = [
  "Restroom",
  "Water Fountain", 
  "Food Stop",
  "Fuel Station",
  "Meeting Point"
];

export default function POIModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedLocation, 
  editingPOI,
  isSubmitting 
}: POIModalProps) {
  const form = useForm({
    resolver: zodResolver(insertPoiSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      latitude: "",
      longitude: "",
    },
  });

  // Reset form when modal opens/closes or when editing POI changes
  useEffect(() => {
    if (editingPOI) {
      form.reset({
        name: editingPOI.name,
        type: editingPOI.type,
        description: editingPOI.description || "",
        latitude: editingPOI.latitude,
        longitude: editingPOI.longitude,
      });
    } else if (selectedLocation) {
      form.reset({
        name: "",
        type: "",
        description: "",
        latitude: selectedLocation.lat.toString(),
        longitude: selectedLocation.lng.toString(),
      });
    } else {
      form.reset({
        name: "",
        type: "",
        description: "",
        latitude: "",
        longitude: "",
      });
    }
  }, [editingPOI, selectedLocation, form]);

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  const getLocationDisplay = () => {
    if (editingPOI) {
      return `${parseFloat(editingPOI.latitude).toFixed(6)}, ${parseFloat(editingPOI.longitude).toFixed(6)}`;
    }
    if (selectedLocation) {
      return `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`;
    }
    return "Click on map to select location";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPOI ? "Edit POI" : "Add New POI"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>POI Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Central Park Restroom" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {poiCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional description..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Location</FormLabel>
              <div className="bg-gray-50 p-3 rounded-lg border mt-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{getLocationDisplay()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isSubmitting || (!selectedLocation && !editingPOI)}
              >
                {isSubmitting ? "Saving..." : editingPOI ? "Update POI" : "Save POI"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
