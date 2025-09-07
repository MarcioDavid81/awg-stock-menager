import { User } from "@/types/frontend";
import {
  createMongoAbility,
  ForcedSubject,
  CreateAbility,
  MongoAbility,
  AbilityBuilder,
} from "@casl/ability";
import { permissions } from "./permissions";

const actions = ["manage", "create", "read", "update", "delete"] as const;
const subjects = [
  "Company",
  "User",
  "Farm",
  "Talhao",
  "Fornecedor",
  "Produto",
  "Entrada",
  "Saida",
  "all",
] as const;
type AppAbilities = [
  (typeof actions)[number],
  (
    | (typeof subjects)[number]
    | ForcedSubject<Exclude<(typeof subjects)[number], "all">>
  )
];

export type AppAbility = MongoAbility<AppAbilities>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export function DefineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility);

  if (typeof permissions[user.role] !== "function") {
    throw new Error(`Permissão para a função ${user.role} não foi definida`);
  }
  permissions[user.role](user, builder);

  const ability = builder.build();
  ability.can = ability.can.bind(ability)
  ability.cannot = ability.cannot.bind(ability)
  return ability;
}
