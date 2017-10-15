import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SeznamRacunovComponent } from './seznam-racunov.component';

describe('SeznamRacunovComponent', () => {
  let component: SeznamRacunovComponent;
  let fixture: ComponentFixture<SeznamRacunovComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SeznamRacunovComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SeznamRacunovComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
