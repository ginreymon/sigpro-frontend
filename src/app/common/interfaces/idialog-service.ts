export interface IDialogService {
    title: string | null;
    message: string | null;
    iconName: string | null;
    acceptLabel: string | null;
    confirmCallback: (() => void) | null;   
}

