import { LoadingSpinner } from "@/components/ui/loading-spinner";

// This component will be rendered while the page is loading
export default function LoadingPage() {
  return <LoadingSpinner fullPage text="Loading scenario..." />;
}
