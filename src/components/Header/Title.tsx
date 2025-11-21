import Icon from "@/src/components/Header/Icon";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

const Title = () => (
  <Link href={"/"} display={"flex"} flexDirection={"row"} alignItems={"center"} gap={{ lg: 3, xs: 1 }}>
    <Icon />
    <Typography variant="h4" sx={{ color: "primary.contrastText" }}>
      CHTC User App
    </Typography>
    3
  </Link>
);

export default Title;
