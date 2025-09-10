import { z } from "zod";
import { roleSChema } from "../subjects/roles";

export const userSchema = z.object({
    __typename: z.literal("Usuario"),
    id: z.string(),
    role: roleSChema,
})

export type User = z.infer<typeof userSchema>