import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertStudentSchema, 
  insertExamSessionSchema, 
  insertStudentSessionSchema,
  insertViolationSchema 
} from "@shared/schema";

interface WebSocketClient extends WebSocket {
  isAlive?: boolean;
  sessionId?: string;
  role?: 'student' | 'admin';
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocketClient>();

  wss.on('connection', (ws: WebSocketClient) => {
    ws.isAlive = true;
    clients.add(ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'join_exam') {
          ws.sessionId = data.sessionId;
          ws.role = 'student';
        } else if (data.type === 'admin_connect') {
          ws.role = 'admin';
        } else if (data.type === 'violation' && ws.sessionId) {
          clients.forEach((client) => {
            if (client.role === 'admin' && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'violation_alert',
                sessionId: ws.sessionId,
                violationType: data.violationType,
                details: data.details,
                warningCount: data.warningCount,
                timestamp: new Date().toISOString(),
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  const interval = setInterval(() => {
    clients.forEach((ws) => {
      if (!ws.isAlive) {
        clients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  app.get("/api/students", async (req, res) => {
    try {
      const { email } = req.query;
      if (email && typeof email === 'string') {
        const student = await storage.getStudentByEmail(email);
        res.json(student ? [student] : []);
      } else {
        res.json([]);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/exam-sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllExamSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/exam-sessions/active", async (req, res) => {
    try {
      const sessions = await storage.getActiveExamSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/exam-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getExamSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Exam session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/exam-sessions", async (req, res) => {
    try {
      const validatedData = insertExamSessionSchema.parse(req.body);
      const session = await storage.createExamSession(validatedData);
      res.status(201).json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/exam-sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateExamSession(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Exam session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/student-sessions", async (req, res) => {
    try {
      res.status(501).json({ message: "Not implemented" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/student-sessions/active", async (req, res) => {
    try {
      const sessions = await storage.getActiveStudentSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/student-sessions/by-student-exam", async (req, res) => {
    try {
      const { studentId, sessionId } = req.query;
      if (!studentId || !sessionId || typeof studentId !== 'string' || typeof sessionId !== 'string') {
        return res.status(400).json({ error: "Missing studentId or sessionId" });
      }
      const sessions = await storage.getStudentSessionsByStudentAndExam(studentId, sessionId);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/student-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getStudentSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Student session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/student-sessions", async (req, res) => {
    try {
      const validatedData = insertStudentSessionSchema.parse(req.body);
      
      const existingSessions = await storage.getStudentSessionsByStudentAndExam(
        validatedData.studentId,
        validatedData.sessionId
      );
      
      const terminatedSession = existingSessions.find((s: any) => !s.isActive && s.warningCount >= 3);
      if (terminatedSession) {
        return res.status(403).json({ 
          error: "Student has been terminated from this exam due to violations",
          terminated: true,
          session: terminatedSession
        });
      }
      
      const session = await storage.createStudentSession(validatedData);
      res.status(201).json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/student-sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateStudentSession(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Student session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/student-sessions/:id/warning", async (req, res) => {
    try {
      const session = await storage.incrementWarningCount(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Student session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/violations", async (req, res) => {
    try {
      const violations = await storage.getAllViolations();
      res.json(violations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/violations/student-session/:studentSessionId", async (req, res) => {
    try {
      const violations = await storage.getViolationsByStudentSession(req.params.studentSessionId);
      res.json(violations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/violations", async (req, res) => {
    try {
      const validatedData = insertViolationSchema.parse(req.body);
      const violation = await storage.createViolation(validatedData);
      
      clients.forEach((client) => {
        if (client.role === 'admin' && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'violation_created',
            violation,
          }));
        }
      });
      
      res.status(201).json(violation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}
