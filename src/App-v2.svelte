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
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}{r}.png', {
		maxZoom: 19,
		detectRetina: true,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map)
}

function markerClick(saleId) {
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
			.bindPopup(() => {
				let txt = p.MatrikkelNumber + "<br>" + Math.round(turf.area(data) / 1000) + " dekar"
				if (p.Address) txt = p.Address + "<br>" + txt
				return txt
			})
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
		if(sale.Properties[0].Coordinates != null) {
			sale.Marker = L.marker(sale.Properties[0].Coordinates, { title: sale.SaleId })
				.addTo(salesMarkerGroup)
				.on('click', () => {
					markerClick(sale.SaleId)
					console.log("Klikket på " + sale.SaleId)
				})
		}

	}
	// Add group to map
	salesMarkerGroup.addTo(map)
	if (initialSale != null) {
		markerClick(initialSale)
	}
	console.log(salesMarkerGroup.getLayers().length)
}

// Get data
onMount(async () => {
	fetch("https://services.api.no/api/acies/v1/external/1881/property/?querystring=&filters=PropertyType:Landbruk/fiske,PropertySoldDate:2020-11-10--2022-11-25&fields=*&rows=3000&sortby=propertysolddate%20DESC,saleId%20ASC")
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
						Multiple: false,
						Price: d.Property.Sale.Price,
						Date: d.Property.Sale.SoldDate,
						Type: d.Property.Sale.Type,
						Properties: [{
							Type: d.Property.BuildingType,
							Coordinates: xy,
							Address: address,
							Municipality: d.Property.StreetAddress.Municipality,
							MatrikkelNumber: mnFormat,
							Text: d.Property.Sale.InfoText
						}]
					})
				}

				// If sale exist, push new property
				else {
					let i = sales.findIndex(x => x.SaleId == id) // Find SaleId array index
					sales[i].Multiple = true
					sales[i].Properties.unshift({
						Type: d.Property.BuildingType,
						Coordinates: xy,
						Address: address,
						Municipality: d.Property.StreetAddress.Municipality,
						MatrikkelNumber: mnFormat,
						Text: d.Property.Sale.InfoText
					})
				}
			})
			sales =  sales // sales.filter(s => s.Multiple == true)
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
<h2>Kjøp og salg av landbrukseiendom</h2>
<p>Siste 14 dager</p>
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
main {
	font-family: adelle_sans, "Adelle Sans";
	margin: 30px auto;
	max-width: 960px;
}
.map-container {
	height: 500px;
	max-height: 70vh;
	position: relative;
}
.map {
	height:100%;
}
.map-description {
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