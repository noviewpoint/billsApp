import { TestBed, inject } from '@angular/core/testing';

import { SharedPodatkiService } from './shared-podatki.service';

describe('SharedPodatkiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SharedPodatkiService]
    });
  });

  it('should be created', inject([SharedPodatkiService], (service: SharedPodatkiService) => {
    expect(service).toBeTruthy();
  }));
});
