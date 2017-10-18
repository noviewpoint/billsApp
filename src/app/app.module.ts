import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { SeznamRacunovComponent } from './seznam-racunov/seznam-racunov.component';
import { NovRacunComponent } from './nov-racun/nov-racun.component';
import { ApiCallsService } from './api-calls.service';
import { IskanjePipe } from './iskanje.pipe';

@NgModule({
  declarations: [
    AppComponent,
    SeznamRacunovComponent,
    NovRacunComponent,
    IskanjePipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RouterModule.forRoot([ // undefined routes vrzejo napako v konzolo, app dela naprej
      {
        path: '',
        redirectTo: 'seznam',
        pathMatch: 'full'
      },
      {
        path: 'seznam',
        component: SeznamRacunovComponent
      },
      {
        path: 'nov',
        component: NovRacunComponent
      }
    ], {
      useHash: true /* NUJNO! Brez tega '/#' ob menjavi routa requestas node server za page, ki ga ta nima! */
    }),
    BrowserAnimationsModule,
    NgbModule.forRoot()
  ],
  providers: [ApiCallsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
