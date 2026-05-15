import { Component, Input, OnDestroy, Signal, signal } from '@angular/core';
import { LocationOption } from '../../common/classes/location-option';
import { WorkSpaceLoaderService } from '../../services/common/work-space-loader-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiCloseButton } from '../../shared/elements/ui-close-button/ui-close-button';
import { WorkSpaceLayoutService } from '../../services/common/work-space-layout-service';
import { ConfirmBox } from "../../shared/components/confirm-box/confirm-box";
import { Toast } from "../../shared/components/toast/toast";
import { TitleCasePipe } from '@angular/common';
import { Loader } from '../../shared/elements/loader/loader';
import { fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'app-work-space-layout',
  imports: [UiCloseButton, ConfirmBox, Toast, TitleCasePipe, Loader],
  templateUrl: './work-space-layout.html',
  styleUrl: './work-space-layout.css',
})
export class WorkSpaceLayout extends LocationOption implements OnDestroy {
  isLoading: Signal<boolean>;
  showHeader: Signal<boolean>;
  showSideContent = signal(false);
  showBackground = signal(true);
  isLargeScreen = signal(window.innerWidth >= 1024);

  private resizeSub: Subscription;

  @Input() headerVisible: boolean = false; // Esta variable se pone en true pa habilitar la visualización del header de la sección

  @Input()
  set backgroundVisible(value: boolean) {
    this.showBackground.set(value);
  }

  @Input()
  set sideContentVisible(value: boolean) {
    this.showSideContent.set(value);
  }

  constructor(
    private wslService: WorkSpaceLoaderService,
    private wsLayoutService: WorkSpaceLayoutService,
  ) {
    super();

    this.isLoading = toSignal(this.wslService.isLoading$, {
      initialValue: false,
    });

    this.showHeader = toSignal(this.wsLayoutService.showHeader$, {
      initialValue: true,
    });

    this.resizeSub = fromEvent(window, 'resize').subscribe(() => {
      this.isLargeScreen.set(window.innerWidth >= 1024);
    });
  }

  ngOnDestroy() {
    this.resizeSub.unsubscribe();
  }

  toggleHeader() {
    this.wsLayoutService.toggleHeader();
  }
}
