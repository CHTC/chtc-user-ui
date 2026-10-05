// The way back to the user table, as a breadcrumb trail above whichever
// calendar is open.
//
// A layout rather than part of the view: the view renders nothing until the
// auth check has resolved, so anything inside it appears a beat after the page
// does and shoves the content down. The layout is on screen from the first
// paint, for both /users/jobs/calendar/ and /users/jobs/calendar/v2/.

import CalendarBreadcrumbs from "./_components/CalendarBreadcrumbs";

export default function CalendarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <CalendarBreadcrumbs />
      {children}
    </>
  );
}
