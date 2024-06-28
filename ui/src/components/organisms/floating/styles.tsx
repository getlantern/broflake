import styled from 'styled-components'
import {COLORS, MAX_WIDTH, Themes} from '../../../constants'

export const Container = styled.div`
  box-sizing: border-box;
  border-radius: 16px 16px 0 0;
  border: 1px solid ${({theme}: { theme: Themes }) => theme === Themes.DARK ? COLORS.grey6 : COLORS.grey2};
  width: 100%;
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
	a {
		outline: none;
		cursor: pointer;
	}
`

export const HeaderRight = styled.div`
	display: flex;
  align-items: center;
	z-index: 1;
`

export const BodyWrapper = styled.div`
  padding: 24px 16px;
  display: flex;
	justify-content: center;
	align-items: center;
`

export const Body = styled.div`
  display: flex;
  width: 100%;
  max-width: ${MAX_WIDTH}px;
  flex-direction: ${(props: {mobile: boolean}) => props.mobile ? 'column' : 'row'};
  align-items: center;
`

export const Item = styled.div`
	display: flex; 
	gap: 24px;
  align-items: center;
	justify-content: space-between;
  border: 1px solid ${({theme}: {theme: Themes}) => theme === Themes.DARK ? COLORS.grey4 : COLORS.grey2};
  border-radius: 8px;
	height: 32px;
	padding: 0 16px;
`

export const CtaWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 24px 0 0 0;
`