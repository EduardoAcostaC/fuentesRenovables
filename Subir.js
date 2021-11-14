////const input = document.querySelector('input'); 
var mapa;
const button = document.getElementById("Enviar");
var url;
let terrenoSolar
///var estatica = document.getElementById("imagen");
//const infoContainer = document.querySelector('.informacion-container');

var myHeaders = new Headers();
myHeaders.append("Content-Type",  "application/json");
myHeaders.append("Prediction-Key", "74fa439a9da44718a6678f8a956964c8");

button.addEventListener('click', (e) => {
  e.preventDefault();    
  let lat = mapa.center.lat();
  let lng = mapa.center.lng();  
  let zoom = mapa.zoom;
  if (zoom < 12){
    return;
  }
  url = "https://maps.googleapis.com/maps/api/staticmap?center=" + lat + "," + lng + "&zoom=" + zoom + "&size=640x400&maptype=satellite&key=AIzaSyBEK09wqDNwHIOwAXs16KoaDnXH040NSIA";
  var archivo = JSON.stringify({ "Url": url});  
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: archivo,
    redirect: 'follow'
  };      
  fetch("https://eastus.api.cognitive.microsoft.com/customvision/v3.0/Prediction/8fccdfa8-5da7-4c4c-9a40-0d470366825c/detect/iterations/DeteccionRegiones/url", requestOptions)
      .then(response => response.json())
      .then(data => mostrarData(data))
      .catch(error => console.log('error', error)); 
  setTimeout(() => fetch('https://api.openweathermap.org/data/2.5/onecall?lat=' + lat + '&lon=' + lng + '&units=metric&appid=e3ddf6e006ae530c33ac3c13e39755a8')
  .then((res => res.json()))
  .then((info) => mostrarDatos(info)), 2000);   
})

/*function mostrar(){
    archivo = document.getElementById("file").files[0];
    var reader = new FileReader();
    if (archivo) {
      reader.readAsDataURL(archivo );
      reader.onloadend = function () {
      ///var img = document.getElementById("img").src = reader.result;
      img.src = reader.result;
      img.align = "center";
      img.sizes="(max-width: 320px) 280px, (max-width: 480px) 440px,800px"
      }         
    }
  }*/

const mostrarData = (data) => {  
  console.log(1)
  let body = ''
  let mapa = ''
  for (let i = 0; i<data.predictions.length; i++){
    body += `<tr><td>${data.predictions[i].tagId}</td><td>${data.predictions[i].tagName}</td><td>${(data.predictions[i].probability*100).toFixed(2)}</td><td>${data.predictions[i].boundingBox.left}</td><td>${data.predictions[i].boundingBox.top}</td><td>${data.predictions[i].boundingBox.width}</td><td>${data.predictions[i].boundingBox.height}</td></tr>`
  }
  mapa += `<map name="mapa">`
  for(let i = 0; i < data.predictions.length; i++){
    mapa += `<area shape="RECT" coords=${data.predictions[i].boundingBox.left * 640},${data.predictions[i].boundingBox.top * 400},${data.predictions[i].boundingBox.width * 640},${data.predictions[i].boundingBox.height * 400}" href="#${i}">`
  }
  terrenoSolar = false
  for(let i = 0; i < data.predictions.length; i++){
    let area = Math.abs((data.predictions[i].boundingBox.width - data.predictions[i].boundingBox.left) * (data.predictions[i].boundingBox.height - data.predictions[i].boundingBox.top))    
    if (data.predictions[i].probability >= 0.6 && area >= 0.3 && (data.predictions[i].tagName == "Llanura" || data.predictions[i].tagName == "Meseta")){
      terrenoSolar = true
      break
    }
  }  
  mapa += `</map>`
  mapa += `<img src = "${url}" usemap="#mapa">`
  document.getElementById('data').innerHTML = body
  document.getElementById('Marcadores').innerHTML = mapa
}

const mostrarDatos = (data) => {
  console.log(2)
  let protemp = 0
  let proHorasSol = 0  
  let proViento = 0
  let proNubes = 0
  let body = ''  
  for (let i = 0; i <= 7; i++){
    let temperatura = data.daily[i].temp.max
    let sunset = new Date(data.daily[i].sunset * 1000)
    let sunrise = new Date(data.daily[i].sunrise * 1000)
    let viento = data.daily[i].wind_speed
    let nube = data.daily[i].clouds    
    proHorasSol += sunset.getUTCHours() - sunrise.getUTCHours()
    protemp += temperatura
    proViento += viento
    proNubes += nube
  }
  proHorasSol /= 8
  protemp /= 8
  proViento /= 8
  proNubes /= 8  
  let recomendables = ""
  if (proHorasSol >= 5 && proNubes <= 80 && terrenoSolar == true){
    recomendables += "Te recomiendo celdas solares\n"
  }
  if (proViento >= 3 && proViento < 25 && protemp >= 25 && protemp <= 30){
    recomendables += "Te recomiendo central eolica"
  }
  body += `<tr><td>${protemp.toFixed(2) + "°C"}</td><td>${proHorasSol}</td><td>${proViento.toFixed(2) + "m/s"}</td><td>${proNubes.toFixed(2) + "%"}</td><td>${recomendables}</td></tr>`
  document.getElementById('datos').innerHTML = body
}

function initMap() {
  let lati = 19.42847;
  let lon = -99.12766;
  ////project(new google.maps.LatLng(lati, lon));
  mapa = new google.maps.Map(document.getElementById("map"), {
    center: { lat: lati, lng: lon },
    zoom: 8,  
    mapTypeControl: false,
    mapTypeId: 'satellite',
    streetViewControl: false,
    ///minZoom: 10,
    ///maxZoom: 12
  });       
}

/*function project(latLng) {
  let scale = 1 << 3;
  let siny = Math.sin((latLng.lat() * Math.PI) / 180);
  
  // Truncating to 0.9999 effectively limits latitude to 89.189. This is
  // about a third of a tile past the edge of the world tile.
  siny = Math.min(Math.max(siny, -0.9999), 0.9999);
  let worldCoordinate = new google.maps.Point(
    256 * (0.5 + latLng.lng() / 360),
    256 * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
  );
  const tileCoordinate = new google.maps.Point(
    Math.floor((worldCoordinate.x * scale) / 256),
    Math.floor((worldCoordinate.y * scale) / 256)
  );
  console.log(tileCoordinate);  
}*/
