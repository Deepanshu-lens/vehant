import type { User } from "@/types";
import { validateUser } from "@/validateSchema";
import { writable } from "svelte/store";

const createUserStore = () => {
  const { subscribe, set, update } = writable<User | null>();
  return {
    subscribe,
    set: (data: unknown) => {
      const validUser = validateUser(data);
      set(validUser);
    },
    update: (updater: (items: User | null) => unknown) => {
      update((current) => {
        const updatedData = updater(current);
        return validateUser(updatedData);
      });
    },
  };
};

export const user = createUserStore();
