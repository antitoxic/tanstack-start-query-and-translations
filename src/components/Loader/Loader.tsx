import { useMyTranslation } from "~/core/translation/experiment";

export const Loader = () => {
  const { Trans } = useMyTranslation("anothernamespace");
  return (
    <div>
      Loader: <Trans>hi</Trans>
    </div>
  );
};
