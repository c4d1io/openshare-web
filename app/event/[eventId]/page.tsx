"use client";

import { AuthProvider } from "@/components/contexts/AuthContext";
import EventDetailPage from "@/components/EventDetailPage";
import { useRouter } from "next/navigation";

interface EventPageProps {
  params: { eventId: string };
}

export default function EventPage({ params }: EventPageProps) {
  const router = useRouter();
  const { eventId } = params;

  const handleBack = () => {
    router.push("/");
  };

  return (
    <AuthProvider eventCode="demo-event">
      <EventDetailPage eventId={eventId} onBack={handleBack} />
    </AuthProvider>
  );
}
