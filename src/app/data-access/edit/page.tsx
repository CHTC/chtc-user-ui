import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: 'Data Access Entry',
};

function Page() {
  return <View />
}
export default Page;
