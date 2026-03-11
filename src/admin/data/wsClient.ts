type WSMessage = {
  type: string;
  topic?: string;
  data?: unknown;
  [key: string]: unknown;
};

type WSHandler = (msg: WSMessage) => void;

class WSClient {
  private ws?: WebSocket;
  private connecting = false;
  private shouldReconnect = true;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private retry = 0;
  private topicHandlers = new Map<string, Set<WSHandler>>();
  private allHandlers = new Set<WSHandler>();
  private pendingTopics = new Set<string>();

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.connecting) return;
    const auth = this.getAuth();
    if (!auth.token) {
      this.scheduleReconnect();
      return;
    }
    this.connecting = true;
    const url = this.getWsUrl();
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.connecting = false;
      this.retry = 0;
      this.sendAuth();
      this.flushPendingSubscriptions();
    };
    this.ws.onmessage = (evt) => {
      const msg = this.safeParse(evt.data);
      if (!msg) return;
      this.allHandlers.forEach((fn) => fn(msg));
      const topic = typeof msg.topic === "string" ? msg.topic : "";
      if (topic && this.topicHandlers.has(topic)) {
        this.topicHandlers.get(topic)?.forEach((fn) => fn(msg));
      }
    };
    this.ws.onclose = () => {
      this.connecting = false;
      this.ws = undefined;
      if (this.shouldReconnect) this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
      this.ws?.close();
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  subscribe(topic: string, handler: WSHandler) {
    if (!topic) return;
    if (!this.topicHandlers.has(topic))
      this.topicHandlers.set(topic, new Set());
    this.topicHandlers.get(topic)?.add(handler);
    this.pendingTopics.add(topic);
    this.connect();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "subscribe", topic });
    }
  }

  unsubscribe(topic: string, handler?: WSHandler) {
    if (!topic) return;
    const set = this.topicHandlers.get(topic);
    if (set && handler) set.delete(handler);
    if (set && set.size === 0) {
      this.topicHandlers.delete(topic);
      this.pendingTopics.delete(topic);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: "unsubscribe", topic });
      }
    }
  }

  onMessage(handler: WSHandler) {
    this.allHandlers.add(handler);
  }

  offMessage(handler: WSHandler) {
    this.allHandlers.delete(handler);
  }

  send(payload: WSMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }

  private flushPendingSubscriptions() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.pendingTopics.forEach((topic) => {
      this.send({ type: "subscribe", topic });
    });
  }

  private sendAuth() {
    const auth = this.getAuth();
    if (!auth.token) return;
    this.send({ type: "auth", token: auth.token, tenant_id: auth.tenantId });
  }

  private getAuth() {
    const tokenKey = import.meta.env.VITE_TOKEN_KEY as string;
    const tenantKey = import.meta.env.VITE_TENANT_ID as string;
    const token = tokenKey ? localStorage.getItem(tokenKey) : "";
    const tenantId = tenantKey ? localStorage.getItem(tenantKey) : "default";
    return { token, tenantId };
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(10000, 1000 * Math.pow(2, this.retry));
    this.reconnectTimer = setTimeout(() => {
      this.retry += 1;
      this.connect();
    }, delay);
  }

  private safeParse(data: unknown): WSMessage | null {
    if (typeof data !== "string") return null;
    try {
      const obj = JSON.parse(data);
      if (!obj || typeof obj !== "object") return null;
      if (!("type" in obj)) return null;
      return obj as WSMessage;
    } catch {
      return null;
    }
  }

  private getWsUrl() {
    const base =
      (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;
    const url = new URL(base, window.location.origin);
    const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.protocol = wsProtocol;
    const path = url.pathname.replace(/\/+$/, "");
    const withV1 = path.endsWith("/v1") ? path : `${path}/v1`;
    url.pathname = `${withV1}/ws`;
    url.search = "";
    return url.toString();
  }
}

export const wsClient = new WSClient();
export type { WSMessage, WSHandler };
