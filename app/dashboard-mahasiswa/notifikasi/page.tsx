import type { Metadata } from "next";
import NotificationPage from "@/components/notifications/NotificationPage";
export const metadata: Metadata = { title: "Notifikasi | Student Early Warning AI" };
export default function StudentNotifications() { return <NotificationPage />; }
