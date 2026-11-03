import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function usePageTitle(title: string | null | undefined) {
  // Next resets the title to the route's metadata whenever the URL changes, e.g. when a
  // table writes its state to the query string, so set it again on every change.
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!title) return;
    document.title = title + " | CHTC User App";
  }, [title, searchParams]);
}
