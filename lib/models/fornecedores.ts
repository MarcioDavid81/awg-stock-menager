import { z } from "zod";

export const fornecedorSchema = z.object({
    __typename: z.literal("Fornecedor").default("Fornecedor"),
    id: z.string(),
    userId: z.string(),
})

export type Fornecedor = z.infer<typeof fornecedorSchema>
