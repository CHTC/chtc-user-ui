import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: 'Create Project',
};

function Page() {
  return <View />
}
export default Page;