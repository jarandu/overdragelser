<script>

export let rows
export let perPage
export let trimmedRows

$: totalRows = rows.length 
$: currentPage = 0
$: totalPages = Math.ceil(totalRows / perPage)
$: start =  currentPage * perPage
$: end = currentPage === totalPages - 1 ? totalRows - 1 : start + perPage - 1
$: trimmedRows = rows.slice(start, end + 1)

</script>

{#if totalRows && totalRows > perPage}
<div class=pagination>
    <div>
        {#if currentPage != 0}
        <div on:click={() => currentPage -= 1} on:keypress={() => currentPage -= 1}>Forrige</div>
        {/if}
    </div>
    <div>{start + 1} - {end + 1} av {totalRows}</div>
    <div>
        {#if currentPage != totalPages - 1}
        <div on:click={() => currentPage += 1} on:keypress={() => currentPage += 1} style="text-align:right;">Neste</div>
        {/if}
    </div>
</div>
{/if}

<style>
.pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: all;
    margin-top: 5px;
}
.pagination > div {
    min-width: 75px;
}
.pagination > div > div {
    text-decoration: underline;
    cursor: pointer;
}
</style>