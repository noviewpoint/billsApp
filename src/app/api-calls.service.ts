import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Jsonp, URLSearchParams } from '@angular/http';
import "rxjs/add/operator/map"; // da dela .map
import { Observable } from 'rxjs';

@Injectable()
export class ApiCallsService {

  constructor(
    private http: Http,
    private jsonp: Jsonp
  ) { }

  billsApiAddress: string = "http://localhost:12534/bills";
  pdfApiAddress: string = "http://localhost:12534/pdfs";
  clientsApiAdress: string = "http://localhost:12534/clients";

  // iz https://codecraft.tv/courses/angular/http/http-with-observables/
  // v komponento vrne 'Observable', pazi da je importana!
  getBill(id?: string): Observable<any> {

    if (id === undefined) {
      id = "";
    }

    return this.http.get(this.billsApiAddress + "/" + id, this.prepareJsonHeader()).map(res => res.json());
  }

  getClients(term: string): Observable<any> {

    if (term === "") {
      return Observable.of([]);
    }

    let wikiUrl = this.clientsApiAdress + "/" + term;

    return this.http
      .get(wikiUrl, this.prepareJsonHeader())
      .map(response => response.json())
      .map(x => {
        let temp = [];
        for (let el of x) {
          if (el && el.hasOwnProperty("stranka")) {
            temp.push(el.stranka);
          }
        }
        console.log("In map:", temp);
        return temp;
      });

  }

  postBill(data): Observable<any> {
    console.log("postBill");
    return this.http.post(this.billsApiAddress, JSON.stringify(data), this.prepareJsonHeader()).map(res => res.json());
  }

  putBill(id: string, data) {
    console.log("putBill");
    return this.http.put(this.billsApiAddress + "/" + id, data, this.prepareJsonHeader()).map(res => res.json());
      // .subscribe((res) => {
      //   console.log(res.json());
      // });
  }

  deleteBill(id: string) {
    return this.http.delete(this.billsApiAddress + "/" + id, this.prepareJsonHeader()).map(res => res.json());
      // .subscribe((res) => {
      //   console.log(res.json());
      // });
  }

  getPdf(id: string): Observable<any> {

    if (id === undefined) {
      id = "";
    }

    return this.http.get(this.pdfApiAddress + "-dl/" + id, this.preparePdfHeader()).map(res => res.arrayBuffer);
  }

  printPdf(id: string): Observable<any> {
    
    if (id === undefined) {
      id = "";
    }

    return this.http.get(this.pdfApiAddress + "-print/" + id, this.preparePdfHeader()).map(res => res.arrayBuffer);
  }

  prepareJsonHeader() {
    var header = new Headers();
    header.append('Content-Type', 'application/json; charset=utf-8');

    var myRequestOptions = new RequestOptions({
      headers: header
    });
    myRequestOptions.headers = header;
    return myRequestOptions;
  }

  preparePdfHeader() {
    var header = new Headers();
    header.append('Content-Type', 'application/pdf; charset=utf-8');

    var myRequestOptions = new RequestOptions({
      headers: header
    });
    myRequestOptions.headers = header;
    return myRequestOptions;
  }



}
