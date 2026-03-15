// useT.js — import this in any screen to get translations
// Usage: const { t } = useT();
// Then:  <Text>{t('quickActions')}</Text>
import { useTranslation } from 'react-i18next';

export const useT = () => {
  const { t, i18n } = useTranslation();
  return { t, lang: i18n.language };
};