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

// Client-side Pusher instance
export const pusherClient = new PusherClient(
  key,
  {
    cluster,
  }
); 