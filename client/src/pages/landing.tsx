import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Shield, Download } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            POI Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline logistics coordination by managing Points of Interest for field riders. 
            Create, edit, and export POI data with role-based access control.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Interactive Mapping</h3>
              <p className="text-gray-600 text-sm">
                Full-screen map interface with click-to-add POI functionality
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
              <p className="text-gray-600 text-sm">
                Admin, Editor, and Viewer roles with appropriate permissions
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Download className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">JSON Export</h3>
              <p className="text-gray-600 text-sm">
                Export POI data in structured JSON format for mobile consumption
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Get Started</h2>
              <p className="text-gray-600 mt-2">Sign in to access the POI management dashboard</p>
            </div>
            
            <Button 
              onClick={handleLogin}
              className="w-full py-3 text-lg font-medium"
              size="lg"
            >
              Sign In
            </Button>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                <div className="text-center">
                  <div className="font-medium text-primary">Admin</div>
                  <div>Full Access</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">Editor</div>
                  <div>Create & Edit</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-600">Viewer</div>
                  <div>Read Only</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
