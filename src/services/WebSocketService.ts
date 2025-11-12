import SockJS from 'sockjs-client';
import { Client, IMessage } from 'stompjs';
import { BookingDTO } from '@/lib/api';

declare var Stomp: any;

export interface WebSocketMessage {
  type: 'BOOKING_UPDATE' | 'NEW_BOOKING' | 'BOOKING_CONFIRMED' | 'BOOKING_COMPLETED' | 'BOOKING_CANCELLED';
  payload: BookingDTO;
}

export class WebSocketService {
  private stompClient: Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isConnected = false;
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map();

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      const socket = new SockJS('http://localhost:8080/ws');
      this.stompClient = Stomp.over(socket);

      // Disable debug logs in production
      this.stompClient.debug = () => {};

      this.stompClient.connect(
        {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        (frame: any) => {
          console.log('Connected to WebSocket:', frame);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.subscribeToTopics();
        },
        (error: any) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          this.handleReconnect();
        }
      );
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.');
    }
  }

  private subscribeToTopics(): void {
    if (!this.stompClient || !this.isConnected) return;

    // Subscribe to general booking updates
    this.stompClient.subscribe('/topic/bookings/new', (message: IMessage) => {
      const booking: BookingDTO = JSON.parse(message.body);
      this.notifyHandlers({
        type: 'NEW_BOOKING',
        payload: booking
      });
    });

    // Subscribe to nearby bookings
    this.stompClient.subscribe('/topic/bookings/nearby', (message: IMessage) => {
      const notification = JSON.parse(message.body);
      this.notifyHandlers({
        type: 'NEW_BOOKING',
        payload: notification.booking
      });
    });

    // Subscribe to booking confirmations
    this.stompClient.subscribe('/topic/bookings/confirmed/*', (message: IMessage) => {
      const booking: BookingDTO = JSON.parse(message.body);
      this.notifyHandlers({
        type: 'BOOKING_CONFIRMED',
        payload: booking
      });
    });

    // Subscribe to booking cancellations
    this.stompClient.subscribe('/topic/bookings/cancelled/*', (message: IMessage) => {
      const booking: BookingDTO = JSON.parse(message.body);
      this.notifyHandlers({
        type: 'BOOKING_CANCELLED',
        payload: booking
      });
    });

    // Subscribe to user-specific booking updates
    this.stompClient.subscribe('/user/queue/bookings', (message: IMessage) => {
      const booking: BookingDTO = JSON.parse(message.body);
      this.notifyHandlers({
        type: 'BOOKING_UPDATE',
        payload: booking
      });
    });
  }

  private notifyHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  public addMessageHandler(id: string, handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers.set(id, handler);
  }

  public removeMessageHandler(id: string): void {
    this.messageHandlers.delete(id);
  }

  public sendMessage(destination: string, body: any): void {
    if (this.stompClient && this.isConnected) {
      this.stompClient.send(destination, {}, JSON.stringify(body));
    } else {
      console.warn('WebSocket not connected. Message not sent:', destination, body);
    }
  }

  public disconnect(): void {
    if (this.stompClient && this.isConnected) {
      this.stompClient.disconnect(() => {
        console.log('Disconnected from WebSocket');
        this.isConnected = false;
      });
    }
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  public reconnect(): void {
    if (!this.isConnected) {
      this.reconnectAttempts = 0;
      this.connect();
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
