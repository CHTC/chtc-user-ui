import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "User Job Calendar",
  description:
    "What happened to a user's HTCondor jobs: a flow summary of the last day, week " +
    "or month over a calendar of 4-hour stacked bars.",
};

function Page() {
  return <View />
}
export default Page;
