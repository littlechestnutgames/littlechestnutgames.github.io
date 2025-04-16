window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    const collapse = window.scrollY >= 20;
    header.classList.toggle("collapse", collapse);
});

function makeEgg(eggData, eggType) {
    let egg = document.createElement("div");
    egg.classList.add("egg");
    if (eggType) {
        egg.classList.add(eggType);
    }
    
    let eggDate = document.createElement("span");
    eggDate.classList.add("egg-date");

    let date = new Date()
    date.setTime(eggData.datetime);
    eggDate.textContent = date.toLocaleDateString('en-US');

    let eggPrice = document.createElement("span");
    eggPrice.classList.add("egg-price");
    eggPrice.textContent = `$${eggData.price}`;

    egg.appendChild(eggDate);
    egg.appendChild(document.createElement("br"));
    egg.appendChild(eggPrice);

    let eggContainer = document.querySelector("#egg-container");
    if (eggContainer != null) {
        eggContainer.appendChild(egg);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetch("https://api.hubapi.com/cms/v3/hubdb/tables/pricing_history/rows?portalId=242465929&limit=13&sort=-datetime")
        .then(response => response.json())
        .then(data => {
            let dataset = data.results;
            dataset = dataset.sort((a, b) => a.values.datetime - b.values.datetime);
            let lastEgg = null;
            while(dataset.length > 12) {
                lastEgg = dataset.shift().values;
            }

            for (let result of dataset) {
                let egg = result.values;
                let eggColor = null;
                if (lastEgg != null && lastEgg.price != egg.price) {
                    eggColor = lastEgg.price > egg.price ? "good-egg" : "bad-egg";
                }
                makeEgg(egg, eggColor);
                lastEgg = egg;
            }
        });
});

