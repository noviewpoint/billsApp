import { Component, OnInit } from '@angular/core';
import { ApiCallsService } from '../api-calls.service';
import { Observable } from 'rxjs';
import { IskanjePipe } from '../iskanje.pipe';
import { NgbModule, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { SharedPodatkiService } from '../shared-podatki.service';

@Component({
  selector: 'app-seznam-racunov',
  templateUrl: './seznam-racunov.component.html',
  styleUrls: ['./seznam-racunov.component.css']
})
export class SeznamRacunovComponent implements OnInit {

  constructor(private service: ApiCallsService, private modalService: NgbModal, private router: Router, private shared: SharedPodatkiService) { }

  bills: Observable<any>;
  searchText;

  openModal(content, execute, id) {
    console.log("Opened Modal!");
    this.modalService.open(content).result.then((result) => {
      console.log(`Closed with: ${result}`);
      if (result === "OK") {
        execute(id).subscribe(res => {
          this.refreshData();
        });  
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
    console.log("V /seznam");
    document.body.style.background = '#FEFEFA'; // Baby Powder
    this.refreshData();
    this.shared.resetirajRacun();
  }

  refreshData() {
    this.bills = this.service.getBill();
  }

  print = function(id) {
    console.log(id);
  }

  toPdf = function(id) {
    this.service.getPdf(id).subscribe(res => {
      // const blob = new Blob([res], {type: 'application/pdf'});
      // const url = window.URL.createObjectURL(blob);
      window.open("/pdfs/" + id);
    });
  }
  
  edit = function(data) {
    this.shared.trenutniRacun = data;
    this.router.navigate(["/racun"], {queryParams: {"st": data.stRacuna }}); // uporabniku prijazen link?
  }

  remove = function(modalContent, id) {
    this.openModal(modalContent, this.service.deleteBill.bind(this.service), id);
  }

}
