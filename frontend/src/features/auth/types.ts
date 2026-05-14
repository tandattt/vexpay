import type { UserInfo } from "../../shared/types";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: UserInfo;
}
