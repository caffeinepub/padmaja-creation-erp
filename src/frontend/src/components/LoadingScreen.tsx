interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Loading Padmaja Creation...",
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Logo mark */}
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-card">
          <span className="text-2xl font-display font-bold text-primary-foreground">
            PC
          </span>
        </div>
        {/* Animated dots */}
        <div className="flex gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="text-sm text-muted-foreground font-body">{message}</p>
      </div>
    </div>
  );
}
