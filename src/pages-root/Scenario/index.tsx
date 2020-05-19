import { RouteComponentProps } from "@reach/router";
import React from "react";

import Loading from "../../design-system/Loading";
import { useLocaleDataState } from "../../locale-data-context";
import CreateBaselineScenarioPage from "../../page-multi-facility/CreateBaselineScenarioPage";
import MultiFacilityImpactDashboard from "../../page-multi-facility/MultiFacilityImpactDashboard";
import useScenario from "../../scenario-context/useScenario";
import PageInfo from "../../site-metadata/PageInfo";

type Props = RouteComponentProps;

// eslint-disable-next-line react/display-name
export default (props: Props) => {
  const localeState = useLocaleDataState();
  const [scenario] = useScenario();

  return localeState.failed ? (
    // TODO: real error state?
    <div>
      Unable to load state and county data. Please try refreshing the page.
    </div>
  ) : localeState.loading || scenario.loading ? (
    <div className="mt-16">
      <Loading />
    </div>
  ) : scenario.data ? (
    <>
      <PageInfo
        title={
          scenario.data.name ? scenario.data.name + " scenario" : "Scenario"
        }
      />
      <MultiFacilityImpactDashboard />
    </>
  ) : (
    <CreateBaselineScenarioPage />
  );
};