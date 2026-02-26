import { db } from "./db";
import {
  employees,
  schedules,
  type Employee,
  type InsertEmployee,
  type Schedule,
  type InsertSchedule
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<Employee | undefined>;
  getUserByEmpNo(empNo: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  getEmployees(): Promise<Employee[]>;
  getSchedules(year?: string, month?: string): Promise<Schedule[]>;
  updateSchedule(employeeId: number, date: string, shift: string): Promise<Schedule>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  clearSchedules(year: string, month: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<Employee | undefined> {
    const [user] = await db.select().from(employees).where(eq(employees.id, id));
    return user;
  }

  async getUserByEmpNo(empNo: string): Promise<Employee | undefined> {
    const [user] = await db.select().from(employees).where(eq(employees.empNo, empNo));
    return user;
  }

  async createEmployee(insertUser: InsertEmployee): Promise<Employee> {
    const [user] = await db.insert(employees).values(insertUser).returning();
    return user;
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getSchedules(year?: string, month?: string): Promise<Schedule[]> {
    let query = db.select().from(schedules);
    if (year && month) {
      const prefix = `${year}-${month.padStart(2, '0')}`;
      query = db.select().from(schedules).where(sql`${schedules.date} LIKE ${prefix + '%'}`);
    }
    return await query;
  }

  async updateSchedule(employeeId: number, date: string, shift: string): Promise<Schedule> {
    const existing = await db.select().from(schedules).where(
      and(eq(schedules.employeeId, employeeId), eq(schedules.date, date))
    );
    if (existing.length > 0) {
      const [updated] = await db.update(schedules)
        .set({ shift })
        .where(eq(schedules.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(schedules)
        .values({ employeeId, date, shift })
        .returning();
      return created;
    }
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [created] = await db.insert(schedules).values(schedule).returning();
    return created;
  }
  
  async clearSchedules(year: string, month: string): Promise<void> {
    const prefix = `${year}-${month.padStart(2, '0')}`;
    await db.delete(schedules).where(sql`${schedules.date} LIKE ${prefix + '%'}`);
  }
}

export const storage = new DatabaseStorage();
