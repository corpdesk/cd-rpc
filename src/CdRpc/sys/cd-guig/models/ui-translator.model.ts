// import { UiComponentDescriptor, UiDataBindingDescriptor, UiEventDescriptor, UiLayoutDescriptor, UiThemeDescriptor } from "../../dev-descriptor/models/ui-concept-descriptor.model";
import { UiSystemSchema } from "./ui-system-schema.model";

export interface IUiTranslator {
  readonly systemId: string; // e.g. 'material-design', 'bootstrap-502'
  readonly version: string;

  // translateLayout(descriptor: UiLayoutDescriptor): any;
  // translateComponent(descriptor: UiComponentDescriptor): any;
  // translateTheme?(descriptor: UiThemeDescriptor): any;
  // translateEvent?(descriptor: UiEventDescriptor): any;
  // translateBinding?(descriptor: UiDataBindingDescriptor): any;
}


export interface UiTranslationRegistryEntry {
  id: string;               // e.g. 'material-design'
  label: string;            // Human-readable name
  translator: IUiTranslator;
  version: string;
}

export interface IUiSystemTranslator {
  // translate(descriptor: UiComponentDescriptor, system: UiSystemSchema): HTMLElement;
}


