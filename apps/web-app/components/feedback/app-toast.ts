"use client";

import { toast, type ExternalToast } from "sonner";

export type AppToastOptions = ExternalToast;

export const appToast = {
    success(message: Parameters<typeof toast.success>[0], options?: AppToastOptions) {
        return toast.success(message, options);
    },
    error(message: Parameters<typeof toast.error>[0], options?: AppToastOptions) {
        return toast.error(message, options);
    },
    info(message: Parameters<typeof toast.info>[0], options?: AppToastOptions) {
        return toast.info(message, options);
    },
    loading(message: Parameters<typeof toast.loading>[0], options?: AppToastOptions) {
        return toast.loading(message, options);
    },
    dismiss(id?: string | number) {
        return toast.dismiss(id);
    },
    promise: toast.promise,
};

