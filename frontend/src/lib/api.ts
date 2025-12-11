// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",   // ← your backend (no /api/v1 anymore)
  withCredentials: true,              // important if using cookies/auth
});

export default api;