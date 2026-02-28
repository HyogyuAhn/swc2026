export type ToastState = {
    message: string;
    kind: 'error' | 'info' | 'success';
} | null;
