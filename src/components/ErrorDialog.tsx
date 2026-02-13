import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { ApiError } from "@/lib/error";

interface ErrorDialogProps {
    error: ApiError | Error | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ErrorDialog({ error, open, onOpenChange }: ErrorDialogProps) {
    if (!error) return null;

    const isApiError = error instanceof ApiError;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-red-200 bg-red-50">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-6 w-6" />
                        <DialogTitle>Operation Failed</DialogTitle>
                    </div>
                    <DialogDescription className="text-red-900 font-medium">
                        {error.message}
                    </DialogDescription>
                </DialogHeader>

                {isApiError && (
                    <div className="mt-4 space-y-2">
                        <div className="p-2 bg-white/50 rounded text-xs font-mono text-slate-700">
                            <p>Status: {error.status} {error.statusText}</p>
                        </div>
                        {error.details && (
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-700">Server Details:</p>
                                <ScrollArea className="h-[150px] w-full rounded-md border p-2 bg-white text-xs font-mono">
                                    <pre>{JSON.stringify(error.details, null, 2)}</pre>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                )}

                {!isApiError && (
                    <div className="mt-4 p-2 bg-white/50 rounded text-xs font-mono text-slate-700">
                        {error.stack}
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
}
