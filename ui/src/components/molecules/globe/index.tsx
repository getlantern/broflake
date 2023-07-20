// @ts-nocheck @todo add types
/***
	This uses https://github.com/vasturiano/react-globe.gl to bootstrap the webgl globe for prototype/iteration.
	Ideally once we've tuned it to our liking - this should be build bespoke using three.js for decreased bundle
	size and better performance.

	Also see the patches dir for changes to the shader program that are not exposed through the react-globe api.
 ***/
import GlobeComponent from 'react-globe.gl'
import {Container} from './styles'
import {useContext, useEffect, useMemo, useRef, useState} from 'react'
import {AppContext} from '../../../context'
import {BREAKPOINT, COLORS, Targets, UV_MAP_PATH_DARK, UV_MAP_PATH_LIGHT} from '../../../constants'
import Shadow from './shadow'
import ToolTip from '../toolTip'
import {useGeo} from '../../../hooks/useGeo'
import {Themes} from '../../../constants'
import {Notification} from '../notification'
import * as THREE from 'three'
// import {useEmitterState} from '../../../hooks/useStateEmitter'
// import {sharingEmitter} from '../../../utils/wasmInterface'
// import {countries} from "../../../utils/countries";
// import InteractAnim from './interactAnim'

interface Props {
	target: Targets
}

const calcOffset = (size: number, title: boolean, menu: boolean) => {
	if (size === 250) return -10
	let offset = -10
	if (title) offset += 40
	if (menu) offset -= 40
	return offset
}


const createGradientTexture = (blue = true) => {
	const size = 100; // The size of the texture
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;

	const context = canvas.getContext('2d');
	const gradient = context.createRadialGradient(
		size / 2,
		size / 2,
		0,
		size / 2,
		size / 2,
		size / 2
	);

	gradient.addColorStop(0, blue ? 'rgba(0, 188, 212, 1)' : 'rgba(255, 193, 7, 1)');
	gradient.addColorStop(1, blue ? 'rgba(0, 188, 212, 0)' : 'rgba(255, 193, 7, 0)');
	context.fillStyle = gradient;
	context.fillRect(0, 0, size, size);

	return new THREE.CanvasTexture(canvas);
}

const gradientTextureBlue = createGradientTexture(true);
const gradientTextureYellow = createGradientTexture(false);
const materialBlue = new THREE.MeshLambertMaterial({
	map: gradientTextureBlue,
	blending: THREE.NormalBlending,
	transparent: true,
	name: 'blue'
});
const materialYellow = new THREE.MeshLambertMaterial({
	map: gradientTextureYellow,
	blending: THREE.NormalBlending,
	transparent: true,
	name: 'yellow'
});

const Globe = ({target}: Props) => {
	// const sharing = useEmitterState(sharingEmitter)
	const {width, settings} = useContext(AppContext)
	const {theme, title, menu} = settings
	const size = width < BREAKPOINT ? 250 : 400
	const isSetup = useRef(false)
	const [arc, setArc] = useState(null)
	const count = arc ? arc.workerIdxArr.length : 0
	const globe = useRef()
	const container = useRef()
	const {arcs, points} = useGeo()
	const [altitude, setAltitude] = useState(14)
	// const lastAnimation = useRef(0)
	// const [interacted, setInteracted] = useState(false)

	const ghostArcs = useMemo(() => {
		if (!arcs) return []
		return arcs.map(arc => {
			const {endLat, endLng, startLat, startLng, workerIdxArr, country, iso} = arc
			return ({endLat, endLng, startLat, startLng, workerIdxArr, country, iso, ghost: true})
		})
	}, [arcs])

	// useEffect(() => { // @todo re-enable this when we determine the better ux see https://github.com/getlantern/engineering/issues/216
	// 	if (!globe.current) return
	// 	const now = Date.now()
	// 	if (sharing && country && (now - lastAnimation.current) > 5000) {
	// 		const userLoc = countries[country]
	// 		globe.current.pointOfView({
	// 			lat: 20, // equator
	// 			lng: points.length === 0 ? userLoc.longitude : points[points.length - 1].lng,
	// 			altitude: 2.5
	// 		}, 1000)
	// 		lastAnimation.current = now
	// 	}
	// 	// alert(points[points.length - 1])
	// }, [sharing, country, points])

	useEffect(() => {
		if (!globe.current) return
		const controls = globe.current.controls()
		controls.autoRotate = !arc
	}, [arc])

	const setUp = () => {
		if (isSetup.current || !globe.current) return
		isSetup.current = true
		const controls = globe.current.controls()
		const camera = globe.current.camera()
		const scene = globe.current.scene()
		controls.enableZoom = target !== Targets.EXTENSION_POPUP // disable zoom on extension popup
		controls.autoRotate = true
		controls.maxDistance = 1500
		controls.minDistance = 300
		controls.autoRotateSpeed = 1.5
		const directionalLight = scene.children.find(obj3d => obj3d.type === 'DirectionalLight')
		if (directionalLight) directionalLight.intensity = .25
		const clonedLight = directionalLight.clone()
		clonedLight.position.set(0, 500, 0)
		camera.add(clonedLight)
		scene.add(camera)
		scene.remove(directionalLight)
	}

	const setRotateSpeed = (speed) => {
		if (!globe.current) return
		const controls = globe.current.controls()
		controls.autoRotateSpeed = speed
	}

	useEffect(() => {
		const animate = () => {
			requestAnimationFrame(animate)
			if (!globe.current) return
			const scene = globe.current?.scene()
			if (!scene) return
			// scene.children.forEach(obj3d => console.log(obj3d.type))
			const fromKapsule = scene.children.find(obj3d => obj3d.type === 'Group')
			if (!fromKapsule) return
			const lineSegmentGroups = fromKapsule.children[0].children
			lineSegmentGroups.forEach(group => {
				const lineSegments = group.children.find(obj3d => obj3d.type === 'LineSegments')
				if (lineSegments) {
					// @todo
				}
			})

			const pointMeshes = fromKapsule.children[0].children[1].children
			pointMeshes.forEach(mesh => {
				if (mesh.material.color.r === 0 || mesh.material.name === 'blue') mesh.material = materialBlue
				else mesh.material = materialYellow
			})
		}
		animate()
	}, [])

	// const colorInterpolatorBlue = t => `rgba(0, 188, 212,${Math.sqrt(1-t)})`;
	// const colorInterpolatorYellow = t => `rgba(255, 193, 7,${Math.sqrt(1-t)})`;

	return (
		<Container
			ref={container}
			offset={calcOffset(size, title, menu)}
			size={size}
			active={!!arc}
			style={{
				minHeight: 250, // sm breakpoint
				maxHeight: (!menu && title) ? 424 : (!menu || title) ? 400 : 350, // lg breakpoint
			}}
			// onMouseDown={() => setInteracted(true)}
			// onTouchStart={() => setInteracted(true)}
			onMouseEnter={() => setRotateSpeed(1)}
			onMouseLeave={() => setRotateSpeed(1.5)}
		>
			<Shadow
				scale={1/(altitude/2)} // altitude is 2-14
			/>
			<GlobeComponent
				ref={globe}
				onGlobeReady={setUp}
				width={size}
				height={size}
				enablePointerInteraction={true}
				waitForGlobeReady={true}
				showAtmosphere={true}
				atmosphereColor={COLORS.brand}
				atmosphereAltitude={.25}
				backgroundColor={'rgba(0,0,0,0)'}
				backgroundImageUrl={null}
				globeImageUrl={theme === Themes.DARK ? UV_MAP_PATH_DARK : UV_MAP_PATH_LIGHT}
				arcsData={[...arcs, ...ghostArcs]}
				arcColor={arc => arc.ghost ? 'rgba(255, 255, 255, 0)' : ['rgba(0, 188, 212, 0.0)', 'rgba(0, 188, 212, 0.75)', 'rgba(0, 188, 212, 0.75)', 'rgba(255, 193, 7, 0.75)', 'rgba(255, 193, 7, 0.0)']}
				arcDashLength={1}
				arcDashGap={0.5}
				arcDashInitialGap={1}
				arcDashAnimateTime={arc => arc.ghost ? 0 : 1000}
				arcsTransitionDuration={0}
				arcStroke={arc => arc.ghost ? 10 : 2}
				arcAltitudeAutoScale={0.3}
				onArcHover={setArc}
				pointsData={points}
				pointColor={p => p.origin ? 'rgba(0, 188, 212, 0.25)' : 'rgba(255, 193, 7, 0.25)'}
				pointRadius={4}
				pointAltitude={0}
				pointsTransitionDuration={500}
				onZoom={zoom => {
					let smooth = Math.round(zoom.altitude * 10) / 10
					if (smooth !== altitude) setAltitude(smooth)
				}}
				// ringsData={rings}
				// ringColor={p => p.origin ? colorInterpolatorBlue : colorInterpolatorYellow}
				// // ringMaxRadius={4}
				// // ringRepeatPeriod={1000}
				// ringPropagationSpeed={1}
			/>
			<ToolTip
				text={!!arc && `${count} ${count === 1 ? 'person' : 'people'} from ${arc.country.split(',')[0]}`}
				show={!!arc}
				container={container}
			/>
			<Notification />
			{/*@todo re-enable this after we determine better UX see https://github.com/getlantern/engineering/issues/215*/}
			{/*{*/}
			{/*	isSetup && !interacted && (*/}
			{/*		<InteractAnim />*/}
			{/*	)*/}
			{/*}*/}
		</Container>
	)
}

export default Globe