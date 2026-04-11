//frontend/src/api/axios.js
import axios from "axios";
const instance = axios.create({
  baseURL: "http://localhost:5000/api",
});
//ThisinterceptorrunsbeforeEVERY request.
//ItreadsthetokenfromlocalStorage and adds it to the Authorization header.
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  returnconfig;
});
exportdefaultinstance;
