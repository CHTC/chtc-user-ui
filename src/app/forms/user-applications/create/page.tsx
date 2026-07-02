import { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: 'Create User Application',
};

function Page() {
  return <View />
}
export default Page;