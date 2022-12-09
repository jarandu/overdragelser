fetch("https://services.api.no/api/acies/v1/external/1881/property/?querystring=&filters=PropertyType:Landbruk/fiske,PropertySoldDate:2022-10-09--2022-11-08&fields=*&rows=100&sortby=propertysolddate%20DESC,saleId%20ASC")
		.then(response => response.json())
		.then(data => {
			console.log(data)
			
			//  Loop though Hits
			data.Hits.forEach(d => { 
				let id = d.Property.Sale.Id
				// Coordinate function
				let xy = (d.Property.StreetAddress.Coordinate) ? [d.Property.StreetAddress.Coordinate.Latitude, d.Property.StreetAddress.Coordinate.Longitude] : null
				// Get Matrikkelnummer in right format
				let mn = d.Property.Sale.NewsletterFormatText.split(";")
				let mnFormat = mn[9] + "-" + mn[10] + "/" + mn[11] + "/" + mn[12] + "/" + mn[13]

				// If sale does not exist, push new sale
				if (!sales.some(d => d.SaleId == id)) {
					sales.push({
						SaleId: id,
						Price: d.Property.Sale.Price,
						Date: d.Property.Sale.SoldDate,
						Type: d.Property.Sale.Type,
						Properties: [{
							Type: d.Property.BuildingType,
							Coordinates: xy,
							MatrikkelNumber: mnFormat,
							Text: { 
								Line: d.Property.Sale.LineId,
								Text: d.Property.Sale.InfoText
							}
						}]
					})
				}

				// If sale exist, push new property
				else {
					let i = sales.findIndex(x => x.SaleId == id) // Find SaleId array index
					sales[i].Properties.unshift({
						Type: d.Property.BuildingType,
						Coordinates: xy,
						MatrikkelNumber: mnFormat,
						Text: { 
							Line: d.Property.Sale.LineId,
							Text: d.Property.Sale.InfoText
						}
					})
				}
			})

			// Get centroid point or single coordinates AND summarize text
			sales.forEach(sale => {
				// Multiple properties
				if (sale.Properties.length > 1) {
					// Declare multiple
					sale.Multiple = true
					// Make centroid and text
					let xys = []
					let txt = ""
					sale.Properties.forEach(prop => {
						if (prop.Coordinates != null) xys.push(prop.Coordinates)
						txt += (prop.Text.Text)
					})
					sale.Text = txt
					if (xys.length > 1) {
						let latLng = L.latLngBounds(xys).getCenter()
						sale.Coordinates = [latLng.lat, latLng.lng]
					}
					// Fallback if only one property has coordinates
					else sale.Coordinates = xys[0]
				}
				// Single property
				else {
					sale.Multiple = false
					sale.Coordinates = sale.Properties[0].Coordinates
					sale.Text = sale.Properties[0].Text.Text
				}
			})
			console.log(sales)
		})
		.catch(error => { console.log(error) })