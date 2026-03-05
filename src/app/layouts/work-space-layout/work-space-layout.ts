import { Component, Input, OnInit, Signal, signal } from '@angular/core';
import { LocationOption } from '../../common/classes/location-option';
import { WorkSpaceLoaderService } from '../../services/common/work-space-loader-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiCloseButton } from '../../shared/elements/ui-close-button/ui-close-button';
import { DialogService } from '../../services/common/dialog-service';


@Component({
  selector: 'app-work-space-layout',
  imports: [UiCloseButton],
  templateUrl: './work-space-layout.html',
  styleUrl: './work-space-layout.css',
})
export class WorkSpaceLayout extends LocationOption implements OnInit {
  isLoading!: Signal<boolean>;
  showHeader!: Signal<boolean>; 
  _showAsideContent = signal(false);
  isLoadingAside = signal(false);

  @Input() set showAsideContent(value:boolean){
    this._showAsideContent.set(value);
  }

  constructor(private wslService: WorkSpaceLoaderService,private dialogService:DialogService) {
    super();
    this.isLoading = toSignal(this.wslService.isLoading$, { initialValue: false });
    this.showHeader = toSignal(this.wslService.showFullHeight$, { initialValue: true });
  }

  ngOnInit(): void {
    this.initialize();
  }

  toggleHeader() {   
    this.wslService.toggleFullHeight();
  }
}
