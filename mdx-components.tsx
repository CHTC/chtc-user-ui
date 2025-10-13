import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';
import Box from '@mui/material/Box';
import type { MDXComponents } from 'mdx/types';
import {Paper} from "@mui/material";
import ExportedImage from "next-image-export-optimizer";

const components: MDXComponents = {
	h1: ({ children, ...props }) => {
    return <Typography component={'h1'} variant="h4" gutterBottom{...props}>{children}</Typography>;
  },
	h2: ({ children, ...props }) => {
    return <Typography component={'h2'} variant="h5" gutterBottom sx={{mt: 3}} {...props}>{children}</Typography>;
  },
	h3: ({ children, ...props }) => {
    return <Typography component={'h3'} variant="h6" gutterBottom  sx={{mt: 2}} {...props}>{children}</Typography>;
  },
	h4: ({ children, ...props }) => {
    return <Typography component={'h4'} variant="h6" fontWeight={400} borderBottom={"black solid 1px"} gutterBottom {...props}>{children}</Typography>;
  },
	h5: ({ children, ...props }) => {
    return <Typography component={'h5'} variant="h6" fontWeight={300} gutterBottom {...props}>{children}</Typography>;
  },
	h6: ({ children, ...props }) => {
		return <Typography component={'h6'} variant="h6" fontWeight={300} color={"primary.main"} gutterBottom {...props}>{children}</Typography>;
	},
	p: (props) => <Typography variant="body1" component={'div'} gutterBottom {...props} />, // use sx for spacing
	a: (props) => <MuiLink {...props} />,
	ul: (props) => <Box component="ul" sx={{ pl: 4, mb: 2 }} {...props} />,
	ol: (props) => <Box component="ol" sx={{ pl: 4, mb: 2 }} {...props} />,
	li: (props) => <Box component="li" sx={{ mb: 0.5 }} {...props} />,
	blockquote: (props) => <Box component="blockquote" sx={{ borderLeft: 4, borderColor: 'grey.300', pl: 2, ml: 0, my: 2, color: 'grey.700', fontStyle: 'italic' }} {...props} />,
	code: ({props, children}) => {
		return <>
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.0/styles/github.min.css"/>
			<Box component="code" sx={{ bgcolor: 'grey.100', py: 0.2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.95em' }} {...props}>{children}</Box>
		</>
	},
	pre: (props) => <Box component="pre" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2, overflow: 'auto', mb: 2 }} {...props} />,
	img: async (props) => {

		// Pull out the #only-light and #only-dark tags if they exist
		const mode = props.src?.includes('#only-light') ? 'light' : props.src?.includes('#only-dark') ? 'dark' : 'na'

		// Strip mode tag and /docs/ from the image path to get the relative path in the public/docs folder
		const imagePath = (props.src as string).replace('/docs/', '').replace('#only-light', '').replace('#only-dark', '')

		try {
			const image = await import(`@/public/docs/${imagePath}`)

			return (
				<Paper elevation={1} sx={{maxWidth: '100%', height: 'auto', my: 2, borderRadius: 2}}>
					<ExportedImage {...props} mode={mode} style={{width: "100%", height: 'auto'}} src={image.default} />
				</Paper>
			)
		} catch (e) {

			console.error(`Image not found: ${imagePath}`, e)
			return <Typography color={"error"}>Image not found: {imagePath}</Typography>
		}
	},
}

export function useMDXComponents(): MDXComponents {
	return components
}
