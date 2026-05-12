import { Request, Response } from "express";
import { UiDescriptorBase, UiLayoutDescriptor } from "../../dev-descriptor/models/ui-concept-descriptor.model";
import { IUiTranslator } from "../models/ui-translator.model";

export class UiSystemAdaptorService {
  constructor(private translator: IUiTranslator) {}

  render(descriptor: UiDescriptorBase): any {
    switch (descriptor.type) {
      case 'layout':
        // return this.translator.translateLayout(descriptor as UiLayoutDescriptor);
      case 'component':
        // return this.translator.translateComponent(descriptor as UiComponentDescriptor);
      default:
        throw new Error(`Unsupported descriptor type: ${descriptor.type}`);
    }
  }
}
