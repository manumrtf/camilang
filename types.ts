import {routes, langs,translations} from "./config";

export type Lang = typeof langs[number]
export type Routes = typeof routes[number]["key"]
export type Route = typeof routes[number];
export type RouteDefinition = {
  key:string,
  paths:Record<Lang, string>
}

export type IdentifiedRouteParams = Record<string, string>;

export interface IdentifiedRoute {
  key: Routes;
  lang: Lang;
  params: IdentifiedRouteParams;
  paths:  Record<Lang, string>
}



type ExtractRouteParams<T extends string> = T extends `${string}[${infer Param}]${infer Rest}`
  ? Param | ExtractRouteParams<Rest>
  : never;

// Get the paths object for a specific route key
export type RoutePaths<R extends Routes> = Extract<Route, { key: R }>["paths"];

// Extract the parameters for a specific route path and language
type RouteParams<R extends Routes, L extends Lang> = ExtractRouteParams<RoutePaths<R>[L]>;

export type RequiredKeys<R extends Routes, L extends Lang> = {
  [K in RouteParams<R, L>]: string;
};


// Utility type to extract keys that end in a value (leaf nodes)
type NestedKeyOf<T, PrevKey extends string = ''> = {
    [K in keyof T]: K extends string // Constrain K to be a string
      ? T[K] extends object
        ? NestedKeyOf<T[K], `${PrevKey}${K}.`>
        : `${PrevKey}${K}`
      : never
  }[keyof T];
  
  
  export type TranslationKey = NestedKeyOf<typeof translations[keyof typeof translations]>;


