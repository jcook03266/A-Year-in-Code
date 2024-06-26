// Dependencies
// Types
import { FmIntegrationProviders } from "../../../../../__generated__/graphql";

// Components
import AuthorizedIntegrationOption from "./authorized-integration-option/AuthorizedIntegrationOption";

// Simple context that allows the user to import posts from various external sources to add to their map
export default function PostImportIntegrationContext(): React.ReactNode {
  // Subcomponents
  const AuthorizableIntegrations = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[12px]">
        {
          <AuthorizedIntegrationOption
            integrationProvider={FmIntegrationProviders.Instagram}
          />
        }
      </div>
    );
  };

  // TBA - To be announced
  const StaticIntegrations = (): React.ReactNode => {
    return undefined;
  };

  const IntegrationsList = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[20px] w-[280px] h-fit overflow-y-auto overflow-x-hidden">
        {AuthorizableIntegrations()}
        {StaticIntegrations()}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-fit w-full pt-[12px] items-center justify-center">
      {IntegrationsList()}
    </div>
  );
}
