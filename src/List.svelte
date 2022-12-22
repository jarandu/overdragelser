<script>

import { createEventDispatcher } from 'svelte'
import Pagination from "./Pagination.svelte"

export let rows

let sorted = 1

$:  sortedRows = [...rows]
$:	activeListItems = []

function sortBy(i) {
    if (i == sorted) sortedRows = sortedRows.reverse()
    else if (i == 3) sortedRows = [...rows].sort((a, b) => b[i] - a[i])
    else if (i == 1) sortedRows = [...rows]
    sorted = i
}
const dispatch = createEventDispatcher()
function rowClick (id) { dispatch( 'rowClick', {
		id: id
    })
}
function getLocalDateFormat(date) {
	let d = new Date(date)
	return d.toLocaleDateString()
}

</script>

<div class=list-heading>Følgende salg er synlige i kartet. &darr; Trykk på et salg for å se mer. Du kan også sortere listen på dato/pris.</div>
<div class=list-container>
	<div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div on:click={() => { sortBy(1) }} style="cursor: pointer;">Dato</div>
		<div>Kommune</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div on:click={() => { sortBy(3) }} style="cursor: pointer;">Salgssum</div>
	</div>
	{#each activeListItems as sale}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
	<div on:click={rowClick(sale[0])}>
		<div>{getLocalDateFormat(sale[1])}</div>
		<div>{sale[2]}</div>
		<div>{@html sale[3] == 0 ? "<em>" + sale[5] + " (0 kr)</em>" : sale[3].toLocaleString() + " kr"}</div>
	</div>
	{/each}
	<Pagination rows={sortedRows} perPage={15} bind:trimmedRows={activeListItems} />
</div>

<style>
.list-heading {
	margin-top: 15px;
	font-size: 0.9em;
}
.list-container { 
	margin-top: 10px;
    color: black;
}
.list-container > div {
	padding-block: 1px;
	display: grid;
	grid-template-columns: 2fr 3fr 2fr;
	cursor: pointer;
}
.list-container > div:not(:first-child):hover {
	background: #eee;
}
.list-container > div:first-child {
	font-weight: bold;
	cursor: initial;
}
.list-container > div:nth-child(even) {
	background: #f5f5f5;
}
.list-container > div > div:nth-child(3) {
	text-align: right;
}
em {
    font-family: adelle_sansthin;
}
</style>