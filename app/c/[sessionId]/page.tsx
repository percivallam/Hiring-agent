import { AppShell } from "@/components/app/app-shell";

type PageProps = {
  params: { sessionId: string };
  searchParams: { drawer?: string };
};

export default function ConversationPage({ params, searchParams }: PageProps) {
  const drawer = ["pipeline", "jd", "diagnosis"].includes(searchParams.drawer ?? "")
    ? (searchParams.drawer as "pipeline" | "jd" | "diagnosis")
    : undefined;

  return <AppShell sessionId={params.sessionId} initialDrawer={drawer} />;
}
