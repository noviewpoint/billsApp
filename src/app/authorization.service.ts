import { Injectable } from '@angular/core';

/* https://toddmotto.com/angular-2-authentication */
/* TO DO */

@Injectable()
export class AuthorizationService {

  constructor() { }

  lock = null; // new Auth0Lock('YOUR_AUTH0_CLIENT_ID', 'YOUR_AUTH0_DOMAIN');

  login() {
    alert("Logging out, token saved to local storage");
    localStorage.setItem("profile", "David");
    localStorage.setItem("id_token", "123abc");
  }
  
  logout() {
    // To log out, we just need to remove
    // the user's profile and token
    alert("Logging out, token deleted from local storage");
    localStorage.removeItem("profile");
    localStorage.removeItem("id_token");
  }

}
