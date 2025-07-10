import {
  QueryClient,
  queryOptions,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { BackendModule } from "i18next";
import { Trans, useTranslation } from "react-i18next";

const TRANSLATION_DATA_LOADERS_BY_FILEPATH = import.meta.glob<{
  default: Record<string, string>;
}>("../../**/i18n/*.json");

/**
 * Throw if translation data filenames are not in the format:
 * <namespace>.<language>.json
 */
export const assertCorrectTranslationFilnames = createIsomorphicFn().server(
  () => {
    const filenameErrors = Object.keys(TRANSLATION_DATA_LOADERS_BY_FILEPATH)
      .map((filename) => {
        const filenameDotSegments = filename.split("/").pop()!.split(".");
        return filenameDotSegments.length < 3
          ? {
              filename: filename.replace("../../", "./src/"),
              error:
                "Filename must be in the format: <namespace>.<language>.json",
            }
          : null;
      })
      .filter(Boolean) as { filename: string; error: string }[];

    if (filenameErrors.length) {
      throw new Error(
        `The names of your translation data files have problems:\n${filenameErrors
          .map((e) => `${e.filename}: ${e.error}`)
          .join("\n")}`
      );
    }
  }
);

const ALL_TRANSLATION_DATA_BY_NAMESPACE_BY_LANGUAGE: {
  [namespace: string]: {
    [language: string]: Record<string, string>;
  };
} = {};

const addTranslationFileToAllTranslationData = async (
  filepath: string,
  dynamicallyImportTranslationFile: () => Promise<{
    default: Record<string, string>;
  }>
) => {
  const [namespace, language] = filepath.split("/").pop()!.split(".");
  const translationData = (await dynamicallyImportTranslationFile()).default;
  ALL_TRANSLATION_DATA_BY_NAMESPACE_BY_LANGUAGE[namespace] =
    ALL_TRANSLATION_DATA_BY_NAMESPACE_BY_LANGUAGE[namespace] || {};
  ALL_TRANSLATION_DATA_BY_NAMESPACE_BY_LANGUAGE[namespace][language] = {
    ...ALL_TRANSLATION_DATA_BY_NAMESPACE_BY_LANGUAGE[namespace][language],
    ...translationData,
  };
};

export const loadAllTranslationDataInServerMemory = createIsomorphicFn().server(
  async () => {
    for (const [filepath, dynamicallyImportTranslationFile] of Object.entries(
      TRANSLATION_DATA_LOADERS_BY_FILEPATH
    )) {
      await addTranslationFileToAllTranslationData(
        filepath,
        dynamicallyImportTranslationFile
      );
    }
  }
);

const loadNamespace = createIsomorphicFn()
  .server(async ({ namespace, language }) => {
    return ALL_TRANSLATION_DATA_BY_NAMESPACE_BY_LANGUAGE[namespace][language];
  })
  .client(async ({ namespace, language }) => {
    if (!ALL_TRANSLATION_DATA_BY_NAMESPACE_BY_LANGUAGE[namespace]?.[language]) {
      await Promise.all(
        Object.entries(TRANSLATION_DATA_LOADERS_BY_FILEPATH)
          .filter(([filepath]) =>
            filepath.endsWith(`/${namespace}.${language}.json`)
          )
          .map(([filepath, dynamicallyImportTranslationFile]) =>
            addTranslationFileToAllTranslationData(
              filepath,
              dynamicallyImportTranslationFile
            )
          )
      );
    }
    return ALL_TRANSLATION_DATA_BY_NAMESPACE_BY_LANGUAGE[namespace][language];

    /**
     * Should translation namespaces be file-specific?
     * If so, then: useMyTranslation('components/Card')??????
     * But this means when user is navigating from one page to another,
     * we need to load many many little files that are missing from the cache. 
     * Probably 100s!
     *
     * I think components must not have a translation themselves UNLESS they are very large,
     * (page or almost a page)
     * 
     * Instead we can have a folder at a logical places like:
     * <design system>/i18n/
     * <product line>/i18n/
     * <PAGE A>/i18n/
     * <PAGE B>/i18n/
     * <big component name>/i18n/
     */
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

export const makeQueryI18nBackend = (
  queryClient: QueryClient
): BackendModule => ({
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
