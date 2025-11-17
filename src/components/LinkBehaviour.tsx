import Link, {LinkProps} from 'next/link'
import {forwardRef} from "react";

const LinkBehaviour = forwardRef<HTMLAnchorElement, LinkProps>(
	function LinkBehaviour(props, ref) {

		if(props.href === undefined){
			console.warn(props)
			console.warn("LinkBehaviour: 'href' prop is undefined. This may cause issues with navigation.");
			return <a ref={ref} href={'/'} />;
		}

		return <Link ref={ref} {...props} />;
	}
);

export default LinkBehaviour;
