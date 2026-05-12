// import { CdFormControl } from "./cd-form.control";

// // export class CdFormGroup {
// //   private _controls: Record<string, CdFormControl<any>>;

// //   constructor(controls: Record<string, CdFormControl<any>>) {
// //     this._controls = controls;
// //   }

// //   get controls(): Record<string, CdFormControl<any>> {
// //     return this._controls;
// //   }

// //   get value(): Record<string, any> {
// //     const result: Record<string, any> = {};
// //     for (const key in this._controls) {
// //       result[key] = this._controls[key].value;
// //     }
// //     return result;
// //   }

// //   get valid(): boolean {
// //     return Object.values(this._controls).every((c) => c.valid);
// //   }

// //   validateAll(): void {
// //     Object.values(this._controls).forEach((c) => c.validate());
// //   }

// //   reset(values: Record<string, any> = {}): void {
// //     for (const key in this._controls) {
// //       this._controls[key].reset(values[key] ?? null);
// //     }
// //   }

// //   setValue(values: Record<string, any>): void {
// //     for (const key in values) {
// //       if (this._controls[key]) {
// //         this._controls[key].setValue(values[key]);
// //       }
// //     }
// //   }
// // }

// export class CdFormGroup {
//   controls: Record<string, CdFormControl>;
//   valid: boolean = true;

//   constructor(controls: Record<string, CdFormControl>) {
//     this.controls = controls;
//   }

//   /**
//    * Runs validation on all controls and returns
//    * an object of { controlName: errorMessage | null }.
//    */
//   validateAll(): Record<string, string | null> {
//     const result: Record<string, string | null> = {};
//     this.valid = true;

//     Object.entries(this.controls).forEach(([key, control]) => {
//       const error = control.validate();
//       result[key] = control.error ?? null;
//       if (result[key]) this.valid = false;
//     });

//     return result;
//   }

//   get value(): Record<string, any> {
//     const val: Record<string, any> = {};
//     Object.entries(this.controls).forEach(([k, c]) => (val[k] = c.value));
//     return val;
//   }
// }

import { Request, Response } from "express";
import { CdFormControl } from "./cd-form.control";

export class CdFormGroup {
  controls: Record<string, CdFormControl<any>>;
  valid = true;

  constructor(controls: Record<string, CdFormControl<any>>) {
    console.log('CdFormGroup::_constructor()/01')
    this.controls = controls;
  }

  get value(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, control] of Object.entries(this.controls)) {
      result[key] = control.value;
    }
    return result;
  }

  validateAll(): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    this.valid = true;

    for (const [key, control] of Object.entries(this.controls)) {
      const error = control.validate();
      result[key] = error;
      if (error) this.valid = false;
    }

    return result;
  }

  markAllAsTouched(): void {
    for (const control of Object.values(this.controls)) {
      control.markAsTouched();
    }
  }

  reset(): void {
    for (const control of Object.values(this.controls)) {
      control.reset();
    }
  }
}
