// utils/json-helper.ts

export class JsonHelper {
  static safeStringify(obj: any): string {
    const seen = new WeakSet();

    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    });
  }

  static safeParse(str: string): any {
    try {
      return JSON.parse(str);
    } catch (e: any) {
      return null;
    }
  }
}

