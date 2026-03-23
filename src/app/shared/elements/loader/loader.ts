import { Component, Input } from '@angular/core';
import { LoaderService } from '../../../services/common/loader-service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [],
  templateUrl: './loader.html',
  styleUrl: './loader.css',
})
export class Loader {
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
