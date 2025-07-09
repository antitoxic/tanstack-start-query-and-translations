import { useTranslationData } from '~/core/translation/useTranslationData';

export const Loader = () => {
  useTranslationData('components/Loader', {
    en: () => import('./i18n/en.json'),
    bg: () => import('./i18n/bg.json'),
  });
  return <div>Loader</div>;
};
