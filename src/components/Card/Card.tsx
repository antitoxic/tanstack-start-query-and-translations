import { useTranslationData } from '~/core/translation/useTranslationData';

export const Card = () => {
  useTranslationData('components/Card', {
    en: () => import('./i18n/en.json'),
    bg: () => import('./i18n/bg.json'),
  });
  return <div>Card</div>;
};
