import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts],
  template: `<router-outlet /><app-toasts />`,
})
export class App {}
