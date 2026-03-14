import { z } from "zod";

export const authPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
