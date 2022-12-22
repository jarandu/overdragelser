<script>

import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher()

function setConfig() {

    let salesConfig = {
        price: {
			filter: false,
			min: 0,
			max: 0
		},
		type: {
			filter: false,
			type: [ "Fritt salg" ]
		},
		prop: {
			filter: false,
			type: []
		}
    }

    //filter price
    let min = document.querySelector('#price-min')
    let max = document.querySelector('#price-max')

    if((min.value != "") || (max.value != "") ) {
    
    salesConfig.price.filter = true;
    if(min.value === '') {salesConfig.price.min = 0} else {salesConfig.price.min = parseInt(min.value)}
    if(max.value === '') {salesConfig.price.max = 1000000000} else {salesConfig.price.max = parseInt(max.value)}      
    
    } else {
    salesConfig.price.filter = false;
    }

    //filter fritt salg
    if(document.querySelector('#fritt-salg').checked == true) {
    salesConfig.type.filter = true;
    } else {
    salesConfig.type.filter = false;
    }

    //filter prop
    if(document.querySelector('#alle').checked === false) {
      salesConfig.prop.filter = true;
      salesConfig.prop.type = [];
      let value;
      let ele = document.getElementsByName('prop-type');
              
      for(let i = 0; i < ele.length; i++) {
          if(ele[i].checked){
            value = ele[i].value;
          }                
      }

      switch(value){
      case "Bolig":
        salesConfig.prop.type = ['Frittliggende bolig', 'Rekkehus/kjede', 'Tomannsbolig' ];
        break;
      case "Annen":
        salesConfig.prop.type = ['Annen bygning.'];
        break;
      case "Ubebygget":
        salesConfig.prop.type = ['Ubebygget'];
        break;
      } 

    } else {
      salesConfig.prop.filter = false;
    }  

    dispatch( 'setFilters', { config: salesConfig } )
    hidden = true
}

function reset() {
    document.querySelector('#price-min').value = '';
    document.querySelector('#price-max').value = '';
    document.querySelector('#alle-salg').checked = true;
    document.querySelector('#alle').checked = true;

    setConfig()
}

let hidden = true

</script>

<button class="filter-button" class:hidden={!hidden} on:click={() => { hidden = false }} on:keypress={() => { hidden = false }}>
    Filtrer salgene
</button>

<div class="filter-modal" class:hidden={hidden}>
    <div class="modal-nav">
        <svg on:click={() => { hidden = true }} on:keypress={(event) => { hidden = true }} viewBox="0 0 10 10"><polyline points="1,9 9,1 5,5 1,1 9,9"></polyline></svg>
    </div>
    <form>
        <div class="input-group">
            <div class="group-heading">Salgspris</div>
            <label for="price-min"><span class="fromto">Fra</span><input type="number" id="price-min" name="price-min" min="0" max="10000000" steps="100000"> kr</label>
            <label for="price-max"><span class="fromto">Til</span><input type="number" id="price-max" name="price-max" min="0" max="100000000" steps="100000"> kr</label>
        </div>
        <div class="input-group">
            <div class="group-heading">Omsetningstype</div>
            <label for="alle-salg"><input type="radio" id="alle-salg" name="sales-type" value="Alle" checked> Alle</label>   
            <label for="fritt-salg"><input type="radio" id="fritt-salg" name="sales-type" value="Fritt salg"> Fritt salg</label>   
        </div>
        <div class="input-group">
            <div class="group-heading">Bebyggelse</div>
            <label for="alle"><input type="radio" id="alle" name="prop-type" value="Alle" checked> Alle</label>
            <label for="bolig"><input type="radio" id="bolig" name="prop-type" value="Bolig"> Bolig</label>
            <label for="annen"><input type="radio" id="annen" name="prop-type" value="Annen"> Annen bebyggelse</label>
            <label for="ubebygd"><input type="radio" id="ubebygd" name="prop-type" value="Ubebygget"> Ubebygd</label>
        </div>
        <div class="submit">
            <button type="submit" on:click={(event) => {event.preventDefault(); setConfig()}} on:keypress={(event) => {event.preventDefault(); setConfig()}}>Filtrer</button>
            <div class="reset" on:click={reset} on:keypress={reset}>Nullstill</div>
        </div>
    </form>
</div>

<style>
.filter-button {
    position: absolute;
    left: 10px;
    bottom: 10px;
    background: white;
    z-index: 9999;
    border-radius: 4px;
    border: 2px solid rgba(0,0,0,0.35);
    cursor: pointer;
    font-family: adelle_sansbold, "Adelle Sans";
    font-size: 15px;
    padding: 5px 8px;
}
.filter-button:hover {
    background: #f4f4f4;
}
.filter-modal {
    font-size: 16px;
    font-family: adelle_sansregular, "Adelle Sans";
    position: absolute;
    width: 250px;
    max-width: 33%;
    max-height: 500px;
    bottom: 30px;
    left: 30px;
    padding: 25px 30px;
    z-index: 10000;
    background: white;
    color: black;
    border-radius: 5px;
    box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.35);
    transition: .4s ease-in;
    line-height: 1.3;
    accent-color: #4d6711;
    --vertical: 15px;
}
form {
    display: flex;
    flex-direction: column;
    gap: var(--vertical);
}
.hidden {
    display: none;
}
.modal-nav {
    position: absolute;
    cursor: pointer;
    padding: 10px;
    right: 20px;
    top: 15px;
    z-index: 10002;
}
svg {
    width: 20px;
}
polyline {
    stroke: #666;
    stroke-width: 1.25px;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
}
.group-heading {
    margin-bottom: 3px;
    font-size: 15px;
    font-family: adelle_sansbold, "Adelle Sans";
    font-weight: bold;
}
.fromto {
    width: 30px;
    display: inline-block;
}
label {
    display: block;
    cursor: pointer;
    font-weight: normal;
    margin: 0;
}
input[type=number] {
    margin-block: 2px;
    border: none;
    border-bottom: 1px solid black;
    padding: 2px;
    width: 120px;
    text-align: right;
    outline: none;
    font-size: 15px;
    -moz-appearance: textfield;
    font-family: adelle_sansregular, "Adelle Sans";
}
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
input[type=radio] {
    margin-right: 3px;
}
.submit {
    display: flex;
    gap: 10px;
    align-items: center;
}
.submit button {
    background: #4d6711;
    color: white;
    border: none;
    border-radius: 3px;
    padding: 0.5rem;
    display: block;
    cursor: pointer;
    flex: 1;
}
button:hover {
    background-color: #64821c;
}
.reset {
    text-decoration: underline;
    font-size: 13px;
    cursor: pointer;
}
.reset:hover {
    color: darkgrey;
}
@media (max-width: 680px) {
        .filter-modal {
            left: 10px;
            bottom: 10px;
            right:10px;
            max-width: unset;
            width: unset;
            --vertical: 10px;
        }
    }
</style>