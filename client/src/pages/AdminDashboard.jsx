import React from "react";
import StatusCard from "../components/StatusCard";

export default function AdminDashboard() {
  // Replace demo values with real API data
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard label="Active Sessions" value={5} status="normal" />
        <StatusCard label="Total Students" value={20} status="normal" />
        <StatusCard label="Violations Today" value={3} status="warning" />
      </div>
    </div>
  );
}
