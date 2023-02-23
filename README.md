# JACKPOT
A chrome extension that prevents cryptojacking by monitor cpu usage per chrome tabe opened.
- background script listen for new tab loaded
- compare current url with the blacklisted urls
- show a warning page if the url is in the blacklist
- if user insists to visit the site, continue to monitor CPU usage
- If consistent spikes observed, alert and prompt user to blacklist the site
