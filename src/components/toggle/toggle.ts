import { NgZone, AfterViewInit, ChangeDetectorRef, Component, ElementRef, forwardRef, HostListener, Input, OnDestroy, Optional, Renderer, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { Config } from '../../config/config';
import { DomController } from '../../platform/dom-controller';
import { Form, IonicTapInput } from '../../util/form';
import { GestureController } from '../../gestures/gesture-controller';
import { Haptic } from '../../tap-click/haptic';
import { assert, isTrueProperty } from '../../util/util';
import { BaseInput } from '../../util/base-input';
import { Item } from '../item/item';
import { KEY_ENTER, KEY_SPACE } from '../../platform/key';
import { Platform } from '../../platform/platform';
import { ToggleGesture } from './toggle-gesture';

export const TOGGLE_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => Toggle),
  multi: true
};

/**
 * @name Toggle
 * @description
 * A toggle technically is the same thing as an HTML checkbox input,
 * except it looks different and is easier to use on a touch device.
 * Toggles can also have colors assigned to them, by adding any color
 * attribute.
 *
 * See the [Angular 2 Docs](https://angular.io/docs/ts/latest/guide/forms.html)
 * for more info on forms and inputs.
 *
 * @usage
 * ```html
 *
 *  <ion-list>
 *
 *    <ion-item>
 *      <ion-label>Pepperoni</ion-label>
 *      <ion-toggle [(ngModel)]="pepperoni"></ion-toggle>
 *    </ion-item>
 *
 *    <ion-item>
 *      <ion-label>Sausage</ion-label>
 *      <ion-toggle [(ngModel)]="sausage" disabled="true"></ion-toggle>
 *    </ion-item>
 *
 *    <ion-item>
 *      <ion-label>Mushrooms</ion-label>
 *      <ion-toggle [(ngModel)]="mushrooms"></ion-toggle>
 *    </ion-item>
 *
 *  </ion-list>
 * ```
 *
 * @demo /docs/demos/src/toggle/
 * @see {@link /docs/components#toggle Toggle Component Docs}
 */
@Component({
  selector: 'ion-toggle',
  template:
    '<div class="toggle-icon">' +
      '<div class="toggle-inner"></div>' +
    '</div>' +
    '<button role="checkbox" ' +
            'type="button" ' +
            'ion-button="item-cover" ' +
            '[id]="id" ' +
            '[attr.aria-checked]="_value" ' +
            '[attr.aria-labelledby]="_labelId" ' +
            '[attr.aria-disabled]="_disabled" ' +
            'class="item-cover" disable-activated>' +
    '</button>',
  host: {
    '[class.toggle-disabled]': '_disabled',
    '[class.toggle-checked]': '_value',
    '[class.toggle-activated]': '_activated',
  },
  providers: [TOGGLE_VALUE_ACCESSOR],
  encapsulation: ViewEncapsulation.None,
})
export class Toggle extends BaseInput<boolean> implements IonicTapInput, AfterViewInit, OnDestroy  {

  _activated: boolean = false;
  _startX: number;
  _msPrv: number = 0;
  _gesture: ToggleGesture;

  /**
   * @input {boolean} If true, the element is selected.
   */
  @Input()
  get checked(): boolean {
    return this.value;
  }

  set checked(val: boolean) {
    this.value = val;
  }

  constructor(
    form: Form,
    config: Config,
    private _plt: Platform,
    elementRef: ElementRef,
    renderer: Renderer,
    private _haptic: Haptic,
    @Optional() item: Item,
    private _gestureCtrl: GestureController,
    private _domCtrl: DomController,
    private _cd: ChangeDetectorRef,
    private _zone: NgZone,
  ) {
    super(config, elementRef, renderer, 'toggle', false, form, item, null);
  }

  /**
   * @hidden
   */
  ngAfterViewInit() {
    this._initialize();
    this._gesture = new ToggleGesture(this._plt, this, this._gestureCtrl, this._domCtrl);
    this._gesture.listen();
  }

  /**
   * @hidden
   */
  _inputCheckHasValue() {}

  /**
   * @hidden
   */
  _inputNormalize(val: any): boolean {
    return isTrueProperty(val);
  }

  /**
   * @hidden
   */
  _onDragStart(startX: number) {
    assert(startX, 'startX must be valid');
    console.debug('toggle, _onDragStart', startX);

    this._zone.run(() => {
      this._startX = startX;
      this._fireFocus();
      this._activated = true;
    });
  }

  /**
   * @hidden
   */
  _onDragMove(currentX: number) {
    if (!this._startX) {
      assert(false, '_startX must be valid');
      return;
    }

    let dirty = false;
    let value: boolean;
    let activated: boolean;

    if (this._value) {
      if (currentX + 15 < this._startX) {
        dirty = true;
        value = false;
        activated = true;
      }

    } else if (currentX - 15 > this._startX) {
      dirty = true;
      value = true;
      activated = (currentX < this._startX + 5);
    }

    if (dirty) {
      this._zone.run(() => {
        this.value = value;
        this._startX = currentX;
        this._activated = activated;
        this._haptic.selection();
      });
    }

  }

  /**
   * @hidden
   */
  _onDragEnd(endX: number) {
    if (!this._startX) {
      assert(false, '_startX must be valid');
      return;
    }
    console.debug('toggle, _onDragEnd', endX);

    this._zone.run(() => {
      if (this._value) {
        if (this._startX + 4 > endX) {
          this.value = false;
          this._haptic.selection();
        }

      } else if (this._startX - 4 < endX) {
        this.value = true;
        this._haptic.selection();
      }

      this._activated = false;
      this._fireBlur();
      this._startX = null;
    });
  }

  /**
   * @hidden
   */
  @HostListener('keyup', ['$event']) _keyup(ev: KeyboardEvent) {
    if (ev.keyCode === KEY_SPACE || ev.keyCode === KEY_ENTER) {
      console.debug(`toggle, keyup: ${ev.keyCode}`);
      ev.preventDefault();
      ev.stopPropagation();
      this.value = !this.value;
    }
  }

  /**
   * @hidden
   */
  initFocus() {
    this._elementRef.nativeElement.querySelector('button').focus();
  }

  /**
   * @hidden
   */
  ngOnDestroy() {
    super.ngOnDestroy();
    this._gesture && this._gesture.destroy();
  }

}
