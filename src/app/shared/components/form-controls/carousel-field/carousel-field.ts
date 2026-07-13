import { Component, Input, ViewChild } from '@angular/core';
import { UiFormField } from '../../../elements/ui-form-field/ui-form-field';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { OperationCarousel } from '../../widgets/operation-carousel/operation-carousel';

@Component({
  selector: 'app-carousel-field',
  imports: [UiFormField, UiButton, UiIcon, OperationCarousel],
  templateUrl: './carousel-field.html',
  styleUrl: './carousel-field.css',
})
export class CarouselField {
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() showNav = true;
  @Input() selectedIndex: number | null = null;

  @ViewChild(OperationCarousel) private carousel!: OperationCarousel;

  prev(): void {
    this.carousel.prev();
  }

  next(): void {
    this.carousel.next();
  }
}
