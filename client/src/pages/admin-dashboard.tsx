import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Users, Activity, TrendingUp, Eye, Video, CheckCircle, XCircle } from "lucide-react";
import type { ExamSession, StudentSessionWithDetails, Violation } from "@shared/schema";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("sessions");
  const wsRef = useRef<WebSocket | null>(null);
  const [realtimeViolations, setRealtimeViolations] = useState<any[]>([]);

  const { data: sessions, isLoading: sessionsLoading } = useQuery<ExamSession[]>({
    queryKey: ["/api/exam-sessions"],
  });

  const { data: activeSessions, isLoading: activeSessionsLoading } = useQuery<StudentSessionWithDetails[]>({
    queryKey: ["/api/student-sessions/active"],
  });

  const { data: violations, isLoading: violationsLoading } = useQuery<(Violation & { studentSession: StudentSessionWithDetails })[]>({
    queryKey: ["/api/violations"],
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'admin_connect',
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'violation_alert') {
        setRealtimeViolations(prev => [data, ...prev].slice(0, 10));
      }
    };

    wsRef.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  const totalActiveSessions = sessions?.filter(s => s.isActive).length || 0;
  const totalActiveStudents = activeSessions?.filter(s => s.isActive).length || 0;
  const totalViolationsToday = violations?.filter(v => {
    const today = new Date();
    const violationDate = new Date(v.timestamp);
    return violationDate.toDateString() === today.toDateString();
  }).length || 0;

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString();
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-card-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Exam Proctoring Dashboard</h1>
          <Button variant="outline" data-testid="button-logout" className="hover-elevate active-elevate-2">
            <span className="material-icons text-lg mr-2">logout</span>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-elevate" data-testid="card-stat-sessions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums" data-testid="text-active-sessions">{totalActiveSessions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Live monitoring
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-stat-students">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums" data-testid="text-active-students">{totalActiveStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently taking exams</p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-stat-violations">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Violations Today</CardTitle>
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums" data-testid="text-violations-today">{totalViolationsToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Tab switches & copy attempts</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md" data-testid="tabs-navigation">
            <TabsTrigger value="sessions" data-testid="tab-sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="violations" data-testid="tab-violations">Violation Logs</TabsTrigger>
            <TabsTrigger value="monitoring" data-testid="tab-monitoring">Live Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Active Exam Sessions</h2>
              <Button data-testid="button-new-session" className="hover-elevate active-elevate-2">
                <span className="material-icons text-lg mr-2">add</span>
                New Session
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {sessionsLoading ? (
                <Card className="p-6">
                  <div className="flex items-center justify-center text-muted-foreground">
                    Loading sessions...
                  </div>
                </Card>
              ) : sessions && sessions.length > 0 ? (
                sessions.filter(s => s.isActive).map((session) => (
                  <Card key={session.id} className="hover-elevate" data-testid={`card-session-${session.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{session.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{session.description}</p>
                        </div>
                        <Badge variant="outline" className="gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="ml-2 font-medium">{session.duration} min</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Started:</span>
                            <span className="ml-2 font-medium">{formatTime(session.startedAt)}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" data-testid={`button-monitor-${session.id}`} className="hover-elevate active-elevate-2">
                          <Eye className="w-4 h-4 mr-2" />
                          Monitor
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-12">
                  <div className="text-center text-muted-foreground space-y-2">
                    <Activity className="w-12 h-12 mx-auto opacity-50" />
                    <p className="text-lg font-medium">No active sessions</p>
                    <p className="text-sm">Create a new exam session to start monitoring students</p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="violations" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Violation Logs</h2>
              <Button variant="outline" data-testid="button-export" className="hover-elevate active-elevate-2">
                <span className="material-icons text-lg mr-2">download</span>
                Export Report
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Violation Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Session</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Loading violations...
                      </TableCell>
                    </TableRow>
                  ) : violations && violations.length > 0 ? (
                    violations.map((violation) => (
                      <TableRow key={violation.id} data-testid={`row-violation-${violation.id}`}>
                        <TableCell className="font-medium tabular-nums">
                          {formatDate(violation.timestamp)} {formatTime(violation.timestamp)}
                        </TableCell>
                        <TableCell>{violation.studentSession?.student?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={violation.type.includes('Tab') ? 'destructive' : 'outline'}>
                            {violation.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{violation.details}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {violation.studentSession?.session?.title || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="text-muted-foreground space-y-2">
                          <CheckCircle className="w-12 h-12 mx-auto opacity-50" />
                          <p className="text-lg font-medium">No violations recorded</p>
                          <p className="text-sm">All students are following exam rules</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <h2 className="text-xl font-semibold">Live Student Monitoring</h2>

            {realtimeViolations.length > 0 && (
              <Card className="bg-destructive/10 border-destructive/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Recent Violations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {realtimeViolations.slice(0, 3).map((v, i) => (
                    <div key={i} className="text-sm p-2 bg-background rounded-md">
                      <span className="font-medium">{v.violationType}</span> - {v.details}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSessionsLoading ? (
                <Card className="p-6">
                  <div className="flex items-center justify-center text-muted-foreground">
                    Loading active students...
                  </div>
                </Card>
              ) : activeSessions && activeSessions.length > 0 ? (
                activeSessions.filter(s => s.isActive).map((studentSession) => (
                  <Card key={studentSession.id} className="hover-elevate" data-testid={`card-student-${studentSession.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{studentSession.student.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {studentSession.session.title}
                          </p>
                        </div>
                        <Badge variant={studentSession.isActive ? "outline" : "secondary"} className="gap-1.5">
                          {studentSession.isActive ? (
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                          )}
                          {studentSession.isActive ? 'Active' : 'Ended'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="aspect-video bg-muted rounded-md flex items-center justify-center border border-border">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="material-icons text-sm">warning</span>
                          <span className="font-medium">Warnings:</span>
                          <span className={`font-bold tabular-nums ${studentSession.warningCount >= 2 ? 'text-destructive' : ''}`}>
                            {studentSession.warningCount}/3
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <Badge variant="outline" className="gap-1">
                            <Video className="w-3 h-3" />
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <span className="material-icons text-xs">mic</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full p-12">
                  <div className="text-center text-muted-foreground space-y-2">
                    <Users className="w-12 h-12 mx-auto opacity-50" />
                    <p className="text-lg font-medium">No active students</p>
                    <p className="text-sm">Students will appear here when they join exam sessions</p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
