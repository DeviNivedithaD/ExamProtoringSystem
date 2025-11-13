import React, { useEffect, useState } from "react";
import WarningBanner from "../components/WarningBanner";
import WebcamMonitor from "../components/WebcamMonitor";
import { detectTabSwitch, detectCopyPaste } from "../utils/detection";

export default function ExamPage() {
  const [warnings, setWarnings] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    detectTabSwitch(() => {
      setWarnings(w => w + 1);
      setMessage("Tab switch detected!");
    });
    detectCopyPaste(() => {
      setWarnings(w => w + 1);
      setMessage("Copy-Paste detected!");
    });
    if (warnings >= 3) {
      setMessage("You have been logged out due to violations.");
      // Implement real API call and redirect logic for exam finish
    }
  }, [warnings]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Online Exam</h1>
      <WarningBanner message={message} warnings={warnings} />
      <WebcamMonitor />
      {/* Add exam questions and submit button here */}
    </div>
  );
}
