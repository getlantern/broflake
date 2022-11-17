import styled from 'styled-components'
import {COLORS} from '../../../constants'

const Container = styled.div`
	display: flex;
  align-items: center;
`

const Label = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 26px;
`

const Input = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${(props: {checked: boolean}) => props.checked ? COLORS.green : COLORS.grey};
  transition: 0.4s;
  border-radius: 34px;
	&:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 4px;
    bottom: 4px;
    background-color: ${COLORS.white};
    border-radius: 50%;
    transition: transform 250ms;
    transform: translateX(${(props: {checked: boolean}) => props.checked ? '18px' : 0});
	}
`


export {Container, Label, Input, Slider}