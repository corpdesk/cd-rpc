// -------------------------------------------------------------
//  UI-SYSTEM AWARE BINDER (v1) — Non-breaking foundation layer
// -------------------------------------------------------------
import { Request, Response } from "express";
import { CdFormGroup } from "../controllers/cd-form-group.control";

export class CdDirectiveBinderService {
  private form: CdFormGroup;
  private formElement: HTMLFormElement; 
  private controllerInstance: any;
  private formSelector: string;

  private uiSystem: string = "bootstrap-538"; // <--- NEW (default)
  private eventListeners: {
    element: HTMLElement;
    event: string;
    handler: (e: Event) => void;
  }[] = [];

  constructor(
    form: CdFormGroup,
    formSelector: string,
    controllerInstance: any
  ) {
    console.log("CdDirectiveBinderService::constructor()/start");

    this.form = form;
    this.controllerInstance = controllerInstance;
    this.formSelector = formSelector;

    // NEW: Read UI-System from global runtime selector
    if (typeof window !== "undefined" && window.CD_ACTIVE_UISYSTEM) {
      this.uiSystem = window.CD_ACTIVE_UISYSTEM;
      console.log(
        `[Binder] UI-System set to: ${this.uiSystem} (via window.CD_ACTIVE_UISYSTEM)`
      );
    }
  }

  // -----------------------------------------------------------------
  // BIND DOM
  // -----------------------------------------------------------------
  public async bindToDom(): Promise<void> {
    console.log("[CdDirectiveBinderService][bindToDom] start");

    this.formElement = document.querySelector(
      this.formSelector
    ) as HTMLFormElement;

    if (!this.formElement) {
      console.error(`[Binder] Form not found: ${this.formSelector}`);
      return;
    }

    // Notify UI-System (Bootstrap, Tailwind, Material, etc.)
    this.dispatchLifecycleEvent("cd:form:bound");

    // -----------------------
    // BIND cdFormControl
    // -----------------------
    Object.entries(this.form.controls).forEach(([key, control]) => {
      const input = this.formElement.querySelector(
        `[name="${key}"][cdFormControl]`
      ) as HTMLInputElement;

      if (!input) return;

      const inputHandler = (e: Event) => {
        const target = e.target as HTMLInputElement;
        control.setValue(target.value);
        this.applyValidationStyles({ [key]: control.error });
      };

      const blurHandler = () => {
        control.markAsTouched();
        this.applyValidationStyles({ [key]: control.error });
      };

      input.addEventListener("input", inputHandler);
      input.addEventListener("blur", blurHandler);

      this.eventListeners.push({ element: input, event: "input", handler: inputHandler });
      this.eventListeners.push({ element: input, event: "blur", handler: blurHandler });

      input.value = control.value;
      this.applyValidationStyles({ [key]: control.error });
    });

    // -----------------------
    // BIND (change)="method()"
    // -----------------------
    const elements = this.formElement.querySelectorAll("*");

    elements.forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const match = attr.name.match(/^\(([^)]+)\)$/);
        if (!match) return;

        const eventName = match[1];
        const expression = attr.value;

        const customHandler = (e: Event) =>
          this.invokeDirectiveMethod(expression, e);

        el.addEventListener(eventName, customHandler);

        this.eventListeners.push({
          element: el as HTMLElement,
          event: eventName,
          handler: customHandler,
        });
      });
    });
  }

  // -----------------------------------------------------------------
  // UNBIND DOM
  // -----------------------------------------------------------------
  public unbindAllDomEvents(): void {
    console.log(`[Binder] Unbinding ${this.eventListeners.length} listeners`);

    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });

    this.eventListeners = [];

    // Notify UI-System to clean overlays, popovers etc.
    this.dispatchLifecycleEvent("cd:form:unbound");
  }

  // -----------------------------------------------------------------
  // EVENT DISPATCHER FOR UI-SYSTEM
  // -----------------------------------------------------------------
  private dispatchLifecycleEvent(name: string): void {
    const event = new CustomEvent(name, {
      bubbles: true,
      detail: {
        formSelector: this.formSelector,
        uiSystem: this.uiSystem,
        controller: this.controllerInstance,
      },
    });

    document.dispatchEvent(event);
    console.log(`[Binder] Fired event: ${name}`);
  }

  // -----------------------------------------------------------------
  // DIRECTIVE INVOCATION
  // -----------------------------------------------------------------
  private invokeDirectiveMethod(expression: string, event: Event): void {
    try {
      const fnMatch = expression.match(/^([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      if (!fnMatch) return;

      const fnName = fnMatch[1];
      const hasEventArg = fnMatch[2]?.includes("$event");

      const controller = this.controllerInstance;

      if (controller && typeof controller[fnName] === "function") {
        controller[fnName].call(controller, hasEventArg ? event : undefined);
      } else {
        console.warn(`[Binder] Method not found: ${fnName}`);
      }
    } catch (err) {
      console.error(`[Binder] Error invoking directive method: ${expression}`, err);
    }
  }

  // -----------------------------------------------------------------
  // VALIDATION STYLING (UI-system will override later)
  // -----------------------------------------------------------------
  validateAll(): void {
    const result = this.form.validateAll();
    this.applyValidationStyles(result);
  }

  applyValidationStyles(result: Record<string, string | null>): void {
    for (const [key, error] of Object.entries(result)) {
      const input = this.formElement.querySelector(
        `[name="${key}"]`
      ) as HTMLInputElement;
      const errorDiv = this.formElement.querySelector(
        `[data-error-for="${key}"]`
      ) as HTMLElement;

      if (!input) continue;

      input.classList.remove("cd-valid", "cd-invalid");
      if (error) {
        input.classList.add("cd-invalid");
        if (errorDiv) errorDiv.textContent = error;
      } else {
        input.classList.add("cd-valid");
        if (errorDiv) errorDiv.textContent = "";
      }
    }
  }
}
