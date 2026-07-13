import { Injectable, signal } from '@angular/core';

@Injectable()
export class SamCalculatorStateService {
  readonly activeId = signal<number | null>(null);

  toggle(id: number): void {
    this.activeId.update(current => (current === id ? null : id));
  }

  close(): void {
    this.activeId.set(null);
  }
}
