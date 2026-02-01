
import { Centers } from "./Centers";
import { Employees } from "./Employees";
import { Stores } from "./Stores";

export interface Notifications {
  id: number;
  title: string;
  message: string;
  type: "system" | "alert" | "reminder" | "announcement" | "task";
  priority: "low" | "medium" | "high" | "urgent";
  status: "unread" | "read" | "archived" | "deleted";
  metadata: object;
  actionUrl: string;
  icon: string;
  isBroadcast: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  readAt: Date;
  center: Centers;
  employee: Employees;
  store: Stores;
}
