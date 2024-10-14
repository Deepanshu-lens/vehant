import { validateNodes } from "@/validateSchema";
import { writable } from "svelte/store";
import type { Node } from "@/types";

const createNodeStore = () => {
  const { subscribe, set, update } = writable<Node[]>([]);
  return {
    subscribe,
    set: (data: unknown[]) => {
      const validNodes = validateNodes(data);
      set(validNodes);
    },
    update: (updater: (items: Node[]) => unknown[]) => {
      update((current) => {
        const updatedData = updater(current);
        return validateNodes(updatedData);
      });
    },
  };
};

export const selectedNode = writable<string>();
export const nodes = createNodeStore();
