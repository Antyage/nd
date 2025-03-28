import axios, { AxiosInstance } from "axios"
import { getAuthorizationHeader } from "../utils/getAuthorizationHeader"
import { jwtDecode } from "jwt-decode";

export class AuthService {
  private instance: AxiosInstance;

  constructor(url: string) {
    this.instance = axios.create({
      baseURL: url,
      timeout: 30000,
      timeoutErrorMessage: "Time out!",
    });
  }

  login = async (walletAddr: any) => {
    return this.instance
      .post("/login", {
        walletAddr
      })
      .then((res) => {
        const decodedToken = jwtDecode(res.data.token.replace("Bearer ", ""))
        localStorage.setItem('token', res.data.token.replace("Bearer ", ""))

        
        return {
          // @ts-ignore
          userId: decodedToken.userId,
          // @ts-ignore
          username: decodedToken.username,
          // @ts-ignore
          avatar: decodedToken.avatar,
          exp: decodedToken.exp,
          iat: decodedToken.iat
        }
      });
  };

  getMe = async (userId: any) => {
    return this.instance
      .get(`/users/${userId}`, {
        headers: getAuthorizationHeader(),
      })
      .then((res) => {
        return res.data;
      });
  };

  uploadAvatar = (userId: any, newAvatar: any) => {
    const formData = new FormData();
    formData.append("file", newAvatar);
    return this.instance
      .post(`/users/${userId}/upload`, formData, {
        headers: getAuthorizationHeader(),
      })
      .then((res) => {
        return {
          newAvatar: res.data.data.url,
        };
      });
  };
}
