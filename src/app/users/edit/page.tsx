import { Metadata } from "next";
import UsersHeader from "@/src/app/users/_components/UsersHeader";
import View from "./view";

export const metadata: Metadata = {
  title: 'User',
};

function Page() {
  return (
    <UsersHeader>
      <View />
    </UsersHeader>
  )
}
export default Page;