import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Using hardcoded values for Pusher configuration
const appId = "1993781";
const key = "0e7bfe8f3a925a36891a";
const secret = "65ab4da22e9e5ad9191b";
const cluster = "ap2";

// Server-side Pusher instance
export const pusherServer = new PusherServer({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});

// Enable Pusher client logging in development
if (process.env.NODE_ENV !== 'production') {
  PusherClient.logToConsole = true;
}

// Client-side Pusher instance with better error handling
export const pusherClient = new PusherClient(
  key,
  {
    cluster,
    enabledTransports: ["ws", "wss"],
  }
);

// Add global error handling for Pusher client
pusherClient.connection.bind('error', (err: any) => {
  console.error('Pusher connection error:', err);
});

// Channel naming conventions
export const CHANNEL_TYPES = {
  USER: 'user',               // For user-specific notifications
  ADMIN: 'admin',             // For admin notifications
  EMPLOYEE: 'employee',       // For employee notifications
  BOOKING: 'booking',         // For booking-related updates
  PAYMENT: 'payment'          // For payment notifications
};

// Event types
export const EVENT_TYPES = {
  NEW_NOTIFICATION: 'new-notification',
  NOTIFICATION_STATUS_UPDATED: 'notification-status-updated',
  BOOKING_UPDATED: 'booking-updated',
  PAYMENT_RECEIVED: 'payment-received',
  SERVICE_COMPLETED: 'service-completed',
  BOOKING_CANCELLED: 'booking-cancelled',
  TASK_ASSIGNED: 'task-assigned'
};

// Helper functions for channel names
export function getUserChannel(userId: string) {
  return `${CHANNEL_TYPES.USER}-${userId}`;
}

export function getAdminChannel() {
  return `${CHANNEL_TYPES.ADMIN}-notifications`;
}

export function getEmployeeChannel(employeeId: string) {
  return `${CHANNEL_TYPES.EMPLOYEE}-${employeeId}`;
}

export function getBookingChannel(bookingId: string) {
  return `${CHANNEL_TYPES.BOOKING}-${bookingId}`;
} 