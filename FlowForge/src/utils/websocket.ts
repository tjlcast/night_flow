// utils/websocket.ts
export class WorkflowWebSocket {
  private socket: WebSocket | null = null;
  private messageHandler: (message: any) => void;
  private url: string;

  constructor(
    workflowId: string,
    private onOpenCallback?: () => void,
    private onCloseCallback?: () => void
  ) {
    const ip = import.meta.env.VITE_WORKFLOW_IP;
    const port = import.meta.env.VITE_WORKFLOW_PORT;
    this.url = `ws://${ip}:${port}/workflow/runtime/${workflowId}`;
    this.messageHandler = () => {};
  }

  connect(messageHandler: (message: any) => void) {
    this.messageHandler = messageHandler;
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.onOpenCallback?.();
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.messageHandler(message);
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket closed");
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  send(data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  close() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }
}
