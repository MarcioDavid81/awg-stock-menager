import { z } from "zod";
import { userSchema } from "../models/user";

export const usuarioSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('create'),
    z.literal('read'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal("Usuario"), userSchema]),
])

export type UsuarioSubject = z.infer<typeof usuarioSubject>