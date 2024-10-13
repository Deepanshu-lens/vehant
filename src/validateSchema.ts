import { cameraSchema, nodeSchema, userSchema } from "./types";
import type { Node, Camera, User } from "./types";

export const validateUser = (data: unknown): User | null => {
  const parsed = userSchema.safeParse(data);
  if (parsed.success) {
    return parsed.data;
  }
  console.error("User validation error: ", parsed.error.errors);
  return null;
};

export const validateCamera = (data: unknown): Camera | null => {
  const parsed = cameraSchema.safeParse(data);
  if (parsed.success) {
    return parsed.data;
  }
  console.error("Invalid Camera Data: ", parsed.error.errors);
  return null;
};

export const validateCameras = (data: unknown[]): Camera[] => {
  return data
    .map(validateCamera)
    .filter((camera): camera is Camera => camera !== null);
};

export const validateNode = (data: unknown): Node | null => {
  const parsed = nodeSchema.safeParse(data);
  if (parsed.success) {
    return parsed.data;
  }
  console.error("Invalid Node Data: ", parsed.error.errors);
  return null;
};

export const validateNodes = (data: unknown[]): Node[] => {
  return data.map(validateNode).filter((node): node is Node => node !== null);
};
