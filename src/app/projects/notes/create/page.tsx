import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: 'Create Note',
};

function Page() {
  return <View />
}
export default Page;