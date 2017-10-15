import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SeznamRacunovComponent } from './seznam-racunov/seznam-racunov.component';

@NgModule({
  declarations: [
    AppComponent,
    SeznamRacunovComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
