import type { Camera } from "@/types";
import { validateCameras } from "@/validateSchema";
import { writable } from "svelte/store";

const createCameraStore = () => {
  const { subscribe, set, update } = writable<Camera[]>([]);
  return {
    subscribe,
    set: (data: unknown[]) => {
      const validCameras = validateCameras(data);
      set(validCameras);
    },
    update: (updater: (items: Camera[]) => unknown[]) => {
      update((current) => {
        const updatedData = updater(current);
        return validateCameras(updatedData);
      });
    },
  };
};

export const cameras = createCameraStore();
