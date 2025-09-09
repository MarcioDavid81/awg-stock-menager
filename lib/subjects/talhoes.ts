import { z } from "zod";
import { talhaoSchema } from "../models/talhoes";

export const talhaoSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('create'),
    z.literal('read'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal("Talhao"), talhaoSchema]),
])

export type TalhaoSubject = z.infer<typeof talhaoSubject>
