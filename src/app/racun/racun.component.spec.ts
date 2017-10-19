import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RacunComponent } from './racun.component';

describe('NovRacunComponent', () => {
  let component: RacunComponent;
  let fixture: ComponentFixture<RacunComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RacunComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RacunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
