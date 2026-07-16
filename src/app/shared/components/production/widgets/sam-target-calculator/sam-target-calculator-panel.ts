import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { SamCalculatorStateService } from './sam-calculator-state';

const MOBILE_BREAKPOINT = 640;
const CARD_WIDTH = 224;
const CARD_HEIGHT = 180;
const OFFSET = 8;
const MARGIN = 8;

@Component({
  selector: 'app-sam-target-calculator-panel',
  templateUrl: './sam-target-calculator-panel.html',
  host: { style: 'display: contents' },
})
export class SamTargetCalculatorPanel {
  private stateService = inject(SamCalculatorStateService);

  active = this.stateService.active;
  intervalo = signal<number>(60);
  operarios = signal<number>(1);

  targetUnits = computed(() => {
    const sam = Number(this.active()?.samValue);
    if (!sam || sam <= 0) return null;
    if (this.intervalo() <= 0) return '0';
    return ((this.intervalo() * this.operarios()) / sam).toFixed(1);
  });

  private readonly reposition = (): void => {};

  constructor() {
    effect(() => {
      if (this.active()) {
        window.addEventListener('scroll', this.reposition, true);
        window.addEventListener('resize', this.reposition);
      } else {
        window.removeEventListener('scroll', this.reposition, true);
        window.removeEventListener('resize', this.reposition);
      }
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.active()) this.stateService.close();
  }

  stopProp(event: MouseEvent): void {
    event.stopPropagation();
  }

  panelStyle(): Record<string, string> | null {
    const active = this.active();
    if (!active) return null;
    return this.isMobile() ? this.calcSheetStyle() : this.calcCardStyle(active.clickX, active.clickY);
  }

  private isMobile(): boolean {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }

  private calcSheetStyle(): Record<string, string> {
    return {
      position: 'fixed',
      zIndex: '9999',
      left: '0',
      right: '0',
      bottom: '0',
      width: '100%',
      maxHeight: '70vh',
      overflowY: 'auto',
      borderRadius: '16px 16px 0 0',
    };
  }

  private calcCardStyle(clickX: number, clickY: number): Record<string, string> {
    const maxLeft = window.innerWidth - CARD_WIDTH - MARGIN;
    const style: Record<string, string> = {
      position: 'fixed',
      zIndex: '9999',
      width: `${CARD_WIDTH}px`,
      left: `${Math.max(MARGIN, Math.min(clickX, maxLeft))}px`,
    };
    if (clickY + OFFSET + CARD_HEIGHT <= window.innerHeight) {
      style['top'] = `${clickY + OFFSET}px`;
    } else {
      style['bottom'] = `${Math.max(MARGIN, window.innerHeight - clickY + OFFSET)}px`;
    }
    return style;
  }
}
