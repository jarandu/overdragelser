import App from './App.svelte'

const urlParams = new URLSearchParams(window.location.search)
let targetElement = document.querySelector('#Eiendomsoverdragelser')
let initialSale = targetElement.dataset.sale || urlParams.get('id') || null

const app = new App({
	target: targetElement,
	props: {
		initialSale: initialSale
	}
})

export default app