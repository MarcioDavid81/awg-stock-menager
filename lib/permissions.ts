import { AbilityBuilder } from "@casl/ability";
import { AppAbility } from "./role-ability";
import { Role } from "./subjects/roles";

export type UserForCASL ={
    id: string;
    role: Role;
}

type PermissionByRole = (
  user: UserForCASL,
  builder: AbilityBuilder<AppAbility>
) => void;

export const permissions: Record<Role, PermissionByRole> = {
  ADMIN(_, { can }) {
    can("manage", "all");
  },
  USER(user, { can, cannot }) {
    can(["read", "create"], "Entrada");  
    cannot(["update", "delete"], "Entrada");
    can(["update", "delete"], "Entrada", { userId: { $eq: user.id }});
    can(["read", "create"], "Saida");
    cannot(["update", "delete"], "Saida");
    can(["update", "delete"], "Saida", { userId: { $eq: user.id }});
    can(["read", "create"], "Fornecedor");
    cannot(["update", "delete"], "Fornecedor");
    can(["update", "delete"], "Fornecedor", { userId: { $eq: user.id }});
    can(["read", "create"], "Produto");
    cannot(["update", "delete"], "Produto");
    can(["update", "delete"], "Produto", { userId: { $eq: user.id }});
    can(["read", "create"], "Talhao");
    cannot(["update", "delete"], "Talhao");
    can(["update", "delete"], "Talhao", { userId: { $eq: user.id }});
    cannot(["create", "read", "manage", "delete"], "Usuario");
    can(["read", "update"], "Usuario", { id: { $eq: user.id }});
  },
};
