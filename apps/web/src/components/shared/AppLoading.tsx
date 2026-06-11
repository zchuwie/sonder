import { MapPin } from "lucide-react";

export function AppLoading({
  label = "Finding your place...",
  contained = false,
}: {
  label?: string;
  contained?: boolean;
}) {
  return (
    <div
      className={
        contained
          ? "absolute inset-0 z-30 flex items-center justify-center bg-[#eef0e5]/90 backdrop-blur-sm dark:bg-[#101713]/90"
          : "flex min-h-dvh items-center justify-center bg-[#f5f1e8] px-6 text-[#101713] dark:bg-[#050706] dark:text-[#f5f1e8]"
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative flex size-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full border border-[#a8ba63]/50" />
          <span className="absolute inset-3 animate-pulse rounded-full bg-[#a8ba63]/20" />
          <span className="relative flex size-11 items-center justify-center rounded-full bg-[#2f4439] text-white shadow-xl dark:bg-[#a8ba63] dark:text-[#101713]">
            <MapPin className="size-5" />
          </span>
        </div>
        <p className="mt-5 font-serif text-2xl">{label}</p>
        <p className="mt-2 text-xs text-[#657067] dark:text-[#aeb7af]">
          Sonder is preparing the map.
        </p>
      </div>
    </div>
  );
}
