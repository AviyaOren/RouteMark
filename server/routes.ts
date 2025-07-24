import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPoiSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // POI routes
  app.get('/api/pois', isAuthenticated, async (req: any, res) => {
    try {
      const pois = await storage.getAllPois();
      res.json(pois);
    } catch (error) {
      console.error("Error fetching POIs:", error);
      res.status(500).json({ message: "Failed to fetch POIs" });
    }
  });

  app.post('/api/pois', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role === "Viewer") {
        return res.status(403).json({ message: "Insufficient permissions to create POI" });
      }

      const validatedData = insertPoiSchema.parse(req.body);
      const poi = await storage.createPoi(validatedData, userId);
      res.status(201).json(poi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating POI:", error);
      res.status(500).json({ message: "Failed to create POI" });
    }
  });

  app.put('/api/pois/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const poiId = parseInt(req.params.id);
      
      if (isNaN(poiId)) {
        return res.status(400).json({ message: "Invalid POI ID" });
      }

      const validatedData = insertPoiSchema.partial().parse(req.body);
      const poi = await storage.updatePoi(poiId, validatedData, userId);
      
      if (!poi) {
        return res.status(404).json({ message: "POI not found" });
      }
      
      res.json(poi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error.message.includes("Insufficient permissions")) {
        return res.status(403).json({ message: error.message });
      }
      console.error("Error updating POI:", error);
      res.status(500).json({ message: "Failed to update POI" });
    }
  });

  app.delete('/api/pois/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const poiId = parseInt(req.params.id);
      
      if (isNaN(poiId)) {
        return res.status(400).json({ message: "Invalid POI ID" });
      }

      const success = await storage.deletePoi(poiId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "POI not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      if (error.message.includes("Insufficient permissions")) {
        return res.status(403).json({ message: error.message });
      }
      console.error("Error deleting POI:", error);
      res.status(500).json({ message: "Failed to delete POI" });
    }
  });

  // Export POIs as JSON
  app.get('/api/pois/export', isAuthenticated, async (req: any, res) => {
    try {
      const pois = await storage.getAllPois();
      const exportData = pois.map(poi => ({
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
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=pois-export.json');
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting POIs:", error);
      res.status(500).json({ message: "Failed to export POIs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
