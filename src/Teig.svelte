<script>
    export function getTeig() {
        fetch("https://ws.geonorge.no/eiendom/v1/geokoding?matrikkelnummer=3418-50%2F38&omrade=true&utkoordsys=4258")
		.then(response => response.json())
		.then(data => {
			return data
        })
    }
</script>