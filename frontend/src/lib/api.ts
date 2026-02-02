import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001", 
  withCredentials: true,             
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access - redirecting to login");
    }
    return Promise.reject(error);
  }
);


export async function fetchAPI(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: Record<string, unknown>; 
  } = {}
) {
  try {
    const response = await api({
      url: endpoint,
      method: options.method || "GET",
      data: options.body, 
    });

    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "An unexpected error occurred");
    }
    throw error;
  }
}

export default api;