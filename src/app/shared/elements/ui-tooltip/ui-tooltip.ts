import { Component, HostListener, inject, Input, ElementRef } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-ui-tooltip',
  imports: [NgStyle],
  templateUrl: './ui-tooltip.html',
  styleUrl: './ui-tooltip.css',
})
export class UiTooltip {
  @Input() tooltip: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() message: string = '';
  @Input() escape = false;

  private el = inject(ElementRef);
  protected fixedStyle: Record<string, string> = {};
  protected isHovered = false;

  @HostListener('mouseenter')
  onEnter(): void {
    if (!this.escape) return;
    const rect: DOMRect = this.el.nativeElement.getBoundingClientRect();
    this.fixedStyle = this.computeFixedStyle(rect);
    this.isHovered = true;
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.isHovered = false;
  }

  private computeFixedStyle(rect: DOMRect): Record<string, string> {
    const base = { position: 'fixed', zIndex: '9999' };
    switch (this.tooltip) {
      case 'bottom':
        return { ...base, top: `${rect.bottom + 8}px`, left: `${rect.left + rect.width / 2}px`, transform: 'translateX(-50%)' };
      case 'left':
        return { ...base, top: `${rect.top + rect.height / 2}px`, left: `${rect.left - 8}px`, transform: 'translateX(-100%) translateY(-50%)' };
      case 'right':
        return { ...base, top: `${rect.top + rect.height / 2}px`, left: `${rect.right + 8}px`, transform: 'translateY(-50%)' };
      default:
        return { ...base, top: `${rect.top - 8}px`, left: `${rect.left + rect.width / 2}px`, transform: 'translateX(-50%) translateY(-100%)' };
    }
  }

  get tooltipPosition(): string {
    switch (this.tooltip) {
      case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':   return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':  return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:       return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  }
}
