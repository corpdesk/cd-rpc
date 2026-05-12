export class NamingFilterService {
  async init(): Promise<void> {}

  toPascalCase(name: string): string {
    return name.replace(/(^\w|-\w|_\w)/g, (m) => m.replace(/[-_]/, '').toUpperCase());
  }

  toCamelCase(name: string): string {
    const pascal = this.toPascalCase(name);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  toKebabCase(name: string): string {
    return name
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  toSnakeCase(name: string): string {
    return name
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }
}