/**
 * Created by Paul on 10/21/2015.
 */
$(document).ready(function() {
    var planID = getUrlParameter('id');
    var url = "/review_plan.html?id=" + planID;

    $("#submitButton").click(function(e){
        e.preventDefault()
        var theForm = document.getElementById("myForm");
        if (!checkForm(theForm))
            return;
        var planData = {};
        $("form").serializeArray().map(function(x) {
            planData[x.name] = x.value;
        });
        planData.date_updated = Date.now();
        $.ajax({
            url: "/v1/editPlan:id",
            type: "POST",
            dataType: "JSON",
            data: {formData: planData, id: planID, username: localStorage.getItem('username')},
            success: function(data){
                window.location.replace(url);
            },
            error: function(xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            }
        })
    });
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


function checkForm(form) {
    var myFormElements = $(form).serializeArray();

    if (form.type.value == 0){
        alert("Error: Must choose a type!");
        return false;
    }
    for (i = 0; i < 16; i++)
    {
        if (myFormElements[i].value === "")
        {
            alert(myFormElements[i].name + " must not be blank!");
            //(myFormElements[i].name).focus();
            return false;
        }
    }
    return true;
}