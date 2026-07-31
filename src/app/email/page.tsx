import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: 'Email List Generator',
};

function Page() {
  return <View />
}
export default Page;
