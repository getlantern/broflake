import {AppWrapper, Main} from './styles'
import {AppWidthProvider} from '../context'
import useElementSize from '../hooks/useElementSize'
import {BREAKPOINT, GOOGLE_FONT_LINKS} from '../constants'
import {useLayoutEffect, useRef} from 'react'

interface Props {
	children: (JSX.Element | false)[] | JSX.Element | false
}

const Layout = ({children}: Props) => {
	const [ref, { width }] = useElementSize()
	const fontLoaded = useRef(false)

	useLayoutEffect(() => {
		// Dynamically add font links to document
		// <link rel="preconnect" href="https://fonts.googleapis.com">
		// <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		// <link href="https://fonts.googleapis.com/css2?family=Urbanist&display=swap" rel="stylesheet">
		if (fontLoaded.current) return
		const addLink = ({href, rel}: {href: string, rel: string}) => {
			const link = document.createElement('link');
			link.rel = rel;
			link.href = href;
			document.getElementsByTagName('head')[0].appendChild(link);
		}
		GOOGLE_FONT_LINKS.forEach(addLink)
		fontLoaded.current = true
	}, [fontLoaded])

	return (
		<AppWidthProvider value={{width}}>
			<AppWrapper>
				<Main
					ref={ref}
					mobile={width < BREAKPOINT}
				>
					{children}
				</Main>
			</AppWrapper>
		</AppWidthProvider>
	)
}

export default Layout