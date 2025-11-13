import React from "react";

export default function WarningBanner({ message, warnings }) {
  if (!message) return null;
  return (
    <div className={`fixed top-0 left-0 w-full p-4 ${warnings >= 3 ? "bg-red-500" : "bg-yellow-300"} text-black z-50`}>
      {message} — Total warnings: {warnings}
    </div>
  );
}
