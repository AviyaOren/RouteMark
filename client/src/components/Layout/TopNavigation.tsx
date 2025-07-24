import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MapPin, User, LogOut } from "lucide-react";

export default function TopNavigation() {
  const { user } = useAuth();

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
    <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">POI Management</h1>
            <p className="text-sm text-gray-600">Logistics Coordination Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
              
              <div className="flex items-center space-x-3">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName && user.lastName ? 
                    `${user.firstName} ${user.lastName}` : 
                    user.email || 'User'
                  }
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
