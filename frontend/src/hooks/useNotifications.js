import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';
import { WS_BASE } from '../services/api';

export function useNotifications(userId) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
      onConnect: () => {
        client.subscribe(`/topic/notifications/${userId}`, (msg) => {
          const text = msg.body;
          const isPositive = text.toLowerCase().includes('positive');
          if (isPositive) {
            toast.error(`⚠️ ${text}`, { duration: 6000 });
          } else {
            toast.success(`✅ ${text}`, { duration: 6000 });
          }
        });
      },
      onDisconnect: () => console.log('WebSocket disconnected'),
      reconnectDelay: 5000,
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [userId]);
}
