import { translations, routes } from "./config";
import type {
  Lang,
  Routes,
  RequiredKeys,
  RoutePaths,
  IdentifiedRoute,
  IdentifiedRouteParams,
  TranslationKey,
} from "./types";
export function getLangs() {
  return Object.keys(translations) as Lang[];
}

export function getTranslatedRoute<R extends Routes>(
  routeKey: R,
  options: {
    lang: Lang;
    args?: RequiredKeys<R, typeof options.lang>; // Ensure the arguments are specific to the selected route and language
    returnWithoutLang?: boolean;
  }
): string {
  const route = routes.find((r) => r.key === routeKey);

  if (!route) {
    throw new Error(`Route with key "${routeKey}" not found`);
  }

  let path = route.paths[options.lang];

  if (!path) {
    throw new Error(
      `Path for language "${options.lang}" not found for route "${routeKey}"`
    );
  }

  if (options.args) {
    Object.entries(options.args).forEach(([key, value]) => {
      const placeholder = `[${key}]`;
      path = path.replace(
        placeholder,
        value as string
      ) as RoutePaths<R>[typeof options.lang];
    });
  }

  return options.returnWithoutLang ? path : `/${options.lang}${path}`;
}

export function getTranslatedString(
  lang: keyof typeof translations,
  key: TranslationKey
): string {
  const translationObject = translations[lang];

  // Split the key and traverse the object to get the value
  //This may throw a ts error until you fill the translation objects
  const keys = key.split(".");
  let result: any = translationObject;

  for (const k of keys) {
    result = result?.[k];
    if (result === undefined) {
      throw new Error(
        `Translation key "${key}" not found for language "${lang}"`
      );
    }
  }

  return result;
}

export function identifyCurrentRoute(pathname: string): IdentifiedRoute | null {
  pathname = decodeURIComponent(pathname);

  pathname = pathname.replace(/^\//, "");

  const [potentialLang, ...restPath] = pathname.split("/");

  for (const route of routes) {
    for (const [lang, path] of Object.entries(route.paths)) {
      if (typeof path !== "string") {
        console.error(
          `Invalid path for route ${route.key} and language ${lang}`
        );
        continue;
      }

      const cleanPath = path.replace(/^\//, "");

      const fullPathToCheck =
        lang === potentialLang ? restPath.join("/") : pathname;

      const pattern = cleanPath.replace(/\[(\w+)\]/g, "([^/]+)");
      const regex = new RegExp(`^${pattern}$`);

      const match = fullPathToCheck.match(regex);

      if (match) {
        const params: IdentifiedRouteParams = {};
        const paramNames =
          cleanPath.match(/\[(\w+)\]/g)?.map((p) => p.slice(1, -1)) || [];

        paramNames.forEach((name, index) => {
          const value = match[index + 1];
          if (typeof value === "string") {
            params[name] = value;
          }
        });

        return {
          key: route.key,
          lang: lang as Lang,
          paths: route.paths,
          params,
        };
      }
    }
  }

  return null;
}

export function resolvePathParams(
  path: string,
  params: Record<string, string>
) {
  return path.replace(/\[(\w+)\]/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

export function translateCurrentRoute(lang: Lang, currentPathName: string) {
  const route = identifyCurrentRoute(currentPathName);
  const nextRoutePath = route?.paths[lang];
  const cleanPath = nextRoutePath?.startsWith("/")
    ? nextRoutePath
    : `/${nextRoutePath}`;
  const finalPath = cleanPath.replace(`/${lang}/`, "/");
  const resolvedPath = resolvePathParams(finalPath, route!.params);
  const destination = `${lang}${resolvedPath}`;
  return destination;
}
