<script>

import { createEventDispatcher } from 'svelte'

const dispatch = createEventDispatcher()
const updateFilters = () => { dispatch('filters', {
    filters: 'Hello!'
}) }


</script>
<div>
    <input placeholder="Minimum salgssum" on:change={updateFilters} >
    <label for="freeSale">Kun frie salg</label><input type="checkbox" name="freeSale">
</div>
<style>
    div {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
    }
</style>