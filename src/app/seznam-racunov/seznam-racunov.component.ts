import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-seznam-racunov',
  templateUrl: './seznam-racunov.component.html',
  styleUrls: ['./seznam-racunov.component.css']
})
export class SeznamRacunovComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    
  }

  bills = [{
    "costumer": "SVEA",
    "price": 200,
    "date": new Date(2000, 3, 3),
    "user": "David"
  }, {
    "costumer": "Tuš",
    "price": 300,
    "date": new Date(2016, 5, 17),
    "user": "David"
  }, {
    "costumer": "Spar",
    "price": 1.99,
    "date": new Date(2017, 10, 14),
    "user": "David"
  }, {
    "costumer": "Ikea",
    "price": 1099.99,
    "date": new Date(2017, 10, 15),
    "user": "Kristina"
  }, {
    "costumer": "SVEA",
    "price": 200,
    "date": new Date(2000, 3, 3),
    "user": "David"
  }, {
    "costumer": "Tuš",
    "price": 300,
    "date": new Date(2016, 5, 17),
    "user": "David"
  }, {
    "costumer": "Spar",
    "price": 1.99,
    "date": new Date(2017, 10, 14),
    "user": "David"
  }, {
    "costumer": "Ikea",
    "price": 1099.99,
    "date": new Date(2017, 10, 15),
    "user": "Kristina"
  }, {
    "costumer": "SVEA",
    "price": 200,
    "date": new Date(2000, 3, 3),
    "user": "David"
  }, {
    "costumer": "Tuš",
    "price": 300,
    "date": new Date(2016, 5, 17),
    "user": "David"
  }, {
    "costumer": "Spar",
    "price": 1.99,
    "date": new Date(2017, 10, 14),
    "user": "David"
  }, {
    "costumer": "Ikea",
    "price": 1099.99,
    "date": new Date(2017, 10, 15),
    "user": "Kristina"
  }, {
    "costumer": "SVEA",
    "price": 200,
    "date": new Date(2000, 3, 3),
    "user": "David"
  }, {
    "costumer": "Tuš",
    "price": 300,
    "date": new Date(2016, 5, 17),
    "user": "David"
  }, {
    "costumer": "Spar",
    "price": 1.99,
    "date": new Date(2017, 10, 14),
    "user": "David"
  }, {
    "costumer": "Ikea",
    "price": 1099.99,
    "date": new Date(2017, 10, 15),
    "user": "Kristina"
  }, {
    "costumer": "SVEA",
    "price": 200,
    "date": new Date(2000, 3, 3),
    "user": "David"
  }, {
    "costumer": "Tuš",
    "price": 300,
    "date": new Date(2016, 5, 17),
    "user": "David"
  }, {
    "costumer": "Spar",
    "price": 1.99,
    "date": new Date(2017, 10, 14),
    "user": "David"
  }, {
    "costumer": "Ikea",
    "price": 1099.99,
    "date": new Date(2017, 10, 15),
    "user": "Kristina"
  }];

  remove = function(elementIndex) {

  }

  edit = function(elementIndex) {

  }

  toPdf = function(elementIndex) {

  }

  createNewBill = function() {

  }

}
