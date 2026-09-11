import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "User Jobs",
  description:
    "Every user who ran HTCondor jobs over a chosen range of days, busiest first, " +
    "with what they cost the pool and how much of it they used.",
};

function Page() {
  return <View />
}
export default Page;
