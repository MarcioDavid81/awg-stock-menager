import { z } from "zod";

export const entradaSchema = z.object({
    __typename: z.literal("Entrada").default("Entrada"),
    id: z.string(),
    userId: z.string(),
})

export type Entrada = z.infer<typeof entradaSchema>