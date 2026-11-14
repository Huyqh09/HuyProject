import React, { useEffect, useRef, useState } from 'react'

const DEFAULT_CENTER = { latitude: 16.0471, longitude: 108.2068 }
const TILE_SIZE = 256
const clampLatitude = latitude => Math.max(-85.0511, Math.min(85.0511, latitude))

const toWorldPixel = (latitude, longitude, zoom) => {
    const scale = TILE_SIZE * (2 ** zoom)
    const sinLatitude = Math.sin(clampLatitude(latitude) * Math.PI / 180)
    return {
        x: ((longitude + 180) / 360) * scale,
        y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale
    }
}

const fromWorldPixel = (x, y, zoom) => {
    const scale = TILE_SIZE * (2 ** zoom)
    const longitude = x / scale * 360 - 180
    const mercator = Math.PI - (2 * Math.PI * y) / scale
    const latitude = 180 / Math.PI * Math.atan(Math.sinh(mercator))
    return { latitude: clampLatitude(latitude), longitude: Math.max(-180, Math.min(180, longitude)) }
}

const MapView = ({ markers = [], center, onPick, onMarkerClick, height = 420, zoom: initialZoom = 12 }) => {
    const mapRef = useRef(null)
    const dragRef = useRef(null)
    const suppressClickRef = useRef(false)
    const [mapCenter, setMapCenter] = useState(center || DEFAULT_CENTER)
    const [zoom, setZoom] = useState(initialZoom)
    const [size, setSize] = useState({ width: 800, height })
    const [selectedMarker, setSelectedMarker] = useState(null)

    useEffect(() => {
        if (center && Number.isFinite(Number(center.latitude)) && Number.isFinite(Number(center.longitude))) {
            setMapCenter({ latitude: Number(center.latitude), longitude: Number(center.longitude) })
        }
    }, [center?.latitude, center?.longitude])

    useEffect(() => {
        setZoom(Math.max(4, Math.min(18, initialZoom)))
    }, [initialZoom])

    useEffect(() => {
        if (!mapRef.current || !window.ResizeObserver) return undefined
        const observer = new ResizeObserver(entries => {
            const rect = entries[0]?.contentRect
            if (rect) setSize({ width: rect.width, height })
        })
        observer.observe(mapRef.current)
        return () => observer.disconnect()
    }, [height])

    const centerPixel = toWorldPixel(mapCenter.latitude, mapCenter.longitude, zoom)
    const centerTileX = Math.floor(centerPixel.x / TILE_SIZE)
    const centerTileY = Math.floor(centerPixel.y / TILE_SIZE)
    const firstTileX = centerTileX - Math.ceil(size.width / (2 * TILE_SIZE)) - 1
    const lastTileX = centerTileX + Math.ceil(size.width / (2 * TILE_SIZE)) + 1
    const firstTileY = centerTileY - Math.ceil(size.height / (2 * TILE_SIZE)) - 1
    const lastTileY = centerTileY + Math.ceil(size.height / (2 * TILE_SIZE)) + 1
    const scale = 2 ** zoom
    const tiles = []

    for (let tileY = firstTileY; tileY <= lastTileY; tileY++) {
        if (tileY < 0 || tileY >= scale) continue
        for (let tileX = firstTileX; tileX <= lastTileX; tileX++) {
            const wrappedX = ((tileX % scale) + scale) % scale
            tiles.push({
                key: `${zoom}-${tileX}-${tileY}`,
                src: `https://${['a', 'b', 'c'][Math.abs(tileX + tileY) % 3]}.tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`,
                left: tileX * TILE_SIZE - centerPixel.x + size.width / 2,
                top: tileY * TILE_SIZE - centerPixel.y + size.height / 2
            })
        }
    }

    const updateCenterFromDrag = event => {
        if (!dragRef.current) return
        const deltaX = event.clientX - dragRef.current.clientX
        const deltaY = event.clientY - dragRef.current.clientY
        if (Math.abs(deltaX) + Math.abs(deltaY) > 4) dragRef.current.moved = true
        const startPixel = toWorldPixel(dragRef.current.center.latitude, dragRef.current.center.longitude, zoom)
        setMapCenter(fromWorldPixel(startPixel.x - deltaX, startPixel.y - deltaY, zoom))
    }

    const handleMapClick = event => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false
            dragRef.current = null
            return
        }
        if (!onPick) {
            dragRef.current = null
            return
        }
        const rect = mapRef.current.getBoundingClientRect()
        const clicked = fromWorldPixel(
            centerPixel.x + event.clientX - rect.left - size.width / 2,
            centerPixel.y + event.clientY - rect.top - size.height / 2,
            zoom
        )
        setMapCenter(clicked)
        onPick(clicked)
        dragRef.current = null
    }

    return (
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-sky-100">
            <div
                ref={mapRef}
                className={`relative w-full select-none overflow-hidden ${onPick ? 'cursor-crosshair' : 'cursor-grab'}`}
                style={{ height, touchAction: 'none' }}
                onPointerDown={event => {
                    if (event.button !== 0) return
                    event.currentTarget.setPointerCapture(event.pointerId)
                    dragRef.current = {
                        clientX: event.clientX,
                        clientY: event.clientY,
                        center: mapCenter,
                        moved: false
                    }
                }}
                onPointerMove={updateCenterFromDrag}
                onPointerUp={() => {
                    suppressClickRef.current = Boolean(dragRef.current?.moved)
                    dragRef.current = null
                }}
                onClick={handleMapClick}
                onWheel={event => {
                    event.preventDefault()
                    setZoom(value => Math.max(4, Math.min(18, value + (event.deltaY < 0 ? 1 : -1))))
                }}
            >
                {tiles.map(tile => (
                    <img
                        key={tile.key}
                        src={tile.src}
                        alt=""
                        draggable="false"
                        className="pointer-events-none absolute h-64 w-64"
                        style={{ left: tile.left, top: tile.top }}
                    />
                ))}
                {onPick && (
                    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full text-3xl text-blue-700 drop-shadow">
                        📍
                    </div>
                )}
                {markers.map(marker => {
                    const point = toWorldPixel(Number(marker.latitude), Number(marker.longitude), zoom)
                    const left = point.x - centerPixel.x + size.width / 2
                    const top = point.y - centerPixel.y + size.height / 2
                    if (left < -50 || left > size.width + 50 || top < -60 || top > size.height + 30) return null
                    return (
                        <button
                            key={marker.id}
                            type="button"
                            title={marker.title}
                            className="absolute z-20 -translate-x-1/2 -translate-y-full text-2xl drop-shadow"
                            style={{ left, top }}
                            onPointerDown={event => event.stopPropagation()}
                            onClick={event => {
                                event.stopPropagation()
                                setSelectedMarker(marker)
                                onMarkerClick?.(marker)
                            }}
                        >📍</button>
                    )
                })}
                <div className="absolute right-2 top-2 z-30 flex flex-col overflow-hidden rounded border bg-white shadow">
                    <button className="px-3 py-1 text-xl" onPointerDown={event => event.stopPropagation()} onClick={() => setZoom(value => Math.min(18, value + 1))} aria-label="Phóng to">+</button>
                    <button className="border-t px-3 py-1 text-xl" onPointerDown={event => event.stopPropagation()} onClick={() => setZoom(value => Math.max(4, value - 1))} aria-label="Thu nhỏ">−</button>
                </div>
                {selectedMarker && (
                    <div className="absolute bottom-8 left-2 z-30 max-w-[85%] rounded bg-white p-2 text-sm shadow">
                        <button className="float-right ml-3" onClick={() => setSelectedMarker(null)} aria-label="Đóng">×</button>
                        <strong>{selectedMarker.title}</strong>
                        <div>{selectedMarker.address}</div>
                    </div>
                )}
                <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-0 right-0 z-30 bg-white/90 px-1 text-xs text-blue-700"
                    onPointerDown={event => event.stopPropagation()}
                >© OpenStreetMap contributors</a>
            </div>
        </div>
    )
}

export default MapView
