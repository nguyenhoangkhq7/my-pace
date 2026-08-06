import {create} from "zustand";
import {RegisterValues} from "../schema/auth.schema";

interface RegisterState {
    registerFormData: Partial<RegisterValues>;
    setRegisterData: (data: Partial<RegisterValues>) => void;
    resetRegisterData: () => void;
}

export const useRegisterStore = create<RegisterState>((set) => ({
    registerFormData: {},
    setRegisterData: (data) => set((state) => ({
        registerFormData: { ...state.registerFormData, ...data }
    })),
    resetRegisterData: () => set({ registerFormData: {} })
}))
