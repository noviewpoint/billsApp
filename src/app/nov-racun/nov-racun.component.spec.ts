import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NovRacunComponent } from './nov-racun.component';

describe('NovRacunComponent', () => {
  let component: NovRacunComponent;
  let fixture: ComponentFixture<NovRacunComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NovRacunComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NovRacunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
