import { z } from 'zod';
import { insertEmployeeSchema, insertScheduleSchema, employees, schedules } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ empNo: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof employees.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof employees.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() })
      }
    }
  },
  employees: {
    list: {
      method: 'GET' as const,
      path: '/api/employees' as const,
      responses: {
        200: z.array(z.custom<typeof employees.$inferSelect>()),
      }
    }
  },
  schedules: {
    list: {
      method: 'GET' as const,
      path: '/api/schedules' as const,
      input: z.object({
        year: z.string().optional(),
        month: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof schedules.$inferSelect>()),
      }
    },
    update: {
      method: 'POST' as const,
      path: '/api/schedules/update' as const,
      input: z.object({
        employeeId: z.coerce.number(),
        date: z.string(),
        shift: z.string()
      }),
      responses: {
        200: z.custom<typeof schedules.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    autoSchedule: {
      method: 'POST' as const,
      path: '/api/schedules/auto' as const,
      input: z.object({
        year: z.coerce.number(),
        month: z.coerce.number(),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
