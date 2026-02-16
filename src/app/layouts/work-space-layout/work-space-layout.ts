import { Component, OnInit, signal } from '@angular/core';
import { LocationOption } from '../../common/classes/location-option';

@Component({
  selector: 'app-work-space-layout',
  imports: [],
  templateUrl: './work-space-layout.html',
  styleUrl: './work-space-layout.css',
})
export class WorkSpaceLayout extends LocationOption implements OnInit {
  isLoading = signal(false);
  showAsideContent = signal(false);
  isLoadingAside = signal(false);

  constructor() {
    super();
  }
  ngOnInit(): void {
    this.initialize();
  }
}
