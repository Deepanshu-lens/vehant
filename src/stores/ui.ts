import { writable } from "svelte/store";

export const isAlertPanelOpen = writable<boolean>(false);
