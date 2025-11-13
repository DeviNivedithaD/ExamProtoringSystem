import React from "react";

export default function StatusCard({ label, value, status }) {
  return (
    <div className="border p-4 shadow-sm rounded bg-white flex flex-col items-center">
      <h3 className="font-semibold mb-1">{label}</h3>
      <span className={`text-2xl ${status === "warning" ? "text-yellow-500" : "text-green-600"}`}>{value}</span>
    </div>
  );
}
