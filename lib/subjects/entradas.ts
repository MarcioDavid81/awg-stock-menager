import { z } from "zod";
import { entradaSchema } from "../models/entrada";

export const entradaSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('create'),
    z.literal('read'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal("Entrada"), entradaSchema]),
])

export type EntradaSubject = z.infer<typeof entradaSubject>
