import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { routeTree } from './routeTree.gen'
import { DefaultCatchBoundary } from './components/DefaultCatchBoundary'
import { NotFound } from './components/NotFound'
import { createIsomorphicFn } from '@tanstack/react-start';


// NOTE: Most of the integration code found here is experimental and will
// definitely end up in a more streamlined API in the future. This is just
// to show what's possible with the current APIs.

let allLanguageData: Array<Record<string, unknown>> | null = null;
const loadAllLanguagesOnServer = createIsomorphicFn()
  .server(async (): Promise<Array<Record<string, unknown>>> => {
    if (!allLanguageData) {
      const matchingLanguageDataModules = import.meta.glob('./**/i18n/*.json');
      allLanguageData = await Promise.all(
        Object.entries(matchingLanguageDataModules).map(([path, loadModule]) =>
          loadModule().then((data) => {
            return {
              [path]: data.default,
            };
          }),
        ),
      );
    }
    return allLanguageData;
  })

export function createRouter() {
  const queryClient = new QueryClient()
  const usedTranslationDataKeys = [];
  const translationsClient = {
    loadAllLanguagesOnServer,
    registerUsedData: (translationKey: string) => {
      usedTranslationDataKeys.push(translationKey)
    }
  }

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient, translationsClient },
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
  });

  router.options = {
    ...router.options,
    dehydrate: () => {
      // the `usedTranslationDataKeys` array is empty because it's filled during rendering of components
      // and dehydrate is not waiting for the initial render to complete
      console.log('dehydrating translation keys:', usedTranslationDataKeys)
    },
    hydrate: (dehydrated) => {
      // no point to hydrate we don't have the used keys
    }
  }

  return routerWithQueryClient(
    router,
    queryClient,
  )
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
