import { Component, OnInit } from '@angular/core';
import { ApiCallsService } from '../api-calls.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-seznam-racunov',
  templateUrl: './seznam-racunov.component.html',
  styleUrls: ['./seznam-racunov.component.css']
})
export class SeznamRacunovComponent implements OnInit {

  constructor(private service: ApiCallsService) { }

  bills: Observable<any>;
  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.bills = this.service.getBill();
  }

  print = function(id) {
    console.log(id);

    this.service.getBill(id).subscribe(res => {
      console.log(res);
    });

    // window.print();
  }

  toPdf = function(id) {
    console.log(id);

    this.service.getBill(id).subscribe(res => {
      console.log(res);
    });
  }
  
  edit = function(id, data) {
    console.log(id, data);

    this.service.putBill(id, data).subscribe(res => {
      console.log(res);
      this.refreshData();
    });
  }

  remove = function(id) {
    console.log(id);

    this.service.deleteBill(id).subscribe(res => {
      console.log(res);
      this.refreshData();
    });    
  }

}
