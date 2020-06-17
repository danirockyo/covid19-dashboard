import React, { useEffect } from "react";

import useReferenceFacilitiesEligible from "../hooks/useReferenceFacilitiesEligible";
import {
  Facility,
  ReferenceFacility,
  RtDataMapping,
  Scenario,
} from "../page-multi-facility/types";
import useScenario from "../scenario-context/useScenario";
import * as facilitiesActions from "./actions";
import { facilitiesReducer } from "./reducer";

export type FacilityMapping = { [key in Facility["id"]]: Facility };

export type ReferenceFacilityMapping = {
  [key in ReferenceFacility["id"]]: ReferenceFacility;
};

export interface FacilitiesState {
  loading: boolean;
  failed: boolean;
  facilities: FacilityMapping;
  referenceFacilities: ReferenceFacilityMapping;
  selectedFacilityId: Facility["id"] | null;
  rtData: RtDataMapping;
}

export type FacilitiesDispatch = (
  action: facilitiesActions.FacilitiesActions,
) => void;

export type ExportedActions = {
  fetchFacilityRtData: (facility: Facility) => Promise<void>;
  createOrUpdateFacility: (
    scenarioId: Scenario["id"],
    facility: Partial<Facility>,
  ) => Promise<Facility | void>;
  removeFacility: (
    scenarioId: Scenario["id"],
    facilityId: Facility["id"],
  ) => Promise<void>;
  duplicateFacility: (
    scenarioId: Scenario["id"],
    facility: Facility,
  ) => Promise<Facility | void>;
  deselectFacility: () => void;
  selectFacility: (faclityId: Facility["id"]) => void;
};

interface FacilitiesContext {
  state: FacilitiesState;
  dispatch: FacilitiesDispatch | undefined;
  actions: ExportedActions;
}

const FacilitiesContext = React.createContext<FacilitiesContext | undefined>(
  undefined,
);

export const FacilitiesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = React.useReducer(facilitiesReducer, {
    loading: true,
    failed: false,
    facilities: {},
    referenceFacilities: {},
    selectedFacilityId: null,
    rtData: {},
  });
  const [scenario] = useScenario();
  const scenarioId = scenario?.data?.id;
  const actions = {
    createOrUpdateFacility: facilitiesActions.createOrUpdateFacility(dispatch),
    fetchFacilityRtData: facilitiesActions.fetchFacilityRtData(dispatch),
    removeFacility: facilitiesActions.removeFacility(dispatch),
    duplicateFacility: facilitiesActions.duplicateFacility(dispatch),
    deselectFacility: facilitiesActions.deselectFacility(dispatch),
    selectFacility: facilitiesActions.selectFacility(dispatch),
  };

  useEffect(() => {
    if (scenarioId) {
      facilitiesActions.fetchFacilities(scenarioId, dispatch);
      // clean up any existing reference facility data
      facilitiesActions.clearReferenceFacilities(dispatch);
    }
  }, [scenarioId]);

  useEffect(() => {
    const facilities = Object.values({ ...state.facilities });
    if (facilities.length) {
      facilities.forEach((facility) => {
        if (!state.rtData.hasOwnProperty(facility.id)) {
          facilitiesActions.fetchFacilityRtData(dispatch)(facility);
        }
      });
    }
  }, [scenarioId, state.facilities, state.rtData]);

  // fetch reference facilities based on user facilities
  const shouldFetchReferenceFacilities = useReferenceFacilitiesEligible();
  useEffect(() => {
    if (!shouldFetchReferenceFacilities) return;

    const facilities = Object.values({ ...state.facilities });
    if (facilities.length) {
      // first facility is the reference; assume they're all the same
      const {
        modelInputs: { stateName },
        systemType,
      } = facilities[0];
      if (stateName && systemType) {
        facilitiesActions.fetchReferenceFacilities(
          stateName,
          systemType,
          dispatch,
        );
      }
    }
  }, [shouldFetchReferenceFacilities, state.facilities]);

  return (
    <FacilitiesContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </FacilitiesContext.Provider>
  );
};

export function useFacilities() {
  const context = React.useContext(FacilitiesContext);

  if (context === undefined) {
    throw new Error("useFacilities must be used within a FacilitiesProvider");
  }

  return context;
}