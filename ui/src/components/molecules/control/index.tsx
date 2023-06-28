import {Text} from '../../atoms/typography'
import Switch from '../../atoms/switch'
import {useEmitterState} from '../../../hooks/useStateEmitter'
import {readyEmitter, sharingEmitter} from '../../../utils/wasmInterface'
import Info from '../info'
import {TextInfo} from './styles'
import {useContext, useState} from 'react'
import {AppContext} from '../../../context'
import {COLORS, Targets} from '../../../constants'
import {pushNotification} from '../notification'

interface Props {
	onToggle?: (s: boolean) => void
	info?: boolean
}

const Control = ({onToggle, info = false}: Props) => {
	const ready = true // useEmitterState(readyEmitter)
	const sharing = useEmitterState(sharingEmitter)
	const {wasmInterface, settings} = useContext(AppContext)
	const {mock, target} = settings
	// on web, we don't need to initialize wasm until user starts sharing
	const needsInit = target === Targets.WEB && !wasmInterface?.instance
	const [loading, setLoading] = useState(false)

	const init = async () => {
		if (!wasmInterface) return
		setLoading(true)
		const instance = await wasmInterface.initialize({mock, target})
		if (!instance) return console.warn('wasm failed to initialize')
		console.log(`p2p ${mock ? '"wasm"' : 'wasm'} initialized!`)
		setLoading(false)
	}

	const _onToggle = async (share: boolean) => {
		if (needsInit) await init()
		if (share) {
			await wasmInterface.buildNewClient()
			wasmInterface.start()
			pushNotification({text: 'Sharing your connection'})
		}
		if (!share) wasmInterface.stop()
		if (onToggle) onToggle(share)
	}

	return (
		<>
			<TextInfo>
				<Text
					style={{minWidth: 160, fontWeight: 'bold'}}
				>
					Connection sharing: <span style={{color: sharing ? COLORS.green : COLORS.error}}>{sharing ? 'ON' : 'OFF'}</span>
				</Text>
				{ info && <Info /> }
			</TextInfo>
			<Switch
				onToggle={_onToggle}
				checked={sharing}
				disabled={!ready && !needsInit}
				loading={loading}
			/>
		</>
	)
}

export default Control
