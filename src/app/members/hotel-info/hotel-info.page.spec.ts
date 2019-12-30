import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelInfoPage } from './hotel-info.page';

describe('HotelInfoPage', () => {
  let component: HotelInfoPage;
  let fixture: ComponentFixture<HotelInfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HotelInfoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HotelInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
