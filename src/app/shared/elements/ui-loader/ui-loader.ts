import { Component, Input } from '@angular/core';
import { LoaderService } from '../../../services/common/loader-service';

@Component({
  selector: 'app-ui-loader',
  standalone: true,
  imports: [],
  templateUrl: './ui-loader.html',
  styleUrl: './ui-loader.css',
})
export class UiLoader {
  private localShowLoader: boolean = false;

  @Input()
  set showLoader(value: boolean) {
    this.localShowLoader = value;
  }

  constructor(private loaderService: LoaderService) { }

  get showLoader() {
    return this.localShowLoader || this.loaderService.loaderVisible() || false;
  }
}
