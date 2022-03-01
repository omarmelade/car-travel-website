const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });
  
app.use(express.static('public'));

const port = process.env.PORT || 3000;

/// ---------  SOAP api request 
const soap = require('soap');
const url = 'https://soap-py-db.herokuapp.com/?wsdl';

function getList() {
    var args = {}

    const promise = new Promise((resolve, reject) => {
        soap.createClient(url, function (err, client) {
            client.list_cars(args, function (err, result) {
                resolve(result);
            });
        });
    });

    return promise
}


const fetchTravelTime = async (cap, cons, nbkm, v) => {
    try {
        return await axios.get('https://autonomous-api.herokuapp.com/' + '/calc/' + cap + '/cons/' + cons + '/nbkm/' + nbkm + '/v/' + v);
    } catch (error) {
        console.error(error)
    }
}

const resolvePromise = async (p) => {

    const dataPromise = p.then(response => {
        return response.data;
    })
        .catch(error => {
            console.log(error)
        })
    return dataPromise;
}



app.get('/', (req, res) => {

    res.sendFile(__dirname + '/index.html');
});


io.on('connection', (socket) => {
    io.emit('hello', "world");


    // Travel time data
    socket.on("fetchTravelTime", (args) => {
        
        let p = fetchTravelTime(args['cap'], args['cons'], args['nbkm'], args['v'])
        resolvePromise(p).then((val) => {
            console.log("hello");
            io.emit("getTravelTime", val);
        })
    })

    // Cars Data
    getList()
        .then(value => {
            value = JSON.parse(value['list_carsResult']);
            io.emit('getCarsData', value);
        })

    socket.on("fetchCarData", (args) => {
        let listcars = getList();
        const id = args;

        listcars.then(value => {
            value = JSON.parse(value['list_carsResult']);
            io.emit("getCarData", value[id]);
        })
    })
    
    // Borns
    socket.on("fetchBorns", (args) => {
        let p = axios.get("https://opendata.reseaux-energies.fr/api/records/1.0/search/?dataset=bornes-irve&q=&sort=-dist&facet=region&rows=500" + args["geofilter"]);
        resolvePromise(p).then((val) => {
            io.emit("getBorns", val)
        })
    })

    socket.on("fetchAdresses", (args) => {
        let query = args['value'].replaceAll(' ', '+');
        let p = axios.get("https://api-adresse.data.gouv.fr/search/?q=" + query +"&limit=5");
        let id = args['id'];
        resolvePromise(p).then((val) => {
            io.emit("getAdresses", {val, id})
        })
    })
    
    socket.on("fetchLatLon", (args) => {
        let p = axios.get("https://api-adresse.data.gouv.fr/reverse/?lon="+args['lon']+"&lat="+args['lat']+"&type=street");
        resolvePromise(p).then((val) => {
            let isStart = args['isStart'];
            io.emit("getLatLon", {val, isStart:isStart})
        })
    })

});


server.listen(port, () => {
    console.log('listening on *:3000');
});