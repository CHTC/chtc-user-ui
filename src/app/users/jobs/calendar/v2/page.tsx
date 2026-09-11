import { Metadata } from "next";
import View from "../view";

export const metadata: Metadata = {
  title: "User Job Calendar (v2)",
  description:
    "What happened to a user's HTCondor jobs: a flow summary of the last day, week " +
    "or month over a calendar where each day is six 4-hour percentage bars.",
};

function Page() {
  return <View variant="v2" />;
}
export default Page;
