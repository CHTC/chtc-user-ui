"use client"

import {Button} from "@mui/material"
import { Add } from "@mui/icons-material";
import {useAuthClient} from "@/src/components/AuthProvider";

const CreateUserButton = () => {
  const { currentUser } = useAuthClient();

  if(currentUser?.is_admin !== true) {
    return null
  }

  return (
    <Button disabled={!currentUser} startIcon={<Add />} href={`/users/create/`}>
      Add User
    </Button>
  )
}

export default CreateUserButton;
