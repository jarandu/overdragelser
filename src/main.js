import App from './App.svelte'

const urlParams = new URLSearchParams(window.location.search)
let targetElement = document.querySelector('#Eiendomsoverdragelser')
let initialSale = targetElement.dataset.sale || urlParams.get('id') || null
let showList = targetElement.dataset.list || "show"

const app = new App({
	target: targetElement,
	props: {
		initialSale: initialSale,
		showList: showList
	}
})

export default app