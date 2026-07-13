import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Menu } from '../menu/menu';
import { RouterOutlet } from '@angular/router';
import { ConfirmBox } from "../../shared/components/confirm-box/confirm-box";
import { Toast } from "../../shared/components/toast/toast";
import { UiLoader } from "../../shared/elements/ui-loader/ui-loader";

@Component({
  selector: 'app-layout',
  imports: [Header, Menu, RouterOutlet, ConfirmBox, Toast, UiLoader],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {}
