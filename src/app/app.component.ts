import { Component } from '@angular/core';
import { AuthorizationService } from './authorization.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  /* https://toddmotto.com/angular-2-authentication */
  constructor(private authorization: AuthorizationService) { }

  login() {
    this.authorization.login();
  }
  logout() {
    this.authorization.logout();
  }

  user = 'David';
}
