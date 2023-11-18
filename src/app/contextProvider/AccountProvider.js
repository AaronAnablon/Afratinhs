'use client'

import React, { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';

const Account = createContext();

export const AccountProvider = ({ children }) => {
    const { data: session } = useSession();
    const profile = session;
    return <Account.Provider value={profile}>{children}</Account.Provider>;
};

export const useAccount = () => {
    return useContext(Account);
};