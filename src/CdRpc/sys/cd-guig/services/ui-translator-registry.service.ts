import { Request, Response } from "express";
import { IUiTranslator, UiTranslationRegistryEntry } from "../models/ui-translator.model";

export class UiTranslationRegistryService {
  private registry: UiTranslationRegistryEntry[] = [];

  register(entry: UiTranslationRegistryEntry) {
    this.registry.push(entry);
  }

  getTranslator(uiSystemId: string): IUiTranslator | null {
    return this.registry.find(r => r.id === uiSystemId)?.translator || null;
  }
}
