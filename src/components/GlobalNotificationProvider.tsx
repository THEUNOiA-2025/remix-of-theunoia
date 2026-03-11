import { useGlobalMessageNotification } from "@/hooks/useGlobalMessageNotification";
import { useAuth } from "@/contexts/AuthContext";

export const GlobalNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  // Only set up notifications for authenticated users
  if (user) {
    return <NotificationListener>{children}</NotificationListener>;
  }
  
  return <>{children}</>;
};

// Separate component to use the hook only when authenticated
const NotificationListener = ({ children }: { children: React.ReactNode }) => {
  useGlobalMessageNotification();
  return <>{children}</>;
};
