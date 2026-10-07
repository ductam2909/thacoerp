import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { ENV } from "../config/env";
import { getStorage } from "../utils/storage";

const API_BASE_URL = ENV.API_URL.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
export const NOTIFICATION_HUB_URL = `${API_BASE_URL}/hubs/notification`;

class SignalRService {
  connection = null;
  subscriptions = new Map();

  async connect(url = NOTIFICATION_HUB_URL) {
    if (!url) {
      throw new Error("SignalR hub URL is required.");
    }
    if (this.connection?.state === HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.connection?.state === HubConnectionState.Connecting) {
      return this.connection.start().then(() => this.connection);
    }

    const token = getStorage("accessToken");
    this.connection = new HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: () => getStorage("accessToken") || token || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.None)
      .build();

    await this.connection.start();
    return this.connection;
  }

  async disconnect() {
    if (!this.connection) return;
    await this.connection.stop();
    this.connection = null;
  }

  async on(methodName, handler, url) {
    const connection = await this.connect(url || NOTIFICATION_HUB_URL);
    connection.on(methodName, handler);

    if (!this.subscriptions.has(methodName)) {
      this.subscriptions.set(methodName, new Set());
    }
    this.subscriptions.get(methodName).add(handler);

    return () => this.off(methodName, handler);
  }

  off(methodName, handler) {
    if (!this.connection) return;
    this.connection.off(methodName, handler);
    this.subscriptions.get(methodName)?.delete(handler);
  }

  async invoke(methodName, ...args) {
    const connection = await this.connect();
    return connection.invoke(methodName, ...args);
  }

  async send(methodName, ...args) {
    const connection = await this.connect();
    return connection.send(methodName, ...args);
  }
}

export const signalRService = new SignalRService();
export default signalRService;
