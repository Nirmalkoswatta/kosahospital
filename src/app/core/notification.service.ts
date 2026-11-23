import { Injectable, signal } from '@angular/core';

export type Toast = { id: string; type: 'success' | 'error' | 'info' | 'warn'; title?: string; message: string };

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly list = signal<Toast[]>([]);

  private push(type: Toast['type'], message: string, title?: string, timeout = 4000) {
    const id = crypto.randomUUID();
    this.list.update((l) => [...l, { id, type, title, message }]);
    setTimeout(() => this.remove(id), timeout);
  }

  success(message: string, title?: string) { this.push('success', message, title); }
  error(message: string, title?: string) { this.push('error', message, title, 6000); }
  info(message: string, title?: string) { this.push('info', message, title); }
  warn(message: string, title?: string) { this.push('warn', message, title, 5000); }

  /** Run a store action and toast its error message instead of throwing. */
  attempt<T>(fn: () => T, ok?: string): T | undefined {
    try {
      const r = fn();
      if (ok) this.success(ok);
      return r;
    } catch (e) {
      this.error((e as Error).message);
      return undefined;
    }
  }

  remove(id: string) { this.list.update((l) => l.filter((t) => t.id !== id)); }
}
