/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createMongoAbility,
  CreateAbility,
  MongoAbility,
  AbilityBuilder,
} from "@casl/ability";
import { permissions, UserForCASL } from "./permissions";
import { entradaSubject } from "./subjects/entradas";
import z from "zod";

const appAbilitiesSchema = z.union([
  entradaSubject,
  z.tuple([
    z.literal("manage"),
    z.literal("all"),
  ])
])

type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilities>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export function DefineAbilityFor(user: UserForCASL) {
  const builder = new AbilityBuilder(createAppAbility);

  if (typeof permissions[user.role] !== "function") {
    throw new Error(`Permissão para a função ${user.role} não foi definida.`);
  }
  permissions[user.role](user, builder);

  const ability = builder.build({
    detectSubjectType(subject) {
      return subject.__typename;
    },
  });

  return ability;
}
