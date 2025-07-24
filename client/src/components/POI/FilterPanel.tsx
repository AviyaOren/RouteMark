import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import type { Poi } from "@/types/poi";

interface FilterPanelProps {
  pois: Poi[];
  visibleCategories: Set<string>;
  onCategoryToggle: (categories: Set<string>) => void;
}

const categoryColors = {
  "Restroom": "bg-blue-600",
  "Water Fountain": "bg-sky-600",
  "Food Stop": "bg-green-600",
  "Fuel Station": "bg-orange-600",
  "Meeting Point": "bg-purple-600"
};

export default function FilterPanel({ pois, visibleCategories, onCategoryToggle }: FilterPanelProps) {
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

  const handleClearAll = () => {
    onCategoryToggle(new Set());
  };

  const handleSelectAll = () => {
    onCategoryToggle(new Set(Object.keys(categoryColors)));
  };

  return (
    <div className="fixed top-24 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 z-30 p-4 w-64">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <Filter className="w-4 h-4 mr-2 text-primary" />
        Filter POIs
      </h3>
      
      <div className="space-y-3">
        {Object.entries(categoryColors).map(([category, colorClass]) => (
          <label key={category} className="flex items-center space-x-3 cursor-pointer">
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
      
      <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
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
  );
}
