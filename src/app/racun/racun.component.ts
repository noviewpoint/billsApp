import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiCallsService } from '../api-calls.service';
import { FormArray, FormBuilder } from '@angular/forms'; // za dinamicno dodajanje inputov
import { NgbModule, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { SharedPodatkiService } from '../shared-podatki.service';
/* https://alligator.io/angular/query-parameters/ */
import { ActivatedRoute } from '@angular/router';
import 'rxjs/add/operator/filter';
// import { NgStyle } from '@angular/common';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/merge';

@Component({
  selector: 'app-racun',
  templateUrl: './racun.component.html',
  styleUrls: ['./racun.component.css']
})
export class RacunComponent implements OnInit {

  constructor(
    private builder: FormBuilder,
    private service: ApiCallsService,
    private modalService: NgbModal,
    private router: Router,
    private shared: SharedPodatkiService,
    private activatedRoute: ActivatedRoute
  ) { }

  naslovTekst = null;
  okGumbTekst = null;
  obrazec: FormGroup;
  formChangedCounter = 0;
  modalText = {
    "header": null,
    "body": null
  };
  modalAnimationFlag = false;
  editId: string;

  searching = false;
  searchFailed = false;
  hideSearchingWhenUnsubscribed = new Observable(() => () => this.searching = false);

  // inputFormatter = (x: {stranka: string}) => x.stranka;
  // resultFormatter = (x: {stranka: string}) => x.stranka;

  search = (text$: Observable<any>) =>
    text$
      .debounceTime(300)
      .distinctUntilChanged()
      .do((text) => {
        console.log(text);
        this.searching = true
      })
      .switchMap(term =>
        this.service.getClients(term)
          .do(() => this.searchFailed = false)
          .catch(() => {
            this.searchFailed = true;
            return Observable.of([]);
          }))
      .do(() => this.searching = false)
      .merge(this.hideSearchingWhenUnsubscribed);

  openModal(content) {
    console.log("Opened Modal!");
    this.modalService.open(content).result.then((result) => {
      console.log(`Closed with: ${result}`);
      if(result === "OK") {
        this.resetirajForm();
      } else if ("Close click") {
        this.router.navigate(["/seznam"]);
      }
    }, (reason) => {
      console.log(`Dismissed ${this.getDismissReason(reason)}`);
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  ngOnInit() {
    console.log("ngOnInit()");
    document.body.style.background = '#F8F8FF'; // Ghost White

    if(this.checkUrlParameters()) {
      this.editId = this.shared.trenutniRacun._id;
      this.naslovTekst = "Urejanje računa";
      this.okGumbTekst = "Posodobi";
    } else {
      this.editId = "";
      this.naslovTekst = "Vnos računa";
      this.okGumbTekst = "Izdaj";      
    }

    this.napolniForm();
    this.obrazec.valueChanges.subscribe(this.poslusajZaSpremembrami.bind(this)); // MORA BITI BINDAN KONTEKST!
    this.poslusajZaSpremembrami(this.obrazec.value); // 1x izvedi na zacetku
  }

  checkUrlParameters() {
    var x = false;
    this.activatedRoute.queryParams
      .filter(params => params.st)
      .subscribe(params => { // a ni to asinhrona koda?? cudno
        x = true;
      });
    return x;
  }

  napolniForm() {

    console.log("napolniForm()");

    var data = Object.assign({}, this.shared.trenutniRacun); // prekine referenco!
    console.log("Iz servica pridobljeni podatki o formu so:", data);

    this.obrazec = this.builder.group({
      stranka: new FormControl(data.stranka, Validators.compose([
        Validators.required
      ])),
      davcnaSt: new FormControl(data.davcnaSt, Validators.compose([
        Validators.required,
        Validators.pattern("\\d{8}") /* davcna je 8-mestna st. */
      ])),
      naslov: new FormControl(data.naslov, Validators.compose([
        Validators.required
      ])),
      postnaSt: new FormControl(data.postnaSt, Validators.compose([
        Validators.required,
        Validators.pattern("\\d{4}") /* posta je 4-mestna st. */
      ])),
      mesto: new FormControl(data.mesto, Validators.compose([
        Validators.required
      ])),
      drzava: new FormControl(data.drzava, Validators.compose([
        Validators.required
      ])),
      datumIzdaje: new FormControl(this.convertYearMonthDayReverse(data.datumIzdaje), Validators.compose([
        Validators.required,
        // Validators.pattern("\\d{4}-\\d{2}-\\d{2}") /* yyyy-mm-dd */
        // datume avtomatsko validira ngbootstrap
      ])),
      datumStoritve: new FormControl(this.convertYearMonthDayReverse(data.datumStoritve), Validators.compose([
        Validators.required
      ])),
      rokPlacila: new FormControl(this.convertYearMonthDayReverse(data.rokPlacila), Validators.compose([
        Validators.required
      ])),
      
      storitve: this.builder.array([]),

      stRacuna: new FormControl(data.stRacuna, Validators.compose([
        //Validators.required,
        //Validators.pattern("\\d{4}-\\d{4}") /* npr. 0000-2017 */
      ])),
      znesek: new FormControl(data.znesek, Validators.compose([
        Validators.required,
        Validators.pattern("^(0|[1-9][0-9]{0,2}(?:(\\.[0-9]{3})*|[0-9]*))(,[0-9]+){0,1}$")
        /* https://stackoverflow.com/questions/5917082/regular-expression-to-match-numbers-with-or-without-commas-and-decimals-in-text */
        /* https://stackoverflow.com/questions/16060191/regex-for-a-valid-numeric-with-optional-commas-dot */
      ])),
      vpisal: new FormControl(data.vpisal, Validators.compose([
        //Validators.required,
      ]))
    });

    for (let i = 0, length = data.storitve.length; i < length; i++) {
      this.addNewRow(i);
    }

  }

  resetirajForm() {
    this.obrazec.reset();
    this.shared.resetirajRacun();
    this.napolniForm();

    this.naslovTekst = "Vnos računa";
    this.okGumbTekst = "Izdaj"; 
  }

  initPosamicnaStoritev(index) {
    console.log("initPosamicnaStoritev()", index);
    var data = Object.assign({}, this.shared.trenutniRacun); // prekine referenco!

    if (index === undefined) {
      data.storitve.push({
        name: null,
        quantity: null,
        price: null,
        VAT: "22"
      });
      index = data.storitve.length - 1;
    }

    return this.builder.group({
      name: new FormControl(data.storitve[index].name, Validators.compose([
        Validators.required
      ])),
      quantity: new FormControl(this.replaceCharNumbers(data.storitve[index].quantity, ".", ","), Validators.compose([
        Validators.required,
        Validators.pattern("^(0|[1-9][0-9]{0,2}(?:(\\.[0-9]{3})*|[0-9]*))(,[0-9]+){0,1}$")
      ])),
      price: new FormControl(this.replaceCharNumbers(data.storitve[index].price, ".", ","), Validators.compose([
        Validators.required,
        Validators.pattern("^(0|[1-9][0-9]{0,2}(?:(\\.[0-9]{3})*|[0-9]*))(,[0-9]+){0,1}$")
      ])),
      VAT: new FormControl(this.replaceCharNumbers(data.storitve[index].VAT, ".", ","), Validators.compose([
        Validators.required,
        Validators.pattern("^(0|[1-9][0-9]{0,2}(?:(\\.[0-9]{3})*|[0-9]*))(,[0-9]+){0,1}$")
      ])),
    });
  }

  poslusajZaSpremembrami(data) {
    console.log("poslusajZaSpremembrami()");
    this.formChangedCounter++;
    if (this.formChangedCounter === 1) {
      var skupnaCena = 0;
      for (let e of data.storitve) {
        var a = Number(this.replaceCharNumbers(e.quantity, ",", "."));
        var b = Number(this.replaceCharNumbers(e.price, ",", "."));
        var c = Number(this.replaceCharNumbers(e.VAT, ",", "."));
        skupnaCena += a * b * ( 1 + c / 100);
      }
      var skupnaCenaString = this.replaceCharNumbers(skupnaCena.toFixed(2), ".", ",");
      this.obrazec.patchValue({znesek: skupnaCenaString});
      this.formChangedCounter = 0;
      console.log(this.obrazec.value);
    }
  }
  
  submitBill(formData, modalContent) {
    console.log("submitBill()");

    var x = Object.assign({}, formData); // prekine referenco!

    x.datumIzdaje = this.convertYearMonthDay(x.datumIzdaje);
    x.datumStoritve = this.convertYearMonthDay(x.datumStoritve);
    x.rokPlacila = this.convertYearMonthDay(x.rokPlacila);

    x.znesek = this.replaceCharNumbers(x.znesek, ",", ".");

    for (let e of x.storitve) {
      e.quantity = this.replaceCharNumbers(e.quantity, ",", ".");
      e.price = this.replaceCharNumbers(e.price, ",", ".");
      e.VAT = this.replaceCharNumbers(e.VAT, ",", ".");
    }

    console.table(x);

    this.modalText.header = "Prosimo počakajte";
    this.modalText.body = "Aplikacija poskuša komunicirati z vašo podatkovno bazo.";
    this.modalAnimationFlag = true;
    this.openModal(modalContent);

    if (this.editId !== "") {
      this.service.putBill(this.editId, x)
        .subscribe((res) => {
          this.modalText.header = "Račun izstavljen";
          this.modalText.body = "Račun je bil uspešno izstavljen in shranjen v vaši podatkovni bazi.";
          this.modalAnimationFlag = false;
        }, (error) => {
          this.modalText.header = "Napaka!";
          this.modalText.body = "Račun ni bil uspešno izstavljen. Ni uspelo vzpostaviti povezave z vašo podatkovno bazo.";
          this.modalAnimationFlag = false;
        });
    } else {
      this.service.postBill(x)
        .subscribe((res) => {
          this.modalText.header = "Račun izstavljen";
          this.modalText.body = "Račun je bil uspešno izstavljen in shranjen v vaši podatkovni bazi.";
          this.modalAnimationFlag = false;
        }, (error) => {
          this.modalText.header = "Napaka!";
          this.modalText.body = "Račun ni bil uspešno izstavljen. Ni uspelo vzpostaviti povezave z vašo podatkovno bazo.";
          this.modalAnimationFlag = false;
        });
    }
  }

  

  replaceCharNumbers (besedilo: string, prviChar: string, drugiChar: string) { // da se v mongo shrani veljaven javascript number
    
    if (prviChar === "f" || drugiChar === "u") {
      throw "Invalid text!";
    }

    try {
      besedilo = besedilo.replace(prviChar, "f");
      besedilo = besedilo.replace(drugiChar, "u");
      besedilo = besedilo.replace("f", drugiChar);
      besedilo = besedilo.replace("u", "");
    } catch(e) {
      besedilo = null;
    }
    return besedilo;

  }

  convertYearMonthDay(input) {
    if (!input.hasOwnProperty("year") || !input.hasOwnProperty("month") || !input.hasOwnProperty("day")) {
      throw "Invalid date!";
    }
    return new Date(input.year, input.month, input.day);
  }

  convertYearMonthDayReverse(input: string) {
    return {
      "year": new Date(input).getFullYear(),
      "month": new Date(input).getMonth(),
      "day": new Date(input).getDate(),
    };
  }

  addNewRow(index) {
    console.log("addNewRow('", index, "')");
    const control = <FormArray>this.obrazec.controls["storitve"];
    control.push(this.initPosamicnaStoritev(index));
  }

  deleteRow(index: number) {
    console.log("deleteRow('", index, "')");
    const control = <FormArray>this.obrazec.controls["storitve"];
    control.removeAt(index);
  }

}