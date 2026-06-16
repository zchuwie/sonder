import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-dvh place-items-center p-5 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Access denied</h1>
        <p className="mt-2 text-gray-500">This account is not a Sonder administrator.</p>
        <Link href="/login" className="mt-5 inline-block rounded-xl bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-hover">Return to login</Link>
      </div>
    </main>
  );
}
