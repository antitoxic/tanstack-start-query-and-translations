import { getRouteApi } from "@tanstack/react-router";

const useMockI18n = () => ({
  i18n: {
    addTranslation: () => {},
  },
  // get it from router context which itself gets it from cookie
  language: 'en',
})



export const useTranslationData = (
  key: string,
  translationLoaders: Record<string, () => Promise<any>>,
) => {
  const { language } = useMockI18n();
  const { translationsClient } = getRouteApi('__root__').useRouteContext();
  translationsClient.registerUsedData(`__translation__${key}__i18n__${language}`);
};