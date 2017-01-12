/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DuracellComponent } from './duracell.component';

describe('DuracellComponent', () => {
  let component: DuracellComponent;
  let fixture: ComponentFixture<DuracellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DuracellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DuracellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
