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
  const existingEmployees = await storage.getEmployees();
  if (existingEmployees.length <= 3) {
    const employeesToSeed = [
      { empNo: 'admin', name: 'Admin User', section: 'management', weeklyOff: 'SUN', password: 'admin', isAdmin: true },
      { empNo: '2000 987', name: 'DEONATH SHENDE', section: 'DISPATCH', weeklyOff: 'THU', password: 'password123', isAdmin: false },
      { empNo: '2002322', name: 'SITAKANTA BARICK', section: 'DISPATCH', weeklyOff: 'FRI', password: 'password123', isAdmin: false },
      { empNo: '2002228', name: 'JITENDRA BEHERA', section: 'DISPATCH', weeklyOff: 'SAT', password: 'password123', isAdmin: false },
      { empNo: '2002409', name: 'SRIKANTH BAHADUR', section: 'DISPATCH', weeklyOff: 'SUN', password: 'password123', isAdmin: false },
      { empNo: '71002493', name: 'BIPRO BANIK', section: 'DISPATCH', weeklyOff: 'MON', password: 'password123', isAdmin: false },
      { empNo: '1000048', name: 'ANKIT THAKARE', section: 'DISPATCH', weeklyOff: 'TUE', password: 'password123', isAdmin: false },
      { empNo: '2000491', name: 'AKHILESH PRASAD', section: 'DISPATCH', weeklyOff: 'WED', password: 'password123', isAdmin: false },
      { empNo: '71002879', name: 'UMESH WANKHADE', section: 'DISPATCH', weeklyOff: 'THU', password: 'password123', isAdmin: false },
      { empNo: '71004192', name: 'Amit Chatte', section: 'DISPATCH', weeklyOff: 'FRI', password: 'password123', isAdmin: false },
      { empNo: '7100198', name: 'YOGESH SADAFALE', section: 'DISPATCH', weeklyOff: 'THU', password: 'password123', isAdmin: false },
      { empNo: '71003359', name: 'PAWAN S CHANDANKHEDE', section: 'DISPATCH', weeklyOff: 'WED', password: 'password123', isAdmin: false },
      { empNo: '71004026', name: 'SANKET KHADE', section: 'DISPATCH', weeklyOff: 'MON', password: 'password123', isAdmin: false },
      { empNo: '2002092', name: 'P.S.LOKHANDE', section: 'DISPATCH', weeklyOff: 'TUE', password: 'password123', isAdmin: false },
      { empNo: '2002461', name: 'SARVIN DERKAR', section: 'WEIGHBRIDGE', weeklyOff: 'SAT', password: 'password123', isAdmin: false },
      { empNo: '1000012', name: 'NANDKISHOR VAIDYA', section: 'WEIGHBRIDGE', weeklyOff: 'SUN', password: 'password123', isAdmin: false },
      { empNo: '2002492', name: 'ATISH KALE', section: 'WEIGHBRIDGE', weeklyOff: 'MON', password: 'password123', isAdmin: false },
      { empNo: 'WB 1097', name: 'RAVINDRA DAWARE', section: 'WEIGHBRIDGE', weeklyOff: 'TUE', password: 'password123', isAdmin: false },
      { empNo: '71002890', name: 'GOVIND DAWARE', section: 'WEIGHBRIDGE', weeklyOff: 'WED', password: 'password123', isAdmin: false },
      { empNo: '2002460', name: 'SANJAY DERKAR', section: 'WEIGHBRIDGE', weeklyOff: 'THU', password: 'password123', isAdmin: false },
      { empNo: '2002381', name: 'ABHISHEK LIHITKAR', section: 'WEIGHBRIDGE', weeklyOff: 'FRI', password: 'password123', isAdmin: false },
      { empNo: '71004060', name: 'AMIT DERKAR', section: 'WEIGHBRIDGE', weeklyOff: 'SAT', password: 'password123', isAdmin: false },
      { empNo: '71003992', name: 'ANKIT SHARMA', section: 'WEIGHBRIDGE', weeklyOff: 'SUN', password: 'password123', isAdmin: false },
      { empNo: '71004418', name: 'SAMEER MAHURE', section: 'WEIGHBRIDGE', weeklyOff: 'SAT', password: 'password123', isAdmin: false },
      { empNo: '2000341', name: 'SHRIKANT PARANJAPE', section: 'WEIGHBRIDGE', weeklyOff: 'SUN', password: 'password123', isAdmin: false },
      { empNo: '2000490', name: 'SUGREEV YADAV', section: 'WEIGHBRIDGE', weeklyOff: 'MON', password: 'password123', isAdmin: false },
      { empNo: '71003528', name: 'GAURAV J SELUKAR', section: 'WEIGHBRIDGE', weeklyOff: 'TUE', password: 'password123', isAdmin: false },
      { empNo: 'WB 1090', name: 'SUNIL BHARDKAR', section: 'WEIGHBRIDGE', weeklyOff: 'WED', password: 'password123', isAdmin: false },
      { empNo: '71002505', name: 'ISHWAR MANE', section: 'WEIGHBRIDGE', weeklyOff: 'THU', password: 'password123', isAdmin: false },
      { empNo: '1000051', name: 'NIKHIL RAJURKAR', section: 'WEIGHBRIDGE', weeklyOff: 'FRI', password: 'password123', isAdmin: false },
    ];

    for (const empData of employeesToSeed) {
      const exists = await storage.getUserByEmpNo(empData.empNo);
      if (!exists) {
        await storage.createEmployee(empData);
      }
    }
    
    // Seed Feb Data
    const febData = [
      { empNo: '2000 987', shifts: ['C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'L', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B'] },
      { empNo: '2002322', shifts: ['A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'G', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'C', 'OFF', 'C'] },
      { empNo: '2002228', shifts: ['B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'B', 'B', 'B', 'B', 'B', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF'] },
      { empNo: '2002409', shifts: ['OFF', 'A', 'A', 'L', 'L', 'L', 'L', 'OFF', 'L', 'L', 'L', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A'] },
      { empNo: '71002493', shifts: ['A', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'B', 'B', 'B', 'C', 'C', 'C', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C'] },
      { empNo: '1000048', shifts: ['B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'A', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A'] },
      { empNo: '2000491', shifts: ['B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'A', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A'] },
      { empNo: '71002879', shifts: ['A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'C', 'OFF', 'C', 'C'] },
      { empNo: '71004192', shifts: ['A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'L', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'C', 'OFF', 'C'] },
      { empNo: '7100198', shifts: ['B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A'] },
      { empNo: '71003359', shifts: ['C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B'] },
      { empNo: '71004026', shifts: ['C', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'A', 'A', 'A', 'A', 'A'] },
      { empNo: '2002092', shifts: ['G', 'G', 'OFF', 'G', 'G', 'G', 'G', 'G', 'G', 'OFF', 'G', 'G', 'G', 'G', 'G', 'G', 'OFF', 'G', 'G', 'A', 'G', 'G', 'G', 'OFF', 'G', 'G', 'G', 'G'] },
      { empNo: '2002461', shifts: ['B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'B', 'B', 'A', 'A', 'A', 'C', 'OFF', 'C', 'C', 'C', 'C', 'C', 'L', 'OFF', 'B', 'B', 'B', 'B', 'B', 'C', 'OFF'] },
      { empNo: '1000012', shifts: ['OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'L', 'L', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B'] },
      { empNo: '2002492', shifts: ['B', 'OFF', 'A', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'L', 'OFF', 'C', 'C', 'L', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A'] },
      { empNo: 'WB 1097', shifts: ['C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'L', 'C', 'C', 'C', 'L', 'C', 'OFF', 'B', 'B', 'B', 'B'] },
      { empNo: '71002890', shifts: ['C', 'C', 'C', 'OFF', 'B', 'A', 'A', 'A', 'A', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B'] },
      { empNo: '2002460', shifts: ['A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'L', 'L', 'L', 'A', 'A', 'A', 'OFF', 'C', 'C'] },
      { empNo: '2002381', shifts: ['B', 'B', 'B', 'B', 'C', 'OFF', 'A', 'A', 'A', 'A', 'L', 'L', 'OFF', 'C', 'C', 'C', 'C', 'C', 'A', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A'] },
      { empNo: '71004060', shifts: ['A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'B', 'C', 'C', 'C', 'C', 'C', 'OFF', 'A', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF'] },
      { empNo: '71003992', shifts: ['OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'A', 'A', 'A', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B'] },
      { empNo: '71004418', shifts: ['C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF'] },
      { empNo: '2000341', shifts: ['OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'L', 'L', 'OFF', 'L', 'L', 'L', 'L', 'L', 'L'] },
      { empNo: '2000490', shifts: ['L', 'OFF', 'L', 'L', 'L', 'L', 'L', 'L', 'OFF', 'C', 'B', 'B', 'B', 'B', 'B', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'A', 'A'] },
      { empNo: '71003528', shifts: ['A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'A', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'L', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C'] },
      { empNo: 'WB 1090', shifts: ['B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'B', 'B', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A'] },
      { empNo: '71002505', shifts: ['C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'B', 'OFF', 'A', 'A', 'A', 'A', 'A', 'A', 'OFF', 'C', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B'] },
      { empNo: '1000051', shifts: ['A', 'A', 'A', 'A', 'C', 'OFF', 'B', 'C', 'C', 'C', 'C', 'C', 'OFF', 'B', 'B', 'B', 'B', 'B', 'A', 'OFF', 'A', 'A', 'A', 'A', 'A', 'C', 'OFF', 'C'] }
    ];

    for (const data of febData) {
      const emp = await storage.getUserByEmpNo(data.empNo);
      if (emp) {
        for (let i = 0; i < data.shifts.length; i++) {
          const day = i + 1;
          const dateStr = `2026-02-${day.toString().padStart(2, '0')}`;
          await storage.updateSchedule(emp.id, dateStr, data.shifts[i]);
        }
      }
    }
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
