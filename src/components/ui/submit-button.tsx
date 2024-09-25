import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import styles from "./button.module.css";

interface submitButtonProps {
    onClick?: () => void;
    className?: string;
    children?: React.ReactNode;
    type?: "button" | "submit" | "reset";
    loading?: boolean;
    variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost"  | null | undefined;
    serverError?: string;
    error?: boolean;
    errorMessage?: string;
}
export function SubmitButton(props: submitButtonProps) {
    if (props.loading) {
        return (
        <Button
            type={props.type || "button"}
            onClick={props.onClick}
            className={cn("w-full", props.className)}
            variant={props.variant}
        >
            <div className='flex flex-row'>
                <div className={styles.dotFlashing}></div>
            </div>
        </Button>
        );
    }

    if (props.serverError) {
        return (
        <Button
            type={props.type || "button"}
            onClick={props.onClick}
            className={cn("w-full", props.className)}
            variant='destructive'

        >
            <p className="">
            {props.serverError}
            </p>
        </Button>
        );
    }

    if (props.error) {
        return (
        <Button
            type={props.type || "button"}
            onClick={props.onClick}
            className={cn("w-full", props.className)}
            variant='destructive'

        >
            <p className="text-wrap">
            {props.errorMessage}
            </p>
        </Button>
        );
    }


    return (
        <Button
        type={props.type || "button"}
        onClick={props.onClick}
        className={cn("w-full", props.className)}
        variant={props.variant}
        >
        {props.children}
        </Button>
    );
    }