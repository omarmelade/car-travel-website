// -------------------------------------- Adresses suggestion

// fill the adress dropdown
function fillDropDown(obj, dropdown, id) {
    let isStart = id == 'sugg-addrS' ? true : false;
    let inputT = isStart ? 'travelS' : 'travelE';
    let dropdownID = isStart ? 'dropdownStartTrav' : 'dropdownEndTrav';

    for (const o of obj.features) {
        console.log(o);
        const a = document.createElement('a');
        a.className = 'dropdown-item';
        a.innerText = o.properties.label;
        a.onclick = function () { document.querySelector("#" + inputT).value = o.properties.label; disableDrpDown(dropdownID); setPoint(isStart, o.geometry.coordinates) };
        dropdown.appendChild(a);
    }
}

// fetch all possible adresses 
function adressDCall(value, id) {
    if (value == "") {
        return;
    }
    let d = document.querySelector("#" + id);
    removeAllChildNodes(d);
    socket.emit("fetchAdresses", { value, id });
}


// ------------------------------------------ socket 

// get all possible adresses 
socket.on("getAdresses", (args) => {
    let d = document.querySelector("#" + args['id']);
    fillDropDown(args['val'], d, args['id']);
})

// ------------------------------------------ events 

document.addEventListener('click', function (event) {
    let d = document.querySelector("#dropdownStartTrav");
    let d2 = document.querySelector("#dropdownEndTrav");

    event.preventDefault();
    if (d.contains(event.target) == false) {
        disableDrpDown("dropdownStartTrav")
    }

    event.preventDefault();
    if (d2.contains(event.target) == false) {
        disableDrpDown("dropdownEndTrav")
    }
});


function activateDrpDown(id) {
    let drpdwn = document.querySelector("#" + id);
    drpdwn.className = "dropdown is-active";
}

function disableDrpDown(id) {
    let drpdwn = document.querySelector("#" + id);
    drpdwn.className = "dropdown"
}


/// -------- UTILS

function isEmptyOrSpaces(str) {
    return str === null || str.match(/^ *$/) !== null;
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
