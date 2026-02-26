import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  empNo: text("emp_no").notNull().unique(),
  name: text("name").notNull(),
  section: text("section").notNull(),
  weeklyOff: text("weekly_off").notNull(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: text("date").notNull(),
  shift: text("shift").notNull(), // A, B, C, OFF, L, G
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
