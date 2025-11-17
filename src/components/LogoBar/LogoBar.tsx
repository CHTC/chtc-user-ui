import Box from '@mui/material/Box';
import Link from '@mui/material/Link'
import Container from '@mui/material/Container';
import ExportedImage from "next-image-export-optimizer";

const SCALING_FACTOR = 1.4;

const LogoBar = () => {
	return (
		<>
			<Box
				sx={{
					width: '100%',
					backgroundColor: 'primary.main',
					color: 'primary.contrastText',
					height: '.5rem'
				}}
			>
			</Box>
			<Container maxWidth="lg">
				<Box display="flex" alignItems="center" justifyContent={'center'} gap={4} py={2} flexWrap={"wrap"}>
					<Link href={"https://chtc.wisc.edu"} target="_blank" rel="noopener" display={'block'}>
						<ExportedImage src="/logos/chtc.svg" alt="CHTC Logo" height={40 * SCALING_FACTOR} width={100 * SCALING_FACTOR} style={{objectFit: 'contain'}} />
					</Link>
					<Link href={"https://it.wisc.edu/"} target="_blank" rel="noopener" display={'block'}>
						<ExportedImage src="/logos/doit.svg" alt="DoIT Logo" height={40 * SCALING_FACTOR} width={100 * SCALING_FACTOR} style={{objectFit: 'contain'}} />
					</Link>
					<Link href={"https://dsi.wisc.edu/"} target="_blank" rel="noopener" display={'block'}>
						<ExportedImage src="/logos/dsi.png" alt="DSI Logo" height={40 * SCALING_FACTOR} width={140 * SCALING_FACTOR} style={{objectFit: 'contain'}} />
					</Link>
				</Box>
			</Container>
		</>

	)
}

export default LogoBar;
