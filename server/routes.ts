import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  app.use(session({
    secret: process.env.SESSION_SECRET || 'shift-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({ usernameField: 'empNo' }, async (empNo, password, done) => {
    try {
      const user = await storage.getUserByEmpNo(empNo);
      if (!user) return done(null, false, { message: "Incorrect employee number." });
      if (user.password !== password) return done(null, false, { message: "Incorrect password." });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.employees.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const employees = await storage.getEmployees();
    res.json(employees.map(e => ({ ...e, password: '' })));
  });

  app.get(api.schedules.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { year, month } = req.query as { year?: string, month?: string };
    const schedules = await storage.getSchedules(year, month);
    res.json(schedules);
  });

  app.post(api.schedules.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.schedules.update.input.parse(req.body);
      
      const user = req.user as any;
      if (!user.isAdmin) {
        if (input.employeeId !== user.id) {
          return res.status(401).json({ message: "Can only update own schedule" });
        }
        if (input.shift !== 'L') {
          return res.status(400).json({ message: "Employees can only mark leaves (L)" });
        }
      }

      const schedule = await storage.updateSchedule(input.employeeId, input.date, input.shift);
      res.json(schedule);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.schedules.autoSchedule.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    if (!user.isAdmin) return res.status(401).json({ message: "Admins only" });

    try {
      const input = api.schedules.autoSchedule.input.parse(req.body);
      await generateAutoSchedule(input.year, input.month);
      res.json({ message: "Schedule generated successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const employees = await storage.getEmployees();
  if (employees.length === 0) {
    const admin = await storage.createEmployee({
      empNo: 'admin',
      name: 'Admin User',
      section: 'management',
      weeklyOff: 'SUN',
      password: 'admin',
      isAdmin: true,
    });

    const emp1 = await storage.createEmployee({
      empNo: '2000987',
      name: 'DEONATH SHENDE',
      section: 'DISPATCH',
      weeklyOff: 'THU',
      password: 'password123',
      isAdmin: false,
    });
    const emp2 = await storage.createEmployee({
      empNo: '2002322',
      name: 'SITAKANTA BARICK',
      section: 'DISPATCH',
      weeklyOff: 'FRI',
      password: 'password123',
      isAdmin: false,
    });
    
    const date1 = '2024-03-01';
    await storage.createSchedule({ employeeId: emp1.id, date: date1, shift: 'B' });
    await storage.createSchedule({ employeeId: emp2.id, date: date1, shift: 'C' });
  }
}

async function generateAutoSchedule(year: number, month: number) {
  await storage.clearSchedules(year.toString(), month.toString());
  
  const employees = await storage.getEmployees();
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][dateObj.getDay()];
    
    for (const emp of employees) {
      if (emp.isAdmin) continue;
      
      let shift = 'A';
      if (emp.weeklyOff === dayOfWeek) {
        shift = 'OFF';
      } else {
        const shifts = ['A', 'B', 'C'];
        shift = shifts[Math.floor(Math.random() * shifts.length)];
      }
      
      await storage.createSchedule({ employeeId: emp.id, date: dateStr, shift });
    }
  }
}
