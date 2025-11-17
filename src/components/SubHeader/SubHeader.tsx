import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {ReactNode} from "react";
import Grid from "@mui/material/Grid";

interface SubHeaderProps {
	title?: ReactNode;
	links: {title: string, href: string}[];
}

const SubHeader = ({links}: SubHeaderProps) => {
	return (
		<Box
				sx={{
					margin: 0,
					padding: 0,
					display: "flex",
					justifyContent: 'center',
					backgroundColor: 'secondary.main',
					color: 'secondary.contrastText'
		}}
		>
			<Grid container spacing={2}>
				{links.map(page => (
						<Grid key={page.title}>
							<Button
									href={page.href}
									// @ts-expect-error MUI types are not recognizing the color prop
									color={'secondary.contrastText'}
							>
								{page.title}
							</Button>
						</Grid>
				))}
			</Grid>
		</Box>
	)
}

export default SubHeader;
