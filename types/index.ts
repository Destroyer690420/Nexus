export type UserRole = "student" | "faculty" | "admin";

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: number;
  approved?: boolean;
}
