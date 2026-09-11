import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "My Jobs",
  description:
    "What happened to your HTCondor jobs: a flow summary of the last day, week " +
    "or month over a calendar of 4-hour stacked bars.",
};

function Page() {
  return <View />
}
export default Page;
