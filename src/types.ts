import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Invalid email address." }).optional(),
  session: z.array(z.string()),
});

export const nodeSchema = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string().min(1, "Camera name is required."),
    cameras: z.array(z.string()).optional(),
  })
);

export const cameraSchema = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string().min(1, "Camera name is required."),
    url: z.string().url("Invalid URL"),
    // node: nodeSchema,
  })
);

export type User = z.infer<typeof userSchema>;
export type Camera = z.infer<typeof cameraSchema>;
export type Node = z.infer<typeof nodeSchema>;
