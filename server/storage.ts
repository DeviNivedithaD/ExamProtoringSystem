import { 
  students, 
  examSessions, 
  studentSessions, 
  violations,
  type Student,
  type InsertStudent,
  type ExamSession,
  type InsertExamSession,
  type StudentSession,
  type InsertStudentSession,
  type Violation,
  type InsertViolation,
  type StudentSessionWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  getExamSession(id: string): Promise<ExamSession | undefined>;
  getAllExamSessions(): Promise<ExamSession[]>;
  getActiveExamSessions(): Promise<ExamSession[]>;
  createExamSession(session: InsertExamSession): Promise<ExamSession>;
  updateExamSession(id: string, session: Partial<ExamSession>): Promise<ExamSession | undefined>;
  
  getStudentSession(id: string): Promise<StudentSessionWithDetails | undefined>;
  getActiveStudentSessions(): Promise<StudentSessionWithDetails[]>;
  getStudentSessionsByExam(sessionId: string): Promise<StudentSessionWithDetails[]>;
  getStudentSessionsByStudentAndExam(studentId: string, sessionId: string): Promise<StudentSessionWithDetails[]>;
  createStudentSession(studentSession: InsertStudentSession): Promise<StudentSession>;
  updateStudentSession(id: string, session: Partial<StudentSession>): Promise<StudentSession | undefined>;
  incrementWarningCount(id: string): Promise<StudentSession | undefined>;
  
  getViolation(id: string): Promise<Violation | undefined>;
  getAllViolations(): Promise<any[]>;
  getViolationsByStudentSession(studentSessionId: string): Promise<Violation[]>;
  createViolation(violation: InsertViolation): Promise<Violation>;
}

export class DatabaseStorage implements IStorage {
  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.email, email));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db
      .insert(students)
      .values(insertStudent)
      .returning();
    return student;
  }

  async getExamSession(id: string): Promise<ExamSession | undefined> {
    const [session] = await db.select().from(examSessions).where(eq(examSessions.id, id));
    return session || undefined;
  }

  async getAllExamSessions(): Promise<ExamSession[]> {
    return await db.select().from(examSessions).orderBy(desc(examSessions.startedAt));
  }

  async getActiveExamSessions(): Promise<ExamSession[]> {
    return await db
      .select()
      .from(examSessions)
      .where(eq(examSessions.isActive, true))
      .orderBy(desc(examSessions.startedAt));
  }

  async createExamSession(insertSession: InsertExamSession): Promise<ExamSession> {
    const [session] = await db
      .insert(examSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateExamSession(id: string, sessionUpdate: Partial<ExamSession>): Promise<ExamSession | undefined> {
    const [updated] = await db
      .update(examSessions)
      .set(sessionUpdate)
      .where(eq(examSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async getStudentSession(id: string): Promise<StudentSessionWithDetails | undefined> {
    const [session] = await db.query.studentSessions.findMany({
      where: eq(studentSessions.id, id),
      with: {
        student: true,
        session: true,
        violations: true,
      },
    });
    return session as StudentSessionWithDetails | undefined;
  }

  async getActiveStudentSessions(): Promise<StudentSessionWithDetails[]> {
    const sessions = await db.query.studentSessions.findMany({
      where: eq(studentSessions.isActive, true),
      with: {
        student: true,
        session: true,
        violations: true,
      },
      orderBy: desc(studentSessions.joinedAt),
    });
    return sessions as StudentSessionWithDetails[];
  }

  async getStudentSessionsByExam(sessionId: string): Promise<StudentSessionWithDetails[]> {
    const sessions = await db.query.studentSessions.findMany({
      where: eq(studentSessions.sessionId, sessionId),
      with: {
        student: true,
        session: true,
        violations: true,
      },
      orderBy: desc(studentSessions.joinedAt),
    });
    return sessions as StudentSessionWithDetails[];
  }

  async getStudentSessionsByStudentAndExam(studentId: string, sessionId: string): Promise<StudentSessionWithDetails[]> {
    const sessions = await db.query.studentSessions.findMany({
      where: and(
        eq(studentSessions.studentId, studentId),
        eq(studentSessions.sessionId, sessionId)
      ),
      with: {
        student: true,
        session: true,
        violations: true,
      },
      orderBy: desc(studentSessions.joinedAt),
    });
    return sessions as StudentSessionWithDetails[];
  }

  async createStudentSession(insertSession: InsertStudentSession): Promise<StudentSession> {
    const [session] = await db
      .insert(studentSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateStudentSession(id: string, sessionUpdate: Partial<StudentSession>): Promise<StudentSession | undefined> {
    const [updated] = await db
      .update(studentSessions)
      .set(sessionUpdate)
      .where(eq(studentSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async incrementWarningCount(id: string): Promise<StudentSession | undefined> {
    const [updated] = await db
      .update(studentSessions)
      .set({
        warningCount: sql`${studentSessions.warningCount} + 1`,
      })
      .where(eq(studentSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async getViolation(id: string): Promise<Violation | undefined> {
    const [violation] = await db.select().from(violations).where(eq(violations.id, id));
    return violation || undefined;
  }

  async getAllViolations(): Promise<any[]> {
    const results = await db.query.violations.findMany({
      with: {
        studentSession: {
          with: {
            student: true,
            session: true,
          },
        },
      },
      orderBy: desc(violations.timestamp),
    });
    return results;
  }

  async getViolationsByStudentSession(studentSessionId: string): Promise<Violation[]> {
    return await db
      .select()
      .from(violations)
      .where(eq(violations.studentSessionId, studentSessionId))
      .orderBy(desc(violations.timestamp));
  }

  async createViolation(insertViolation: InsertViolation): Promise<Violation> {
    const [violation] = await db
      .insert(violations)
      .values(insertViolation)
      .returning();
    return violation;
  }
}

export const storage = new DatabaseStorage();
