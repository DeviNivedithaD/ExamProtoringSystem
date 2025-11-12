import { useEffect, useState, useCallback, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Video, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ExamSession, StudentSession } from "@shared/schema";

export default function StudentExam() {
  const [, params] = useRoute("/exam/:sessionId");
  const sessionId = params?.sessionId || "";
  const [studentSessionId, setStudentSessionId] = useState<string>("");
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [isTerminated, setIsTerminated] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [showWarning, setShowWarning] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  const { data: examSession } = useQuery<ExamSession>({
    queryKey: ["/api/exam-sessions", sessionId],
    enabled: !!sessionId,
  });

  const { data: studentSession, refetch: refetchStudentSession } = useQuery<StudentSession>({
    queryKey: ["/api/student-sessions", studentSessionId],
    enabled: !!studentSessionId,
  });

  const createViolation = useMutation({
    mutationFn: async (data: { type: string; details: string }) => {
      return await apiRequest("POST", "/api/violations", {
        studentSessionId,
        type: data.type,
        details: data.details,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/violations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student-sessions", studentSessionId] });
    },
  });

  const incrementWarning = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/student-sessions/${studentSessionId}/warning`, {});
    },
    onSuccess: () => {
      refetchStudentSession();
      queryClient.invalidateQueries({ queryKey: ["/api/student-sessions/active"] });
    },
  });

  const updateStudentSession = useMutation({
    mutationFn: async (data: { isActive: boolean; leftAt?: Date }) => {
      return await apiRequest("PATCH", `/api/student-sessions/${studentSessionId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-sessions", studentSessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/student-sessions/active"] });
    },
  });

  useEffect(() => {
    const initSession = async () => {
      if (!sessionId) return;

      try {
        const cachedSessionId = localStorage.getItem(`studentSession_${sessionId}`);
        if (cachedSessionId) {
          const validateResponse = await fetch(`/api/student-sessions/${cachedSessionId}`);
          if (validateResponse.ok) {
            const validatedSession = await validateResponse.json();
            if (!validatedSession.isActive || validatedSession.warningCount >= 3) {
              setIsTerminated(true);
              setIsSessionActive(false);
              localStorage.removeItem(`studentSession_${sessionId}`);
              toast({
                title: "Access Denied",
                description: "You have been permanently locked out of this exam due to multiple violations.",
                variant: "destructive",
              });
              return;
            }
            setStudentSessionId(cachedSessionId);
            return;
          } else {
            localStorage.removeItem(`studentSession_${sessionId}`);
          }
        }

        const studentName = localStorage.getItem("studentName") || "Anonymous Student";
        const studentEmail = `${studentName.toLowerCase().replace(/\s+/g, '.')}@exam.test`;
        
        let storedStudentId = localStorage.getItem("studentId");
        
        if (!storedStudentId) {
          const existingStudent = await fetch(`/api/students?email=${encodeURIComponent(studentEmail)}`);
          if (existingStudent.ok) {
            const students = await existingStudent.json();
            if (students.length > 0) {
              storedStudentId = students[0].id;
              localStorage.setItem("studentId", storedStudentId);
            }
          }
        }

        if (!storedStudentId) {
          const response = await apiRequest("POST", "/api/students", {
            name: studentName,
            email: studentEmail,
          });
          const student = await response.json();
          storedStudentId = student.id;
          localStorage.setItem("studentId", storedStudentId);
        }

        const existingSessionsResponse = await fetch(`/api/student-sessions/by-student-exam?studentId=${storedStudentId}&sessionId=${sessionId}`);
        if (existingSessionsResponse.ok) {
          const existingSessions = await existingSessionsResponse.json();
          
          const terminatedSession = existingSessions.find((s: any) => !s.isActive && s.warningCount >= 3);
          if (terminatedSession) {
            setIsTerminated(true);
            setIsSessionActive(false);
            toast({
              title: "Access Denied",
              description: "You have been permanently locked out of this exam due to multiple violations.",
              variant: "destructive",
            });
            return;
          }
          
          const activeSession = existingSessions.find((s: any) => s.isActive);
          if (activeSession) {
            setStudentSessionId(activeSession.id);
            localStorage.setItem(`studentSession_${sessionId}`, activeSession.id);
            return;
          }
        }

        try {
          const response = await apiRequest("POST", "/api/student-sessions", {
            studentId: storedStudentId,
            sessionId: sessionId,
            warningCount: 0,
            isActive: true,
          });
          const newSession = await response.json();
          setStudentSessionId(newSession.id);
          localStorage.setItem(`studentSession_${sessionId}`, newSession.id);
        } catch (error: any) {
          if (error.message && error.message.includes("terminated")) {
            setIsTerminated(true);
            setIsSessionActive(false);
            toast({
              title: "Access Denied",
              description: "You have been permanently locked out of this exam due to multiple violations.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
        toast({
          title: "Error",
          description: "Failed to join exam session",
          variant: "destructive",
        });
      }
    };

    initSession();
  }, [sessionId, toast]);

  const handleViolation = useCallback(async (type: string, details: string) => {
    if (!isSessionActive || !studentSessionId) return;
    
    try {
      await createViolation.mutateAsync({ type, details });
      await incrementWarning.mutateAsync();

      const updatedSession = await refetchStudentSession();
      const newWarningCount = updatedSession.data?.warningCount || 0;

      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'violation',
          violationType: type,
          details,
          warningCount: newWarningCount,
        }));
      }

      if (newWarningCount >= 3) {
        setIsSessionActive(false);
        await updateStudentSession.mutateAsync({
          isActive: false,
          leftAt: new Date(),
        });
        toast({
          title: "Exam Terminated",
          description: "You have been logged out due to multiple violations.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        toast({
          title: `Warning ${newWarningCount}/3`,
          description: `${type}: ${details}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to handle violation:", error);
    }
  }, [isSessionActive, studentSessionId, createViolation, incrementWarning, updateStudentSession, refetchStudentSession, toast]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSessionActive) {
        handleViolation("Tab Switch", "Student switched away from exam tab");
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (isSessionActive) {
        e.preventDefault();
        handleViolation("Copy Attempt", "Student attempted to copy content");
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (isSessionActive) {
        e.preventDefault();
        handleViolation("Paste Attempt", "Student attempted to paste content");
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      if (isSessionActive) {
        e.preventDefault();
        handleViolation("Cut Attempt", "Student attempted to cut content");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (isSessionActive) {
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [handleViolation, isSessionActive]);

  useEffect(() => {
    if (examSession?.duration) {
      setTimeRemaining(examSession.duration * 60);
    }
  }, [examSession]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'join_exam',
        sessionId: sessionId,
      }));
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'force_logout') {
        setIsSessionActive(false);
        await updateStudentSession.mutateAsync({
          isActive: false,
          leftAt: new Date(),
        });
        toast({
          title: "Exam Terminated",
          description: "Administrator has ended your session.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    };

    wsRef.current = socket;

    return () => {
      socket.close();
    };
  }, [sessionId, studentSessionId, toast, updateStudentSession]);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setWebcamActive(true);
        setMicActive(true);
      } catch (err) {
        toast({
          title: "Media Access Required",
          description: "Please enable camera and microphone access.",
          variant: "destructive",
        });
      }
    };

    initializeMedia();
  }, [toast]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (confirm("Are you sure you want to submit your exam?")) {
      setIsSessionActive(false);
      await updateStudentSession.mutateAsync({
        isActive: false,
        leftAt: new Date(),
      });
      toast({
        title: "Exam Submitted",
        description: "Your answers have been recorded.",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const warningCount = studentSession?.warningCount || 0;

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            You have been permanently locked out of this exam session due to multiple proctoring violations.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your instructor for further assistance.
          </p>
          <Button 
            onClick={() => window.location.href = "/"} 
            className="w-full hover-elevate active-elevate-2"
            data-testid="button-return-home"
          >
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground p-4 shadow-lg animate-in slide-in-from-top" data-testid="alert-warning">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-semibold">Warning {warningCount}/3</p>
              <p className="text-sm">Violation detected. {3 - warningCount} warnings remaining before automatic logout.</p>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-card border-b border-card-border shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-semibold" data-testid="text-exam-title">
              {examSession?.title || "Loading..."}
            </h1>
            <p className="text-sm text-muted-foreground">Session ID: {sessionId}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {webcamActive ? (
                <Badge variant="outline" className="gap-1.5" data-testid="badge-webcam-status">
                  <Video className="w-3 h-3" />
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5" data-testid="badge-webcam-status">
                  <Video className="w-3 h-3" />
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                </Badge>
              )}
              
              {micActive ? (
                <Badge variant="outline" className="gap-1.5" data-testid="badge-mic-status">
                  <Mic className="w-3 h-3" />
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5" data-testid="badge-mic-status">
                  <Mic className="w-3 h-3" />
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                </Badge>
              )}
            </div>

            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Time Remaining</p>
              <p className="text-xl font-bold tabular-nums" data-testid="text-timer">{formatTime(timeRemaining)}</p>
            </div>

            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Warnings</p>
              <p className={`text-2xl font-bold tabular-nums ${warningCount >= 2 ? 'text-destructive' : ''}`} data-testid="text-warning-count">
                {warningCount}/3
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Card className="p-8 space-y-6" data-testid="card-exam-content">
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-md p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1 space-y-2 text-sm">
                  <p className="font-semibold text-foreground">Proctoring Active</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Switching tabs will trigger a warning</li>
                    <li>• Copying or pasting is disabled</li>
                    <li>• 3 violations will result in automatic logout</li>
                    <li>• Your webcam and microphone are being monitored</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Question 1</h3>
                <p className="text-muted-foreground mb-4">What is the time complexity of binary search?</p>
                <textarea 
                  className="w-full min-h-[120px] p-4 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Type your answer here..."
                  data-testid="input-answer-1"
                  disabled={!isSessionActive}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Question 2</h3>
                <p className="text-muted-foreground mb-4">Explain the difference between stack and queue data structures.</p>
                <textarea 
                  className="w-full min-h-[120px] p-4 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Type your answer here..."
                  data-testid="input-answer-2"
                  disabled={!isSessionActive}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Question 3</h3>
                <p className="text-muted-foreground mb-4">Write a function to reverse a linked list.</p>
                <textarea 
                  className="w-full min-h-[180px] p-4 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                  placeholder="// Write your code here"
                  data-testid="input-answer-3"
                  disabled={!isSessionActive}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button 
              onClick={handleSubmit} 
              size="lg"
              disabled={!isSessionActive}
              data-testid="button-submit-exam"
              className="hover-elevate active-elevate-2"
            >
              Submit Exam
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
