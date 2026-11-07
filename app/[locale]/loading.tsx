export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
      <div className="h-8 w-48 animate-pulse rounded-btn bg-elevated" />
      <div className="h-4 w-64 animate-pulse rounded-full bg-elevated" />
      <div className="mt-6 h-80 w-full max-w-2xl animate-pulse rounded-card border border-gold-line bg-elevated/40" />
    </div>
  );
}