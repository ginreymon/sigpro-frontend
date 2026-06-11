import { Component, computed, effect, HostListener, inject, Input, signal } from '@angular/core';
import { SamCalculatorStateService } from './sam-calculator-state';

@Component({
  selector: 'app-sam-target-calculator',
  templateUrl: './sam-target-calculator.html',
})
export class SamTargetCalculator {
  @Input({ required: true }) samValue!: string | null;
  @Input() calcId: number | null = null;

  private stateService = inject(SamCalculatorStateService, { optional: true });
  private _localOpen = signal(false);
  private triggerEl: HTMLElement | null = null;
  private readonly scrollHandler = (): void => this.updatePosition();

  intervalo = signal<number>(60);
  operarios = signal<number>(1);
  dropdownStyle: Record<string, string> = {};

  isOpen = computed(() => {
    if (this.calcId !== null && this.stateService) {
      return this.stateService.activeId() === this.calcId;
    }
    return this._localOpen();
  });

  targetUnits = computed(() => {
    const sam = Number(this.samValue);
    if (!sam || sam <= 0) return null;
    if (this.intervalo() <= 0) return '0';
    return ((this.intervalo() * this.operarios()) / sam).toFixed(1);
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        document.removeEventListener('scroll', this.scrollHandler, true);
      }
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (!this.isOpen()) return;
    if (this.calcId !== null && this.stateService) {
      this.stateService.close();
    } else {
      this._localOpen.set(false);
    }
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.isOpen()) {
      this.triggerEl = event.currentTarget as HTMLElement;
      this.updatePosition();
      document.addEventListener('scroll', this.scrollHandler, true);
    }
    if (this.calcId !== null && this.stateService) {
      this.stateService.toggle(this.calcId);
    } else {
      this._localOpen.update(v => !v);
    }
  }

  stopProp(event: MouseEvent): void {
    event.stopPropagation();
  }

  private updatePosition(): void {
    if (!this.triggerEl) return;
    const rect = this.triggerEl.getBoundingClientRect();
    const DROPDOWN_HEIGHT = 160;
    const OFFSET = 4;

    const style: Record<string, string> = {
      position: 'fixed',
      zIndex: '9999',
      width: '192px',
      left: `${rect.left}px`,
    };

    if (rect.bottom + OFFSET + DROPDOWN_HEIGHT <= window.innerHeight) {
      style['top'] = `${rect.bottom + OFFSET}px`;
    } else {
      style['bottom'] = `${window.innerHeight - rect.top + OFFSET}px`;
    }

    this.dropdownStyle = style;
  }
}
