import {
  users,
  pois,
  type User,
  type InsertUser,
  type Poi,
  type InsertPoi,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // POI operations
  getAllPois(): Promise<Poi[]>;
  getPoi(id: number): Promise<Poi | undefined>;
  createPoi(poi: InsertPoi, createdBy: number): Promise<Poi>;
  updatePoi(id: number, poi: Partial<InsertPoi>, userId: number): Promise<Poi | undefined>;
  deletePoi(id: number, userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
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

  async createPoi(poi: InsertPoi, createdBy: number): Promise<Poi> {
    const [newPoi] = await db
      .insert(pois)
      .values({
        ...poi,
        createdBy,
      })
      .returning();
    return newPoi;
  }

  async updatePoi(id: number, poi: Partial<InsertPoi>, userId: number): Promise<Poi | undefined> {
    // Check if user has permission to edit this POI
    const existingPoi = await this.getPoi(id);
    if (!existingPoi) return undefined;

    const user = await this.getUser(userId);
    if (!user || user.role === "Viewer" || 
        (user.role === "Editor" && existingPoi.createdBy !== userId)) {
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

  async deletePoi(id: number, userId: number): Promise<boolean> {
    // Check if user has permission to delete this POI
    const existingPoi = await this.getPoi(id);
    if (!existingPoi) return false;

    const user = await this.getUser(userId);
    if (!user || user.role === "Viewer" || 
        (user.role === "Editor" && existingPoi.createdBy !== userId)) {
      throw new Error("Insufficient permissions to delete this POI");
    }

    const result = await db.delete(pois).where(eq(pois.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
