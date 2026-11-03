import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: 'Data Access',
};

function Page() {
  return <View />
}
export default Page;
