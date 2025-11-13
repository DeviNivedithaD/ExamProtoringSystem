import React from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Login to Exam</h1>
      <form className="flex flex-col gap-4 w-64">
        <input className="border p-2" type="text" placeholder="Username" required />
        <input className="border p-2" type="password" placeholder="Password" required />
        <button className="bg-blue-600 text-white p-2 rounded" type="submit">Login</button>
      </form>
    </div>
  );
}
