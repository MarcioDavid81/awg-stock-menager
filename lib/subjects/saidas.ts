import { z } from "zod";
import { saidaSchema } from "../models/saida";

export const saidaSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('create'),
    z.literal('read'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal("Saida"), saidaSchema]),
])

export type SaidaSubject = z.infer<typeof saidaSubject>
