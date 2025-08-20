import { Injectable, signal } from '@angular/core';

export type Toast = { id: string; type: 'success' | 'error' | 'info' | 'warn'; title?: string; message: string; timeout?: number };

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toasts = signal<Toast[]>([]);
  private banner = signal<string | null>(null);

  get list() { return this.toasts; }

  // helper for templates/components to get the current array value
  getAll() { return this.toasts(); }

  // banner helpers (top-of-page notification)
  showBanner(message: string, timeout = 3000) {
    this.banner.set(message);
    if (timeout && timeout > 0) {
      setTimeout(() => this.hideBanner(), timeout);
    }
  }

  hideBanner() { this.banner.set(null); }

  getBanner() { return this.banner; }

  private push(t: Toast) {
    this.toasts.set([...(this.toasts()) , t]);
    if (t.timeout && t.timeout > 0) {
      setTimeout(() => this.remove(t.id), t.timeout);
    }
  }

  success(message: string, title?: string, timeout = 3000) { this.push({ id: Math.random().toString(36).slice(2,9), type: 'success', title, message, timeout }); }
  error(message: string, title?: string, timeout = 5000) { this.push({ id: Math.random().toString(36).slice(2,9), type: 'error', title, message, timeout }); }
  info(message: string, title?: string, timeout = 3000) { this.push({ id: Math.random().toString(36).slice(2,9), type: 'info', title, message, timeout }); }
  warn(message: string, title?: string, timeout = 4000) { this.push({ id: Math.random().toString(36).slice(2,9), type: 'warn', title, message, timeout }); }

  remove(id: string) {
    this.toasts.set(this.toasts().filter(t => t.id !== id));
  }
}
