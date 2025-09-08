import { z } from "zod";

export const roleSChema = z.union([
    z.literal('ADMIN'),
    z.literal('USER'),
])

export type Role = z.infer<typeof roleSChema>   
