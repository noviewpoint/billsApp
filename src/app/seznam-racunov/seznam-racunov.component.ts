import { Component, OnInit } from '@angular/core';
import { ApiCallsService } from '../api-calls.service';
import { Observable } from 'rxjs';
import { IskanjePipe } from '../iskanje.pipe';
import { NgbModule, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-seznam-racunov',
  templateUrl: './seznam-racunov.component.html',
  styleUrls: ['./seznam-racunov.component.css']
})
export class SeznamRacunovComponent implements OnInit {

  constructor(private service: ApiCallsService, private modalService: NgbModal) { }

  bills: Observable<any>;
  searchText;

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
    document.body.style.background = '#FEFEFA'; // Baby Powder
    this.refreshData();
  }

  refreshData() {
    this.bills = this.service.getBill();
  }

  print = function(id) {
    console.log(id);

    this.service.getBill(id).subscribe(res => {
      alert(res);
    });

    // window.print();
  }

  toPdf = function(id) {
    console.log(id);

    this.service.getBill(id).subscribe(res => {
      alert(res);
    });
  }
  
  edit = function(id, data) {
    console.log(id, data);

    // this.service.putBill(id, data).subscribe(res => {
    //   console.log(res);
    //   this.refreshData();
    // });
    alert("Nov route: /change ?");
  }

  remove = function(id, modalContent) {
    console.log(id);

    this.openModal(modalContent);

    // this.service.deleteBill(id).subscribe(res => {
    //   console.log(res);
    //   this.refreshData();
    // });    
  }

}
