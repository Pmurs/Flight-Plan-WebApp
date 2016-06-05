/**
 * Created by Paul on 9/21/2015.
 */
$(document).ready(function() {
    var username = localStorage.getItem('username');
    var planID = getUrlParameter('id');
    var url = "/v1/plan/" + planID;

    if (localStorage.getItem('completed_' + planID)) {
        document.getElementById('complete_plan').style.display = 'none';
    }
    else {
        document.getElementById('complete_plan').style.display = 'inline';
    }

    document.getElementById('profile').href = "profile.html?username=" + username;
    document.getElementById('edit_plan').href = "editPlan.html?id=" + planID;


    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'Json',
        success: function(load) {
            document.getElementById("type").innerHTML = load['type'];
            document.getElementById("ident").innerHTML = load['ident'];
            document.getElementById("special_equip").innerHTML = load['special_equip'];
            document.getElementById("true_airspeed").innerHTML = load['true_airspeed'];
            document.getElementById("departure").innerHTML = load['departure'];
            document.getElementById("dept_time_proposed").innerHTML = load['dept_time_proposed'];
            document.getElementById("dept_time_actual").innerHTML = load['dept_time_actual'];
            document.getElementById("cruise_alt").innerHTML = load['cruise_alt'];
            document.getElementById("route").innerHTML = load['route'];
            document.getElementById("dst").innerHTML = load['dst'];
            document.getElementById("ete").innerHTML = load['ete'];
            document.getElementById("remarks").innerHTML = load['remarks'];
            document.getElementById("fuel").innerHTML = load['fuel'];
            document.getElementById("alt_airports").innerHTML = load['alt_airports'];
            document.getElementById("name").innerHTML = load['name'];
            document.getElementById("num_aboard").innerHTML = load['num_aboard'];
            document.getElementById("color").innerHTML = load['color'];
            document.getElementById("dst_contact").innerHTML = load['dst_contact'];
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

function complete_plan() {
    var planID = getUrlParameter('id');
    localStorage.setItem(('completed_' + planID), true);
    console.log(localStorage);
    plan_post(0);
}

function delete_plan() {
    var planID = getUrlParameter('id');
    localStorage.removeItem('completed_' + planID);
    plan_post(1);
}

function plan_post(complete_delete) {
    var username = localStorage.getItem('username');
    var planID = getUrlParameter('id');

    $.ajax({
        type: 'POST',
        url: "/v1/review_plan:id",
        dataType: 'JSON',
        data: {username: username, id: planID, complete_delete: complete_delete},
        success: function() {
            if (complete_delete == 1) {
                window.location.replace("/profile.html?username=" + username);
            }
            else {
                location.reload();
            }
        },
        error: function(xhr, ajaxOptions, thrownError) {
            alert(xhr.status);
            alert(thrownError);
        }
    })
}