"use client";

import { Company } from "@/types/frontend";
import { createContext, useContext } from "react";

type UserCompanyType = {
  name: Pick<Company, "id" | "name"> | null;
};

const CompanyContext = createContext<UserCompanyType>({
  name: null,
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({
  name,
  children,
}: {
  name: Pick<Company, "id" | "name"> | null;
  children: React.ReactNode;
}) => {
  return (
    <CompanyContext.Provider value={{ name }}>
      {children}
    </CompanyContext.Provider>
  );
};