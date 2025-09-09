import { z } from "zod";
import { produtoSchema } from "../models/produtos";

export const produtoSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('create'),
    z.literal('read'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal("Produto"), produtoSchema]),
])

export type ProdutoSubject = z.infer<typeof produtoSubject>
