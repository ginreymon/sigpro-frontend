import { Directive, Input } from '@angular/core';

@Directive()
export abstract class TooltipBase {
  @Input() tooltip: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() message: string = '';

  protected get tooltipPosition(): string {
    switch (this.tooltip) {
      case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':   return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':  return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:       return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  }

  protected computeFixedStyle(rect: DOMRect): Record<string, string> {
    const base: Record<string, string> = { position: 'fixed', zIndex: '9999' };
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
}
