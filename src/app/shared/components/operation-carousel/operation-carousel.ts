import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'app-operation-carousel',
  imports: [],
  templateUrl: './operation-carousel.html',
  styleUrl: './operation-carousel.css',
})
export class OperationCarousel implements OnDestroy {
  @ViewChild('container') container!: ElementRef;
  @ViewChild('track') track!: ElementRef;

  currentOffset = 0;
  cardWidth = 200;
  isLargeScreen = signal(window.innerWidth >= 1024);

  private resizeSub: Subscription;

  constructor() {
    this.resizeSub = fromEvent(window, 'resize').subscribe(() => {
      this.isLargeScreen.set(window.innerWidth >= 1024);
    });
  }

  ngOnDestroy() {
    this.resizeSub.unsubscribe();
  }

  next() {
    const containerWidth = this.container.nativeElement.offsetWidth;
    const trackWidth = this.track.nativeElement.scrollWidth;

    const maxOffset = trackWidth - containerWidth;

    const nextOffset = this.currentOffset + this.cardWidth;

    this.currentOffset = Math.min(nextOffset, maxOffset);
  }

  prev() {
    const prevOffset = this.currentOffset - this.cardWidth;
    this.currentOffset = Math.max(0, prevOffset);
  }
}
