/**
 * Created by Paul on 9/21/2015.
 */

function setUpMap() {
    var map = L.map('map').setView([36.1667, -86.7833], 8);

    L.tileLayer('http://localhost:8080/v1/map_images?type=vfr&z={z}&x={x}&y={y}', {
        maxZoom: 10,
        minZoom: 3,
        tms: true
    }).addTo(map);

    if (localStorage.getItem('username') != null){
        document.getElementById('notLoggedIn').style.display = 'none';
        document.getElementById('loggedIn').style.display = 'inline';
        document.getElementById('profile').href = "profile.html?username=" + localStorage.getItem('username');
    }

    function onMapClick(e) {
        console.log(e.latlng);
        var url = '/v1/airport?lat='+ e.latlng.lat + '&lng=' + e.latlng.lng + '&maxDist=10000';

        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'Json',
            success: function(){
                console.log('success!');
            }

        })
    }

    map.on('click', onMapClick);
}

function logOut() {
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    document.getElementById('notLoggedIn').style.display = 'inline';
    document.getElementById('loggedIn').style.display = 'none';
}