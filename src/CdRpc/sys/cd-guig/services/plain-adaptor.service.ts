import { Request, Response } from "express";
import { UiSystemDescriptor } from "../../dev-descriptor/models/ui-system-descriptor.model";
import { UiThemeDescriptor } from "../../dev-descriptor/models/ui-theme-descriptor.model";
import {
  IUiSystemAdapter,
  UiAdapterMeta,
} from "../models/ui-system-adaptor.model";

export class PlainAdapter implements IUiSystemAdapter {
  private descriptor?: UiSystemDescriptor;
  private linkEl?: HTMLLinkElement;
  private appliedClass?: string;
  protected meta!: UiAdapterMeta;

  public setMeta(meta: UiAdapterMeta): void {
    this.meta = meta;
  }

  async activate(descriptor: UiSystemDescriptor): Promise<void> {
    this.descriptor = descriptor;

    // remove any previously injected stylesheet
    if (this.linkEl && this.linkEl.parentElement) {
      this.linkEl.parentElement.removeChild(this.linkEl);
      this.linkEl = undefined;
    }

    // normalize id for class usage
    const id =
      (descriptor && (descriptor.id || (descriptor as any).name)) || "plain";
    const cls = `ui-system-${String(id)
      .replace(/[^a-z0-9\-_]/gi, "-")
      .toLowerCase()}`;

    // update document root attributes / class
    const docEl =
      typeof document !== "undefined" ? document.documentElement : null;
    if (docEl) {
      if (this.appliedClass) {
        docEl.classList.remove(this.appliedClass);
      }
      docEl.classList.add(cls);
      docEl.setAttribute("data-ui-system", String(id));
      this.appliedClass = cls;
    }

    // if descriptor provides a CSS URL, inject it so theme variables/styles are available
    const cssUrl = descriptor && (descriptor as any).cssUrl;
    if (cssUrl && typeof document !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssUrl;
      link.setAttribute("data-ui-system", String(id));
      // attach but don't fail activation if stylesheet doesn't load
      await new Promise<void>((resolve) => {
        link.onload = () => resolve();
        link.onerror = () => {
          // log and continue; plain adapter should be resilient
          // eslint-disable-next-line no-console
          console.warn(`PlainAdapter: failed to load stylesheet at ${cssUrl}`);
          resolve();
        };
        document.head.appendChild(link);
      });
      this.linkEl = link;
    }
  }
  deactivate(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async applyTheme(theme: UiThemeDescriptor) {
    // plain css theme uses CSS variables, no per-system logic needed
  }
}
