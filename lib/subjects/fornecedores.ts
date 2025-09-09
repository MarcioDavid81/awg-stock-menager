import { z } from "zod";
import { fornecedorSchema } from "../models/fornecedores";

export const fornecedorSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('create'),
    z.literal('read'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal("Fornecedor"), fornecedorSchema]),
])

export type FornecedorSubject = z.infer<typeof fornecedorSubject>
