import { Injectable } from '@angular/core';

@Injectable()
export class SharedPodatkiService {

  constructor() {
    console.log("SHARED SERVICE constuctur");
    this.zacetek();
  }

  trenutniRacun;

  zacetek() {
    console.log("SHARED SERVICE!");
    this.resetirajRacun(); 
  }

  resetirajRacun() {
    this.trenutniRacun = {
      stranka: null,
      davcnaSt: null,
      naslov: null,
      postnaSt: null,
      mesto: null,
      drzava: null,
      datumIzdaje: null,
      datumStoritve: null,
      rokPlacila: null,
      storitve: [{
        name: null,
        quantity: null,
        price: null,
        VAT: "22"
      }],
      stRacuna: "2017-0000",
      znesek: "0,00",
      vpisal: "David"
    };
  }

}
