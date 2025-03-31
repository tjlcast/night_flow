// utils/websocket.ts
export class WorkflowWebSocket {
    private socket: WebSocket | null = null;
    private url: string;
    
    constructor(workflowId: string) {
      this.url = `ws://localhost:8000/workflow/runtime/${workflowId}`;
    }
  
    connect(onMessage: (data: any) => void) {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
      };
  
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        onMessage(message);
      };
  
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
  
      this.socket.onclose = () => {
        console.log('WebSocket closed');
      };
    }
  
    close() {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
    }
  }