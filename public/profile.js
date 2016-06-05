/**
 * Created by Paul on 9/21/2015.
 */

$(document).ready(function() {
    var username = getUrlParameter('username');
    if (localStorage.getItem('username') != null){
        document.getElementById('notLoggedIn').style.display = 'none';
        document.getElementById('loggedIn').style.display = 'inline';
        document.getElementById('gravitar').src = "http://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50" // + MD5(localStorage.getItem('email'));
        if (username === localStorage.getItem('username')){
            document.getElementById('edit').style.display = 'inline';
        }
        else {
            document.getElementById('edit').style.display = 'none';
        }
    }
    else {
        document.getElementById('notLoggedIn').style.display = 'inline';
        document.getElementById('loggedIn').style.display = 'none';
    }
    var url = "/v1/user/" + username;

    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'Json',
        success: function(load) {
            if (load['active_status'] == false) {
                document.getElementById('deactivate').style.display = 'none';
            }
            else {
                document.getElementById('deactivate').style.display = 'inline';
            }
            document.getElementById("username").innerHTML = load['username'];
            document.getElementById("first_name").innerHTML = load['first_name'];
            document.getElementById("last_name").innerHTML = load['last_name'];
            document.getElementById("dob").innerHTML = load['dob'];
            document.getElementById("address_street").innerHTML = load['address_street'];
            document.getElementById("address_city").innerHTML = load['address_city'];
            document.getElementById("address_state").innerHTML = load['address_state'];
            document.getElementById("address_zip").innerHTML = load['address_zip'];
            document.getElementById("primary_phone").innerHTML = load['primary_phone'];
            document.getElementById("primary_email").innerHTML = load['primary_email'];
        }
    })
});

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

function logOut() {
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    document.getElementById('edit').style.display = 'none';
    document.getElementById('notLoggedIn').style.display = 'inline';
    document.getElementById('loggedIn').style.display = 'none';

}

function deactivate() {
    var username = getUrlParameter('username');
    var url = "/v1/user/" + username;

    $.ajax({
        type: 'POST',
        url: url,
        dataType: 'Json',
        data: localStorage.getItem('username'),
        success: function() {
            logOut();
            window.location.replace("/profile.html");
        }
    })
}