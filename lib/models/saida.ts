import { z } from "zod";

export const saidaSchema = z.object({
    __typename: z.literal("Saida").default("Saida"),
    id: z.string(),
    userId: z.string(),
})

export type Saida = z.infer<typeof saidaSchema>
