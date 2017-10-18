import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiCallsService } from '../api-calls.service';
import { FormArray, FormBuilder } from '@angular/forms'; // za dinamicno dodajanje inputov
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-nov-racun',
  templateUrl: './nov-racun.component.html',
  styleUrls: ['./nov-racun.component.css']
})
export class NovRacunComponent implements OnInit {

  constructor(private builder: FormBuilder, private service: ApiCallsService) { }

  obrazec: FormGroup;
  
  ngOnInit() {
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
      znesek: new FormControl("19,74", Validators.compose([
        Validators.required,
        Validators.pattern("(:?^|\\s)(?=.)((?:0|(?:[1-9](?:\\d*|\\d{0,2}(?:\\.\\d{3})*)))?(?:,\\d*[1-9])?)(?!\\S)")
        /* https://stackoverflow.com/questions/5917082/regular-expression-to-match-numbers-with-or-without-commas-and-decimals-in-text */
      ])),
    });
  }

  initPosamicnaStoritev() {
    console.log("initPosamicnaStoritev");
    return this.builder.group({
      name: new FormControl("Suha salama", Validators.compose([
        Validators.required
      ])),
      quantity: new FormControl("10,5", Validators.compose([
        Validators.required,
        Validators.pattern("(:?^|\\s)(?=.)((?:0|(?:[1-9](?:\\d*|\\d{0,2}(?:\\.\\d{3})*)))?(?:,\\d*[1-9])?)(?!\\S)")
      ])),
      price: new FormControl("1,88", Validators.compose([
        Validators.required,
        Validators.pattern("(:?^|\\s)(?=.)((?:0|(?:[1-9](?:\\d*|\\d{0,2}(?:\\.\\d{3})*)))?(?:,\\d*[1-9])?)(?!\\S)")
      ])),
      VAT: new FormControl("22,2", Validators.compose([
        Validators.required,
        Validators.pattern("(:?^|\\s)(?=.)((?:0|(?:[1-9](?:\\d*|\\d{0,2}(?:\\.\\d{3})*)))?(?:,\\d*[1-9])?)(?!\\S)")
      ])),
    });
  }

  submitBill(x) {
    console.log("Datumi:", x.datumIzdaje, x.datumStoritve, x.rokPlacila);
    x.datumIzdaje = this.convertYearMonthDay(x.datumIzdaje);
    x.datumStoritve = this.convertYearMonthDay(x.datumStoritve);
    x.rokPlacila = this.convertYearMonthDay(x.rokPlacila);

    x.znesek = this.convertCommasToDots(x.znesek);

    for (let e of x.storitve) {
      e.quantity = this.convertCommasToDots(e.quantity);
      e.price = this.convertCommasToDots(e.price);
      e.VAT = this.convertCommasToDots(e.VAT);
    }

    console.log("submitBill", x);
    this.service.postBill(x);
  }

  convertCommasToDots(input: string) {
    input = input.replace(",", "x");
    input = input.replace(".", ",");
    input = input.replace("x", ".");
    return input;
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
