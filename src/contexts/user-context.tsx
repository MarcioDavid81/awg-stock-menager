"use client";

import { createContext, useContext } from "react";

// Tipo que corresponde ao retorno da função getUserFromToken
export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  avatarUrl: string | null;
  company: {
    id: string;
    name: string;
  } | null;
} | null;

type UserContextType = {
  user: AuthenticatedUser;
};

const UserContext = createContext<UserContextType>({
  user: null,
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({
  user,
  children,
}: {
  user: AuthenticatedUser;
  children: React.ReactNode;
}) => {
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
};
