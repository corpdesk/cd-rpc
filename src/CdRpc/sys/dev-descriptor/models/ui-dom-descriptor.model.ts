export interface UiDomDescriptor {
  id?: string;
  concept: string;              // concept id (e.g., "card")
  tag?: string;                 // preferred tag: 'div' | 'button' | 'span'
  attributes?: Record<string, string | ((props:any)=>string)>;
  classes?: string[] | ((props:any)=>string[]);
  propsMap?: Record<string,string>; // map semantic prop -> attribute/class
  children?: UiDomDescriptor[];   // nested structure
  placeholder?: boolean;          // indicates structural-only node
}

// export interface UiDomDescriptor {
// id?: string;
// concept: string; // concept id
// tag?: string; // preferred tag
// attributes?: Record<string, string | ((props:any)=>string)>;
// classes?: string[] | ((props:any)=>string | string[]);
// propsMap?: Record<string,string>;
// children?: UiDomDescriptor[];
// placeholder?: boolean;
// }
