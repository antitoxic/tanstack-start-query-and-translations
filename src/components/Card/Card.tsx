import { useMyTranslation } from "~/core/translation/experiment";
// import { useTranslationData } from "~/core/translation/useTranslationData";

export const Card = () => {
  const { Trans } = useMyTranslation("common");
  return (
    <div>
      Card: <Trans>goodbye</Trans>
    </div>
  );
};
