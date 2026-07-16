import { Injectable, signal } from '@angular/core';

export interface SamCalculatorActive {
  id: number;
  samValue: string;
  clickX: number;
  clickY: number;
}

@Injectable()
export class SamCalculatorStateService {
  readonly active = signal<SamCalculatorActive | null>(null);

  open(active: SamCalculatorActive): void {
    this.active.update(current => (current?.id === active.id ? null : active));
  }

  close(): void {
    this.active.set(null);
  }
}
