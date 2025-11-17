import { ArrowForward } from "@mui/icons-material";
import {Box, Button, Link, Paper, Typography } from "@mui/material";

interface TitleActionCardProps {
	title: string;
	action: {
		label: string;
		href: string;
	}
}

const TitleActionCard = ({title, action}: TitleActionCardProps) => {
	return (
		<Paper sx={{width: "100%"}}>
			<Box display="flex" flexDirection={'column'} padding={2}>
				<Typography variant="h6" gutterBottom>{title}</Typography>
				<Link href={action.href}>
					<Button variant="contained" color="primary" endIcon={<ArrowForward fontSize="small" />}>
						{action.label}
					</Button>
				</Link>
			</Box>
		</Paper>
	)
}

export default TitleActionCard;
