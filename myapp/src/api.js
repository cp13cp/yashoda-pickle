import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const buildUrl = (path) => {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};
