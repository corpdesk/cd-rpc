import { Request, Response } from "express";
export class UiUudService {
  async getShellConfig() {
    const res = await fetch('/shell.config.json');
    return await res.json();
  }

  async loadUiDescriptor(systemName) {
    const res = await fetch(`/assets/ui-systems/${systemName}/descriptor.json`);
    return await res.json();
  }
}
