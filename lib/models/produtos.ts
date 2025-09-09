import { z } from "zod";

export const produtoSchema = z.object({
    __typename: z.literal("Produto").default("Produto"),
    id: z.string(),
    userId: z.string(),
})

export type Produto = z.infer<typeof produtoSchema>
