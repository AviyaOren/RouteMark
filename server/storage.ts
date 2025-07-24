import {
  users,
  pois,
  type User,
  type UpsertUser,
  type Poi,
  type InsertPoi,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // POI operations
  getAllPois(): Promise<Poi[]>;
  getPoi(id: number): Promise<Poi | undefined>;
  createPoi(poi: InsertPoi, createdBy: string): Promise<Poi>;
  updatePoi(id: number, poi: Partial<InsertPoi>, userId: string): Promise<Poi | undefined>;
  deletePoi(id: number, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // POI operations
  async getAllPois(): Promise<Poi[]> {
    return await db.select().from(pois).orderBy(desc(pois.createdAt));
  }

  async getPoi(id: number): Promise<Poi | undefined> {
    const [poi] = await db.select().from(pois).where(eq(pois.id, id));
    return poi;
  }

  async createPoi(poi: InsertPoi, createdBy: string): Promise<Poi> {
    const [newPoi] = await db
      .insert(pois)
      .values({
        ...poi,
        createdBy,
      })
      .returning();
    return newPoi;
  }

  async updatePoi(id: number, poi: Partial<InsertPoi>, userId: string): Promise<Poi | undefined> {
    // Check if user has permission to edit this POI
    const existingPoi = await this.getPoi(id);
    if (!existingPoi) return undefined;

    const user = await this.getUser(userId);
    if (!user || (user.role === "Viewer") || 
        (user.role === "Editor" && existingPoi.createdBy !== userId && user.role !== "Admin")) {
      throw new Error("Insufficient permissions to edit this POI");
    }

    const [updatedPoi] = await db
      .update(pois)
      .set({
        ...poi,
        updatedAt: new Date(),
      })
      .where(eq(pois.id, id))
      .returning();
    
    return updatedPoi;
  }

  async deletePoi(id: number, userId: string): Promise<boolean> {
    // Check if user has permission to delete this POI
    const existingPoi = await this.getPoi(id);
    if (!existingPoi) return false;

    const user = await this.getUser(userId);
    if (!user || (user.role === "Viewer") || 
        (user.role === "Editor" && existingPoi.createdBy !== userId && user.role !== "Admin")) {
      throw new Error("Insufficient permissions to delete this POI");
    }

    const result = await db.delete(pois).where(eq(pois.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
