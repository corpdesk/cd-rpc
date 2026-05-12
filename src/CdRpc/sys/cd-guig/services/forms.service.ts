// import { logger } from "../../CdShell/utils/logger";
import { Request, Response } from "express";

export async function processFormData(
  formData: FormData,
  formId: string,
  cdToken?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) {
      reject(new Error(`Form with ID ${formId} not found`));
      return;
    }

    const data = Object.fromEntries(formData.entries());
    // this.logger.debug("Form data processed:", data);

    // Simulate an API call
    setTimeout(() => {
      resolve(data);
    }, 1000);
  });
}