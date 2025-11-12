import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const examSessions = pgTable("exam_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const studentSessions = pgTable("student_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id").notNull().references(() => examSessions.id, { onDelete: 'cascade' }),
  warningCount: integer("warning_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

export const violations = pgTable("violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentSessionId: varchar("student_session_id").notNull().references(() => studentSessions.id, { onDelete: 'cascade' }),
  type: text("type").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const studentsRelations = relations(students, ({ many }) => ({
  studentSessions: many(studentSessions),
}));

export const examSessionsRelations = relations(examSessions, ({ many }) => ({
  studentSessions: many(studentSessions),
}));

export const studentSessionsRelations = relations(studentSessions, ({ one, many }) => ({
  student: one(students, {
    fields: [studentSessions.studentId],
    references: [students.id],
  }),
  session: one(examSessions, {
    fields: [studentSessions.sessionId],
    references: [examSessions.id],
  }),
  violations: many(violations),
}));

export const violationsRelations = relations(violations, ({ one }) => ({
  studentSession: one(studentSessions, {
    fields: [violations.studentSessionId],
    references: [studentSessions.id],
  }),
}));

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertExamSessionSchema = createInsertSchema(examSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

export const insertStudentSessionSchema = createInsertSchema(studentSessions).omit({
  id: true,
  joinedAt: true,
  leftAt: true,
});

export const insertViolationSchema = createInsertSchema(violations).omit({
  id: true,
  timestamp: true,
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type ExamSession = typeof examSessions.$inferSelect;
export type InsertExamSession = z.infer<typeof insertExamSessionSchema>;

export type StudentSession = typeof studentSessions.$inferSelect;
export type InsertStudentSession = z.infer<typeof insertStudentSessionSchema>;

export type Violation = typeof violations.$inferSelect;
export type InsertViolation = z.infer<typeof insertViolationSchema>;

export type StudentSessionWithDetails = StudentSession & {
  student: Student;
  session: ExamSession;
  violations: Violation[];
};
