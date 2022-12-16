import {Text} from './styles'
import {useContext, CSSProperties} from 'react'
import {AppContext} from '../../../context'
import {Themes} from '../../../index'
import {COLORS} from '../../../constants'

interface Props {
	style?: CSSProperties
}

const About = ({style = {}}: Props) => {
	const {theme} = useContext(AppContext)
	const color = theme === Themes.DARK ? COLORS.grey2 : COLORS.grey
	const brand = theme === Themes.DARK ? COLORS.altBrand : COLORS.brand
	return(
		<Text
			style={{color, margin: 0, ...style}}
		>
			Sharing your connection enables people living with censorship to access the open internet using <a style={{color: brand}} href={'https://lantern.io'} target={'_blank'} rel={'noreferrer'}>Lantern</a>.  Thank you for your support.
		</Text>
	)
}

export default About