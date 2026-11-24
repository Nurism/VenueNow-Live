# VenueNow Live

[Öppna VenueNow med inloggning](https://venuenow-live-nur.retrokiwi18.chatgpt.site) · [GitHub Pages](https://nurism.github.io/VenueNow-Live/)

Stockholmskonserter med länkar till arrangörerna och en separat demobutik. Konsertbildernas källor visas på respektive kort.

Den hostade appen använder ChatGPT-inloggning. Ägaren får administratörsbehörighet via miljövariabeln `ADMIN_EMAIL`. Ändringar i katalogen sparas på servern i R2-bindningen `BUCKET`. Filen `artists.json` innehåller startkatalogen.

Bygg serverversionen med `python3 server/build.py`. GitHub Pages kan visa rotmappen statiskt och läser katalogen från webbappen. Inloggning och artistredigering öppnas på webbappens adress.
