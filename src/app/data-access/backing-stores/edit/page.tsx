import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: 'Backing Store',
};

function Page() {
  return <View />
}
export default Page;
