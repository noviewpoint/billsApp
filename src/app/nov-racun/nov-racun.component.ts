import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiCallsService } from '../api-calls.service';
import { FormArray, FormBuilder } from '@angular/forms'; // za dinamicno dodajanje inputov
import { NgbModule, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-nov-racun',
  templateUrl: './nov-racun.component.html',
  styleUrls: ['./nov-racun.component.css']
})
export class NovRacunComponent implements OnInit {

  constructor(private builder: FormBuilder, private service: ApiCallsService, private modalService: NgbModal) { }

  obrazec: FormGroup;
  formChangedCounter = 0;
  modalText = {
    "header": null,
    "body": null
  };
  modalAnimationFlag = false;

  openModal(content) {
    console.log("Opened Modal!");
    this.modalService.open(content).result.then((result) => {
      console.log(`Closed with: ${result}`);
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
    document.body.style.background = '#F8F8FF'; // Ghost White
    this.obrazec = this.builder.group({
      stranka: new FormControl("Mercator", Validators.compose([
        Validators.required
      ])),
      davcna: new FormControl("12341234", Validators.compose([
        Validators.required,
        Validators.pattern("\\d{8}") /* davcna je 8-mestna st. */
      ])),
      naslov: new FormControl("Prešernova ulica 20", Validators.compose([
        Validators.required
      ])),
      postnaStevilka: new FormControl("1234", Validators.compose([
        Validators.required,
        Validators.pattern("\\d{4}") /* posta je 4-mestna st. */
      ])),
      drzava: new FormControl("Slovenija", Validators.compose([
        Validators.required
      ])),
      datumIzdaje: new FormControl(null, Validators.compose([
        Validators.required,
        // Validators.pattern("\\d{4}-\\d{2}-\\d{2}") /* yyyy-mm-dd */
        // datume avtomatsko validira ngbootstrap
      ])),
      datumStoritve: new FormControl(null, Validators.compose([
        Validators.required
      ])),
      rokPlacila: new FormControl(null, Validators.compose([
        Validators.required
      ])),
      
      storitve: this.builder.array([this.initPosamicnaStoritev()]),

      stevilkaRacuna: new FormControl("0000-2017", Validators.compose([
        Validators.required,
        Validators.pattern("\\d{4}-\\d{4}") /* npr. 0000-2017 */
      ])),
      znesek: new FormControl(null, Validators.compose([
        Validators.required,
        Validators.pattern("^(0|[1-9][0-9]{0,2}(?:(\\.[0-9]{3})*|[0-9]*))(,[0-9]+){0,1}$")
        /* https://stackoverflow.com/questions/5917082/regular-expression-to-match-numbers-with-or-without-commas-and-decimals-in-text */
        /* https://stackoverflow.com/questions/16060191/regex-for-a-valid-numeric-with-optional-commas-dot */
      ])),
    });

    this.obrazec.valueChanges.subscribe(this.poslusajZaSpremembrami.bind(this)); // MORA BITI BINDAN KONTEKST!
    this.poslusajZaSpremembrami(this.obrazec.value); // 1x izvedi na zacetku
  }

  initPosamicnaStoritev() {
    console.log("initPosamicnaStoritev");
    return this.builder.group({
      name: new FormControl("Suha salama", Validators.compose([
        Validators.required
      ])),
      quantity: new FormControl(null, Validators.compose([
        Validators.required,
        Validators.pattern("^(0|[1-9][0-9]{0,2}(?:(\\.[0-9]{3})*|[0-9]*))(,[0-9]+){0,1}$")
      ])),
      price: new FormControl(null, Validators.compose([
        Validators.required,
        Validators.pattern("^(0|[1-9][0-9]{0,2}(?:(\\.[0-9]{3})*|[0-9]*))(,[0-9]+){0,1}$")
      ])),
      VAT: new FormControl("22,00", Validators.compose([
        Validators.required,
        Validators.pattern("^(0|[1-9][0-9]{0,2}(?:(\\.[0-9]{3})*|[0-9]*))(,[0-9]+){0,1}$")
      ])),
    });
  }

  poslusajZaSpremembrami(data) {
    console.log("poslusajZaSpremembrami!");
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
    }
  }
  
  submitBill(formData, modalContent) {
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

  replaceCharNumbers (besedilo: string, prviChar: string, drugiChar: string) { // da se v mongo shrani veljaven javascript number
    
    if (prviChar === "f" || drugiChar === "u") {
      throw "Napaka!";
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
    input = new Date(input.year, input.month, input.day);
    return input;
  }

  addNewRow() {
    console.log("addNewRow");
    const control = <FormArray>this.obrazec.controls["storitve"];
    control.push(this.initPosamicnaStoritev());
  }

  deleteRow(index: number) {
    console.log("deleteRow", index);
    const control = <FormArray>this.obrazec.controls["storitve"];
    control.removeAt(index);
  }

}