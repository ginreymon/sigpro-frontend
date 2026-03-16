import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-operation-carousel',
  imports: [],
  templateUrl: './operation-carousel.html',
  styleUrl: './operation-carousel.css',
})
export class OperationCarousel {
  @ViewChild('container') container!: ElementRef;
  @ViewChild('track') track!: ElementRef;

  currentOffset = 0;
  cardWidth = 200;

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
