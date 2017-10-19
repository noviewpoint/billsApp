import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import "rxjs/add/operator/map"; // da dela .map
import { Observable } from 'rxjs';

@Injectable()
export class ApiCallsService {

  constructor(private http: Http) { }

  billsApiAddress = "http://localhost:12534/bills";
  pdfApiAddress = "http://localhost:12534/pdfs"

  // iz https://codecraft.tv/courses/angular/http/http-with-observables/
  // v komponento vrne 'Observable', pazi da je importana!
  getBill(id?): Observable<any> {

    if (id === undefined) {
      id = "";
    }

    return this.http.get(this.billsApiAddress + "/" + id, this.prepareJsonHeader()).map(res => res.json());
  }

  postBill(data): Observable<any> {
    return this.http.post(this.billsApiAddress, JSON.stringify(data), this.prepareJsonHeader()).map(res => res.json());
  }

  putBill(id, data) {
    return this.http.put(this.billsApiAddress + "/" + id, data, this.prepareJsonHeader()).map(res => res.json());
      // .subscribe((res) => {
      //   console.log(res.json());
      // });
  }

  deleteBill(id) {
    return this.http.delete(this.billsApiAddress + "/" + id, this.prepareJsonHeader()).map(res => res.json());
      // .subscribe((res) => {
      //   console.log(res.json());
      // });
  }

  getPdf(id): Observable<any> {

    if (id === undefined) {
      id = "";
    }

    return this.http.get(this.pdfApiAddress + "/" + id, this.preparePdfHeader()).map(res => res.arrayBuffer);
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
