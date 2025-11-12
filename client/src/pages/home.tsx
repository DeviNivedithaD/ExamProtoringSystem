import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Users, Eye } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [studentName, setStudentName] = useState("");
  const [sessionId, setSessionId] = useState("");

  const handleStudentJoin = () => {
    if (sessionId.trim() && studentName.trim()) {
      localStorage.setItem("studentName", studentName.trim());
      setLocation(`/exam/${sessionId}`);
    } else {
      alert("Please enter both your name and session ID");
    }
  };

  const handleAdminLogin = () => {
    setLocation("/admin");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-6xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold" data-testid="text-app-title">Exam Proctoring System</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Secure online testing with real-time monitoring, tab switch detection, and copy-paste prevention
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="hover-elevate" data-testid="card-student-portal">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users className="w-6 h-6 text-primary" />
                Student Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Enter your session ID to join an active exam. Proctoring features will be automatically enabled.
              </p>
              
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="student-name">Your Name</Label>
                  <Input
                    id="student-name"
                    placeholder="Enter your name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    data-testid="input-student-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-id">Session ID</Label>
                  <Input
                    id="session-id"
                    placeholder="Enter session ID"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    data-testid="input-session-id"
                  />
                </div>

                <Button
                  onClick={handleStudentJoin}
                  className="w-full hover-elevate active-elevate-2"
                  size="lg"
                  disabled={!sessionId.trim() || !studentName.trim()}
                  data-testid="button-join-exam"
                >
                  Join Exam
                </Button>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <p className="text-sm font-medium">Proctoring Features:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tab switch detection</li>
                  <li>• Copy-paste blocking</li>
                  <li>• Webcam & microphone monitoring</li>
                  <li>• Automatic logout after 3 warnings</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-admin-portal">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Eye className="w-6 h-6 text-primary" />
                Admin Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Access the administrator dashboard to monitor active exams, view violation logs, and manage student sessions.
              </p>

              <div className="pt-2">
                <Button
                  onClick={handleAdminLogin}
                  className="w-full hover-elevate active-elevate-2"
                  size="lg"
                  variant="outline"
                  data-testid="button-admin-login"
                >
                  Access Admin Dashboard
                </Button>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <p className="text-sm font-medium">Dashboard Features:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time student monitoring</li>
                  <li>• Violation tracking & alerts</li>
                  <li>• Session management</li>
                  <li>• Exportable reports</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-md">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">Privacy & Security</p>
              <p className="text-muted-foreground">
                All exam sessions are monitored for academic integrity. By joining an exam, you consent to webcam and microphone monitoring, 
                tab switch detection, and clipboard event tracking. Violations are logged and may result in automatic exam termination.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
