import { useEffect } from "react";

export default function usePageTitle(title: string | null | undefined) {
  if (!title) return;

  useEffect(() => {
    document.title = title + " | CHTC User App";
  })
}
