import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { routeTree } from "./routeTree.gen";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { createInstance} from "i18next";
import { initReactI18next } from "react-i18next";
import { makeQueryI18nBackend } from "./core/translation/experiment";

// NOTE: Most of the integration code found here is experimental and will
// definitely end up in a more streamlined API in the future. This is just
// to show what's possible with the current APIs.


export function createRouter() {
  const queryClient = new QueryClient();
  // Create a new i18n instance
  const i18next = createInstance();
  i18next
    .use(initReactI18next)
    .use(makeQueryI18nBackend(queryClient))
    .init(
      {
        lng: "en",
        defaultNS: "ssss",
        // resources: {}, // Important: keep this empty so backend is called
        fallbackLng: "en",
        interpolation: {
          escapeValue: false,
        },
        debug: true,
        load: "languageOnly",
        // debug: process.env.NODE_ENV === "development",
      },
      (err) => {
        if (err) return console.log("something went wrong loading", err);
      }
    );

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient, i18next },
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
  });

  return routerWithQueryClient(router, queryClient);
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
