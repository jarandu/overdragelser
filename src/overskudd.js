// Projection concersion
import proj4 from "proj4"
proj4.defs("EPSG:25833","+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs")
let b = map.getBounds()
console.log(proj4('EPSG:4326',"EPSG:25833",[b._northEast.lat,b._northEast.lng]))
console.log(proj4('EPSG:4326',"EPSG:25833",[b._southWest.lat,b._southWest.lng]))


// Tile layers
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,
    &copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`,
    subdomains: 'abcd',
    maxZoom: 15,
}).addTo(map)
L.tileLayer.wms('https://openwms.statkart.no/skwms1/wms.matrikkel?service=wms&', {
    layers: 'eiendomsgrense',
    format: 'image/png',
    transparent: true
}).addTo(map)

/* List sales
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div>
	{#each sales as s}
	<div class="row" on:click={map.flyTo(s.Marker.getLatLng(), 15, { duration: 1 })}>
		<div>
			{#each s.Properties as p}
			{p.Text.Text}<br />
			{/each}
		</div>
	</div>
	{/each}
</div>
<style>
.row {
	display: flex;
	justify-content: space-between;
	margin-top: 5px;
}
.row:nth-child(even) {
	background-color: aliceblue;
}
.row > div {
	font-size: 12px;
	cursor: pointer;
}
</style> */


/* Sales in View
$:	salesInView = []
function getFeaturesInView() {
	salesInView = []
	sales.forEach(sale => {
		if (sale.Marker instanceof L.Marker) {
			if (map.getBounds().contains(layer.getLatLng())) {
				features.push(layer)
			}
		}
	})
	return features
} */

/*
function getFromTo(string) {
    let fromTo = string.substring((string.indexOf(" fra ") + 5)).split(" til ")
    return { from: fromTo[0], to:  fromTo[1].substring(0, (fromTo[1].indexOf("(") - 1)) }
}
*/