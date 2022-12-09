<script>

import { onMount } from "svelte"
import { each } from "svelte/internal"
import * as L from "leaflet"
import { MarkerClusterGroup } from 'leaflet.markercluster';
import * as turf from "@turf/turf"
import Modal from "./Modal.svelte"
import Locate from "./Locate.svelte"

export let initialSale

let map,
	sales = [],
	activeSaleMarkers = L.featureGroup(),
	salesMarkerGroup = new MarkerClusterGroup({ showCoverageOnHover: false, zoomToBoundsOnClick: true }),
	filter = false

$: 	showModal = false
$:	activeSale = {}

function updateInfo() {
	let center = map.getCenter()
	let zoom = map.getZoom()
	console.log("Fløy til " + center.lat.toPrecision(5) + ", " + center.lng.toPrecision(5) + " / " + zoom)
}

function filterSalesToggle(sales) {
	filter = !filter
	let filteredSales = sales.filter(sale => sale.Type != "Fritt salg")
	filteredSales.forEach(s => {
		if (filter == true) s.Marker.remove()
		else s.Marker.addTo(salesMarkerGroup)
	})
}

// Map setup
function createMap(container) {
    map = L.map(container).setView([61, 9], 7).on('moveend', updateInfo)
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map)
}

function markerClick(xy, saleId) {
	console.log("Klikket på " + saleId)
	// Reset
	if (activeSaleMarkers.getLayers() != null) activeSaleMarkers.clearLayers().remove()
	activeSale.Area = 0
	// Find array index from SaleId
	let i = sales.findIndex(x => x.SaleId == saleId)
	// Make layer group and add to map
	activeSaleMarkers.addTo(map).on('layeradd', () => {
		map.flyToBounds(activeSaleMarkers.getBounds(), {
			duration: 1
		})
	})
	// Add markers to group
	sales[i].Properties.forEach(p => {
		fetch("https://ws.geonorge.no/eiendom/v1/geokoding?matrikkelnummer=" + p.MatrikkelNumber + "&omrade=true&utkoordsys=4258").then(r => r.json()).then(data => {
			L.geoJSON(data, { style: {
				color: "red",
				fillOpacity: 0.4,
				weight: 0,
			} })
			.bindPopup(p.MatrikkelNumber + "<br>" + Math.round(turf.area(data) / 1000) + " dekar")
			.addTo(activeSaleMarkers)
			activeSale.Area += turf.area(data)
		})
	})
	activeSale.Sale = sales[i]
	showModal = true
}
function populateMap() {
	if (salesMarkerGroup.getLayers() != null) salesMarkerGroup.clearLayers().remove()
	// Create sale markers
	for (let sale of sales) {
		if (sale.Coordinates != null) {
			sale.Marker = L.marker(sale.Properties[0].Coordinates, { title: sale.SaleId })
				.addTo(salesMarkerGroup)
				.on('click', () => {
					markerClick(sale.Properties[0].Coordinates, sale.SaleId)
				})
		}
	}
	// Add group to map
	salesMarkerGroup.addTo(map)

	console.log(`La til ${sales.length} markører i kartet`)
}

// Get data
onMount(async () => {
	fetch("https://services.api.no/api/acies/v1/external/1881/property/?querystring=&filters=PropertyType:Landbruk/fiske,PropertySoldDate:2022-11-10--2022-11-23&fields=*&rows=500&sortby=propertysolddate%20DESC,saleId%20ASC")
	/* fetch("200.json") */
		.then(response => response.json())
		.then(data => {
			//  Loop though Hits
			data.Hits.forEach(d => { 
				let id = d.Property.Sale.Id
				let xy = d.Property.StreetAddress.Coordinate ? [d.Property.StreetAddress.Coordinate.Latitude, d.Property.StreetAddress.Coordinate.Longitude] : null
				let address = d.Property.StreetAddress.StreetName ? d.Property.StreetAddress.StreetName + " " + d.Property.StreetAddress.HouseNumber : null
				let mn = d.Property.Sale.NewsletterFormatText.split(";")
				let mnFormat = mn[9] + "-" + mn[10] + "/" + mn[11] + "/" + mn[12] + "/" + mn[13]

				// If sale does not exist, push new sale
				if (!sales.some(d => d.SaleId == id)) {
					sales.push({
						SaleId: id,
						Price: d.Property.Sale.Price,
						Date: d.Property.Sale.SoldDate,
						Type: d.Property.Sale.Type,
						Properties: [{
							Type: d.Property.BuildingType,
							Coordinates: xy,
							Address: address,
							Municipality: d.Property.StreetAddress.Municipality,
							MatrikkelNumber: mnFormat,
							Text: { 
								Line: d.Property.Sale.LineId,
								Text: d.Property.Sale.InfoText
							}
						}]
					})
				}

				// If sale exist, push new property
				else {
					let i = sales.findIndex(x => x.SaleId == id) // Find SaleId array index
					sales[i].Properties.unshift({
						Type: d.Property.BuildingType,
						Coordinates: xy,
						Address: address,
						Municipality: d.Property.StreetAddress.Municipality,
						MatrikkelNumber: mnFormat,
						Text: { 
							Line: d.Property.Sale.LineId,
							Text: d.Property.Sale.InfoText
						}
					})
				}
			})
			// Get centroid or single coordinates AND summarize text
			sales.forEach(sale => {
				// Multiple properties
				if (sale.Properties.length > 1) {
					// Declare multiple
					sale.Multiple = true
					// Make centroid and text
					let xys = []
					let txt = ""
					sale.Properties.forEach(prop => {
						if (prop.Coordinates != null) xys.push(prop.Coordinates)
						txt += (prop.Text.Text)
					})
					sale.Text = txt
					if (xys.length > 1) {
						let latLng = L.latLngBounds(xys).getCenter()
						sale.Coordinates = [latLng.lat, latLng.lng]
					}
					// Fallback if only one property has coordinates
					else sale.Coordinates = xys[0]
				}
				// Single property
				else {
					sale.Multiple = false
					sale.Coordinates = sale.Properties[0].Coordinates
					sale.Text = sale.Properties[0].Text.Text
				}
			})
			console.log(data)
			sales = sales.filter(s => s.Type != "Uskiftebevilling") // sales.filter(s => s.Type == "Fritt salg")
			locateUser()
			populateMap()
		})
		.catch(error => { console.log(error) })
})

function resizeMap() { if (map) { map.invalidateSize() } }
function closeModal() { 
	showModal = !showModal
	let center = map.getCenter()
	activeSaleMarkers.clearLayers().remove()
	map.flyTo(center, 10, { duration: 0.5 })
}
function locateUser() {
	function success(position) { map.flyTo([position.coords.latitude, position.coords.longitude], 9, { duration: 0.5 }) }
	function error() { console.log = 'Kunne ikke hente plassering.' }
	if (!navigator.geolocation) { console.log = 'Geolokalisering funker ikke i nettleseren din.' }
	else { navigator.geolocation.getCurrentPosition(success, error)	}
}

</script>
<svelte:window on:resize={resizeMap} />

<main>
<div class="map-container">
	<div class="map" use:createMap />
	{#if showModal}
	<Modal {activeSale} on:close={closeModal} />
	{/if}
	<Locate on:locate={locateUser} />
	<div class="map-description">
		Kartet inneholder alle typer eiendomsoverdragelser siste 14 dager, men tar ikke med overdragelser til enke/enkemann ved dødsfall av ektefellen (uskiftebevilling). Vi tar forbehold om at beregnet eiendomsareal kan avvike noe fra faktisk areal. Informasjon/kartdata om eiendommene leveres av Kartverket.
	</div>
</div>

</main>

<style>
.map-container {
	width: 100%;
	height: 500px;
	max-height: 70vh;
	max-width: 960px;
	position: relative;
	margin: 30px auto;
}
.map {
	height:100%;
}
.map-description {
	font-family: adelle_sans, "Adelle Sans";
	margin: 10px auto;
	max-width: 960px;
	font-size: 0.9em;
	color: #333;
}
@media (max-width:680px) {
	.map-container {
		margin: 30px -30px;
	}
}
</style>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
   integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
   crossorigin=""/>