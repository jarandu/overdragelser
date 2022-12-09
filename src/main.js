import App from './App.svelte'

let targetElement = document.querySelector('#Eiendomsoverdragelser')
let initialSale = targetElement.dataset.sale || null

const app = new App({
	target: targetElement,
	props: {
		initialSale: initialSale
	}
})

export default app