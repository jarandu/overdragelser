<script>
let expand = false
</script>

<div class=help class:open="{expand}">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <h4 on:click={() => { expand = !expand }}>
        <svg viewBox="0 0 15 8" height=8 width=15><polyline points="1,1 8,7 14,1" /></svg> Hvordan bruker jeg kartet?
    </h4>
    <div>
        <p>Klikk på kartmarkørene for å forstørre området, eller få mer infomasjon om det enkelte salget. Huk av for "fritt salg" i hjørnet av kartet for å vise eiendommene som er solgt til markedspris.</p>
    </div>
</div>

<style>
    .help {
        margin: 10px 0 15px;
    }
    svg {
        transition: .2s ease-in;
        stroke-width: 1.5px;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
        stroke: black;
        margin: 0 5px 1px 0;
    }
    .help > div {
        display: none;
    }
    .help.open > div {
        display: block;
    }
    .help.open svg {
        transform: scale(-1);
    }
    h4 {
        font-family: adelle_sansregular, "Adelle Sans";   
        cursor: pointer;
        margin-bottom: 10px;
        margin-top: 0 !important;
    }
    p {
        margin-block: 10px !important;
        line-height: 1.35;
    }
</style>