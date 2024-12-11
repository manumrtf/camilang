import { routes } from "./routes";
import {es,en} from "./translations";

const langs = ["es", "en"] as const;
const translations = {es,en}

export {
    langs,
    routes,
    translations
   
}

