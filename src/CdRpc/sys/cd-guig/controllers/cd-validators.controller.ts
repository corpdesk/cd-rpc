import { Request, Response } from "express";
export class CdValidators {
  static required(message?: string) {
    return (value: any): string | null => {
      return value === null || value === undefined || value === ""
        ? message || "This field is required"
        : null;
    };
  }

  static minLength(length: number, message?: string) {
    return (value: string): string | null => {
      return value && value.length < length
        ? message || `Minimum length is ${length}`
        : null;
    };
  }

  static email(message?: string) {
    return (value: string): string | null => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? null
        : message || "Invalid email address";
    };
  }
}
