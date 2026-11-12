import { Component, computed, input } from '@angular/core';

/**
 * Loading placeholder shared by the operator Home views. Mirrors the layout
 * classes of the real action card and shift card so swapping to real content
 * does not shift the layout.
 */
@Component({
  selector: 'app-home-shift-skeleton',
  templateUrl: './home-shift-skeleton.html',
})
export class HomeShiftSkeleton {
  /** Number of stat boxes of the real shift card (stamping: 4, production: 6). */
  readonly stats = input(4);
  readonly statSlots = computed(() => Array.from({ length: this.stats() }, (_, i) => i));
}
