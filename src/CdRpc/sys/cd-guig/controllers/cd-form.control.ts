
import { Request, Response } from "express";
export class CdFormControl<T = any> {
  private _value: T;
  private _validators: ((value: T) => string | null)[];
  private _errors: string[] = [];

  touched = false;
  dirty = false;

  constructor(value: T = null, validators: ((value: T) => string | null)[] = []) {
    this._value = value;
    this._validators = validators;
  }

  get value(): T {
    return this._value;
  }

  get valid(): boolean {
    return this._errors.length === 0;
  }

  get errors(): string[] {
    return this._errors;
  }

  get error(): string | null {
    return this._errors.length > 0 ? this._errors[0] : null;
  }

  setValue(value: T): void {
    if (this._value !== value) {
      this._value = value;
      this.dirty = true;
    }
    this.validate();
  }

  markAsTouched(): void {
    this.touched = true;
  }

  validate(): string | null {
    this._errors = [];
    for (const validator of this._validators) {
      const result = validator(this._value);
      if (result) this._errors.push(result);
    }
    return this.error;
  }

  reset(value: T = null): void {
    this._value = value;
    this._errors = [];
    this.touched = false;
    this.dirty = false;
  }
}
