import { z } from "zod";

export const talhaoSchema = z.object({
    __typename: z.literal("Talhao").default("Talhao"),
    id: z.string(),
    userId: z.string(),
})

export type Talhao = z.infer<typeof talhaoSchema>
