import { z } from "zod";
import { roleSChema } from "../subjects/roles";

export const userSchema = z.object({
    id: z.string(),
    role: roleSChema,
})

export type User = z.infer<typeof userSchema>