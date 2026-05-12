import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: 'Project',
};

function Page() {
  return <View />
}
export default Page;