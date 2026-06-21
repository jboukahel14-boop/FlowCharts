import { getEchoInstance } from './echo.js';

export class PresenceService {
  constructor(workflowId, user) {
    this.workflowId = workflowId;
    this.user = user;
    this.channel = null;
    this.handlers = {
      here: [],
      joining: [],
      leaving: [],
      cursorMoved: [],
      viewportChanged: [],
      nodeDragged: [],
    };
  }

  join() {
    const echo = getEchoInstance();
    this.channel = echo.join(`workflow.${this.workflowId}`);

    this.channel
      .here((users) => {
        this._emit('here', users);
      })
      .joining((user) => {
        this._emit('joining', user);
      })
      .leaving((user) => {
        this._emit('leaving', user);
      })
      .listenForWhisper('cursor-moved', (e) => {
        this._emit('cursorMoved', e);
      })
      .listenForWhisper('viewport-changed', (e) => {
        this._emit('viewportChanged', e);
      })
      .listenForWhisper('node-dragged', (e) => {
        this._emit('nodeDragged', e);
      })
      .error((error) => {
        console.error('[PresenceService] Channel error:', error);
      });

    return this;
  }

  leave() {
    if (this.channel) {
      const echo = getEchoInstance();
      echo.leave(`workflow.${this.workflowId}`);
      this.channel = null;
    }
    return this;
  }

  whisper(event, data) {
    if (!this.channel) return;
    this.channel.whisper(event, {
      ...data,
      userId: this.user.id,
      userName: this.user.name,
      timestamp: Date.now(),
    });
  }

  broadcastCursor(position) {
    this.whisper('cursor-moved', { x: position.x, y: position.y });
  }

  broadcastViewport(viewport) {
    this.whisper('viewport-changed', {
      x: viewport.x,
      y: viewport.y,
      zoom: viewport.zoom,
    });
  }

  broadcastNodeDrag(nodeId, position) {
    this.whisper('node-dragged', { nodeId, x: position.x, y: position.y });
  }

  on(event, callback) {
    if (this.handlers[event]) {
      this.handlers[event].push(callback);
    }
    return this;
  }

  off(event, callback) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter((h) => h !== callback);
    }
    return this;
  }

  _emit(event, data) {
    for (const handler of this.handlers[event] || []) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[PresenceService] Error in handler for "${event}":`, err);
      }
    }
  }
}
