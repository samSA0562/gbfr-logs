import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import toast, { Toaster } from "react-hot-toast";

import { EncounterState, EncounterUpdateEvent, PartyUpdateEvent, SortDirection, SortType } from "../types";
import { Table } from "../components/Table";
import { Titlebar } from "../components/Titlebar";

import "../i18n";
import { useMeterSettingsStore } from "../Store";
import { useShallow } from "zustand/react/shallow";

export const Meter = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(0);
  const [encounterState, setEncounterState] = useState<EncounterState>({
    totalDamage: 0,
    dps: 0,
    startTime: 0,
    endTime: 1,
    party: {},
    targets: {},
    status: "Waiting",
  });
  const [sortType, setSortType] = useState<SortType>("damage");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const { transparency } = useMeterSettingsStore(
    useShallow((state) => ({
      transparency: state.transparency,
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const encounterUpdateListener = listen("encounter-update", (event: EncounterUpdateEvent) => {
      setEncounterState(event.payload);

      if (event.payload.status === "InProgress" && encounterState.status === "Waiting") {
        encounterState.startTime == Date.now();
      }
    });

    const encounterSavedListener = listen("encounter-saved", () => {
      toast.success(t("ui.successful-save"));
    });

    const encounterSavedErrorListener = listen("encounter-saved-error", (evt) => {
      toast.error(t("ui.unsuccessful-save", { error: evt.payload }));
    });

    const onAreaEnterListener = listen("on-area-enter", (event: EncounterUpdateEvent) => {
      setEncounterState(event.payload);
      toast.success(t("ui.on-area-enter"));
    });

    // @ts-expect-error - @TODO(false): Implement looking at party data.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onPartyUpdate = listen("encounter-party-update", (event: PartyUpdateEvent) => {});

    const onSuccessAlert = listen("success-alert", (evt) => {
      toast.success(evt.payload as string);
    });

    const onErrorAlert = listen("error-alert", (evt) => {
      toast.error(evt.payload as string);
    });

    const onPinned = listen("on-pinned", (evt) => {
      evt.payload ? toast.success(t("ui.on-pin-enabled")) : toast.success(t("ui.on-pin-disabled"));
    });

    const onClickthrough = listen("on-clickthrough", (evt) => {
      evt.payload ? toast.success(t("ui.on-clickthrough-enabled")) : toast.success(t("ui.on-clickthrough-disabled"));
    });

    return () => {
      encounterUpdateListener.then((f) => f());
      encounterSavedListener.then((f) => f());
      encounterSavedErrorListener.then((f) => f());
      onAreaEnterListener.then((f) => f());
      onPartyUpdate.then((f) => f());
      onSuccessAlert.then((f) => f());
      onErrorAlert.then((f) => f());
      onPinned.then((f) => f());
      onClickthrough.then((f) => f());
    };
  }, []);

  const elapsedTime = Math.max(currentTime - encounterState.startTime, 0);

  return (
    <div className="app">
      <Titlebar
        encounterState={encounterState}
        elapsedTime={elapsedTime}
        sortType={sortType}
        sortDirection={sortDirection}
      />
      <div className="app-content" style={{ background: `rgba(22, 22, 22, ${transparency})` }}>
        <Table
          encounterState={encounterState}
          sortType={sortType}
          setSortType={setSortType}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
        />
      </div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            borderRadius: "10px",
            backgroundColor: "#252525",
            color: "#fff",
            fontSize: "14px",
          },
        }}
      />
    </div>
  );
};
