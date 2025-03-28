import axios from "axios";

export const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_BACKEND_URL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});