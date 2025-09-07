import { User } from "@/types/frontend";
import { AbilityBuilder } from "@casl/ability";
import { AppAbility } from "./role-ability";

type Roles = "ADMIN" | "USER";

type PermissionByRole = (
  user: Pick<User, "role">,
  builder: AbilityBuilder<AppAbility>
) => void;

export const permissions: Record<Roles, PermissionByRole> = {
  ADMIN(user, { can }) {
    can("manage", "all");
  },
  USER(user, { can }) {
    can("read", "all");    
  },
};
