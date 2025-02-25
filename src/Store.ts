import { Mutate, StoreApi, create } from "zustand";
import { persist } from "zustand/middleware";

interface MeterSettings {
  color_1: string;
  color_2: string;
  color_3: string;
  color_4: string;
  transparency: number;
}

interface MeterStateFunctions {
  set: (settings: Partial<MeterSettings>) => void;
}

const DEFAULT_METER_SETTINGS: MeterSettings = {
  color_1: "#FF5630",
  color_2: "#FFAB00",
  color_3: "#36B37E",
  color_4: "#00B8D9",
  transparency: 0.2,
};

export type StoreWithPersist<T> = Mutate<StoreApi<T>, [["zustand/persist", T]]>;

export const withStorageDOMEvents = <T>(store: StoreWithPersist<T>) => {
  const storageEventCallback = (e: StorageEvent) => {
    if (e.key === store.persist?.getOptions().name && e.newValue) {
      store.persist.rehydrate();
    }
  };

  window.addEventListener("storage", storageEventCallback);

  return () => {
    window.removeEventListener("storage", storageEventCallback);
  };
};

export const useMeterSettingsStore = create<MeterSettings & MeterStateFunctions>()(
  persist(
    (set) => ({
      ...DEFAULT_METER_SETTINGS,
      set: (settings) => set(settings),
    }),
    {
      name: "meter-settings",
    }
  )
);

withStorageDOMEvents(useMeterSettingsStore);
