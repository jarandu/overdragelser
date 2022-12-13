<script>

import { onMount } from "svelte"
import { each } from "svelte/internal"
import * as L from "leaflet"
import { MarkerClusterGroup } from 'leaflet.markercluster';
import * as turf from "@turf/turf"
import Modal from "./Modal.svelte"
import Locate from "./Locate.svelte"
import List from "./List.svelte"

export let initialSale

let map,
	sales = [], // Data array with sales objects
	salesList = [],
	salesInView = [],
	activeSalePolygons = L.featureGroup(),
	freeSaleMarkers = L.featureGroup(),
	otherSaleMarkers = L.featureGroup(),
	salesMarkerGroup = new MarkerClusterGroup({ showCoverageOnHover: false, zoomToBoundsOnClick: true }),
	filterFree = false,
	showModal = false,
	saleIcon = L.divIcon({ className: 'map-marker', html: '<svg><use xlink:href="#saleIcon"></svg>' }),
	saleIconFree = L.divIcon({ className: 'map-marker free-sale', html: '<svg><use xlink:href="#saleIcon"></svg>' })
$:	activeSale = {}

function getSalesInView() {
	salesInView = []
	let b = map.getBounds()
	salesList.forEach(s => {
    	if (b.contains([ s[4][0], s[4][1] ])) 
			if (filterFree && s[5] == "Fritt salg") salesInView.push(s)
			else if (!filterFree) salesInView.push(s)
	})
}
function update() {
	getSalesInView()
	/* 	let center = map.getCenter()
	let zoom = map.getZoom()
	console.log("Fløy til " + center.lat.toPrecision(5) + ", " + center.lng.toPrecision(5) + " / " + zoom) */
}
function filterSalesToggle() {
	if (filterFree) salesMarkerGroup.removeLayer(otherSaleMarkers)
	else salesMarkerGroup.addLayer(otherSaleMarkers)
	getSalesInView()
}

// Map setup
function createMap(container) {
    map = L.map(container).setView([61, 9], 7).on('moveend', update)
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map)
}
function populateMap() {
	if (salesMarkerGroup.getLayers() != null) salesMarkerGroup.clearLayers().remove()
	// Create sale markers and list
	for (let sale of sales) {
		if(sale.prop[0].coord != null) { // TODO!!
			let layer = L.marker(sale.prop[0].coord, {
					icon: saleIcon
				})
				.on('click', () => {
					markerClick(sale.saleId)
					console.log("Klikket på " + sale.saleId)
				})
			// Differentiate between free sales and all others
			sale.type == "Fritt salg" ? layer.addTo(freeSaleMarkers) : layer.addTo(otherSaleMarkers)
			salesList.push([
				sale.saleId,
				sale.date.substring(0,10),
				sale.prop[0].municipality,
				sale.price,
				sale.prop[0].coord,
				sale.type
			])
		}
	}
	// Add groups to map
	salesMarkerGroup.addLayer(freeSaleMarkers).addLayer(otherSaleMarkers)
	salesMarkerGroup.addTo(map)
	salesList = salesList
	if (initialSale != null) {
		markerClick(initialSale)
	}
}

// Actions
function markerClick(saleId, fromList = false) {
	// If from list and on mobile, jump
	if (window.innerWidth < 680 && fromList) {
		window.scrollBy({ top: document.querySelector('#Eiendomsoverdragelser').getBoundingClientRect().top - 50 })
	}
	// Reset
	if (activeSalePolygons.getLayers() != null) activeSalePolygons.clearLayers().remove()
	activeSale.area = 0
	// Find array index from SaleId
	let i = sales.findIndex(x => x.saleId == saleId)
	// Register properties which share area/teig to prevent area duplicates
	let matNumbTexts = []
	// Make layer group and add to map
	activeSalePolygons.addTo(map).on('layeradd', () => {
		map.flyToBounds(activeSalePolygons.getBounds(), {
			duration: 1
		})
	})
	// Add markers to group
	sales[i].prop.forEach(p => {
		fetch("https://ws.geonorge.no/eiendom/v1/geokoding?matrikkelnummer=" + p.matNumb + "&omrade=true&utkoordsys=4326")
			.then(r => r.json())
			.then(data => {
				// Create marker if has geo and is not duplicate
				if(data.features.length > 0 && !matNumbTexts.includes(data.features[0].properties.matrikkelnummertekst)) {
					L.geoJSON(data, { style: { color: "red", fillOpacity: 0.4, weight: 0, } })
						.bindPopup(() => {
							let txt = p.matNumb + "<br>" + Math.round(turf.area(data) / 1000) + " dekar"
							if (p.address) txt = p.address + "<br>" + txt
							return txt
						})
						.addTo(activeSalePolygons)
					activeSale.area += turf.area(data)
					matNumbTexts.push(data.features[0].properties.matrikkelnummertekst)
				}
			})
	})
	activeSale.sale = sales[i]
	showModal = true
}

// Get data
onMount(async () => {
	fetch("https://api.nationen.no/kart/sales.json")
		.then(response => response.json())
		.then(data => {
			sales = data
			populateMap()
			getSalesInView()
		})
		.catch(error => { console.log(error) })
})

function resizeMap() { if (map) { map.invalidateSize() } }
function closeModal() { 
	showModal = !showModal
	let center = map.getCenter()
	activeSalePolygons.clearLayers().remove()
	if (map.getZoom() > 10) map.flyTo(center, 10, { duration: 0.5 })
}
function locateUser() {
	showModal = false
	activeSale = {}
	function success(position) { map.flyTo([position.coords.latitude, position.coords.longitude], 9, { duration: 0.5 }) }
	function error() { console.log = 'Kunne ikke hente plassering.' }
	if (!navigator.geolocation) { console.log = 'Geolokalisering funker ikke i nettleseren din.' }
	else { navigator.geolocation.getCurrentPosition(success, error)	}
}
function handleRowClick(event) {
	markerClick(event.detail.id, true)
}

</script>
<svelte:window on:resize={resizeMap} />

<main>
<div class="map-container">
	<div class="map" use:createMap>
		{#if showModal}<Modal {activeSale} on:close={closeModal} />{/if}
		<label>Vis kun fritt salg <input type=checkbox bind:checked={filterFree} on:change={filterSalesToggle} ></label>
		<Locate on:locate={locateUser} />
	</div>
</div>
<List rows={salesInView} on:rowClick={handleRowClick} />
<div class="description">
	Vi tar forbehold om at beregnet eiendomsareal kan avvike noe fra faktisk areal. Informasjon/kartdata om eiendommene leveres av Kartverket.
</div>

</main>

<svg xmlns="http://www.w3.org/2000/svg">
	<symbol id="saleIcon" viewBox="0 0 23 33.6">
		<path d="M11.5,0c6.3-.1,12,6.1,11.5,12.5-.1,3.2-2,5.8-3.5,8.5-2.1,3.7-6.7,11.8-7,12.1-.5,.8-1.7,.7-2.1,0-.5-.9-5.8-10-7.9-13.7C1.3,17.3,.1,15,0,12.6-.5,6.2,5.1,0,11.5,0c0,0,0,0,0,0ZM6.4,12c0,2.9,2.3,5,4.8,5.1,7.2,0,7.2-10.2,.2-10.3-2.6,0-5,2.3-5,5.1Z"/>
	</symbol>
</svg>

<style>
main {
	font-family: adelle_sansregular, "Adelle Sans";
	font-size: 16px;
	clear: both;
}
.map-container {
	position: relative;
}
.map {
	height: 560px;
	max-height: 70vh;
}
label {
	position: absolute;
	right: 10px;
	top: 10px;
	font-size: 14px;
    display: flex;
    width: fit-content;
		border: 2px solid rgba(0,0,0,0.35);
		border-radius: 4px;
		padding: 4px 8px;
		background: white;
    align-items: center;
    justify-content: flex-end;
	z-index: 1000;
	cursor: pointer;
	color: black;
    font-family: 'adelle_sansregular';
    font-weight: normal;
}
input[type=checkbox] {
	margin-left: 5px;
	margin-top: 1px;
	cursor: pointer;
}
.description {
	margin: 10px auto;
	font-size: 0.8em;
	color: #666;
	line-height: 1.25;
}
@media (max-width:680px) {
	.map {
		margin: 0 -30px;
	}
}
@media (min-width: 992px) {
	.map {
		margin: 0 -150px;
	}
}
</style>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
   integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
   crossorigin=""/>