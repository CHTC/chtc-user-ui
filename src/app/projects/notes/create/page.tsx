import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: 'Create Project Note',
};

function Page() {
  return <View />
}
export default Page;