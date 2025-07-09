import { QueryClient, queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { BackendModule } from "i18next";
import { Trans, useTranslation } from "react-i18next";

const loadNamespace = createIsomorphicFn()
  .server(async ({ namespace, language }) => {
    return {
      "Welcome to our!": `Welcome: This is the translation FROM CUSTOM BACKEND (server) (ns: ${namespace})`,
    };
  })
  .client(async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return {
      "Welcome to our!": `Welcome: This is the translation FROM CUSTOM BACKEND (browser) (ns: ${namespace})`,
    };
  });

export const i18nQueryOptions = (namespace: string, language: string) =>
  queryOptions({
    queryKey: ["i18n", namespace, language],
    queryFn: () => loadNamespace({ namespace, language }),
    staleTime: Infinity,
  });

export const useMyTranslation = (namespace: string) => {
  useSuspenseQuery(i18nQueryOptions(namespace, "en"));
  const defaultUseTranslationResult = useTranslation(namespace);
  return {
    ...defaultUseTranslationResult,
    // TOOD: add proper types
    Trans: (props: any) => (
      <Trans {...props} t={defaultUseTranslationResult.t} />
    ),
  };
};


export const makeQueryI18nBackend = (queryClient: QueryClient): BackendModule => ({
  type: "backend",
  init() {
    console.log("init");
  },
  read(language, namespace, callback) {
    console.log("read", language, namespace);
    queryClient
      .fetchQuery(i18nQueryOptions(namespace, language))
      .then((data) => {
        console.log({ data });
        return callback(null, data);
      })
      .catch((e) => {
        console.log({ e });
        return callback(e, null);
      });
  },
});