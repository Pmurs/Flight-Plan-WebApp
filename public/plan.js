/**
 * Created by Paul on 9/21/2015.
 */

$(document).ready(function() {
    $("#submitButton").click(function(e){
        e.preventDefault()
        currentUser = localStorage.getItem('username');
        theForm = document.getElementById("myForm");
        if (!checkForm(theForm))
            return;
        if (!localStorage.getItem('username')){
            alert('Must be logged in to create flight plan!');
            return;
        }
        var planData = {};
        $("form").serializeArray().map(function(x) {
            planData[x.name] = x.value;
        });
        planData.associated_account = currentUser;
        $.ajax({
            url: "/v1/plan",
            type: "POST",
            dataType: "Json",
            data: {formData: planData, username: currentUser},
            success: function(data){
                window.location.replace("/review_plan.html?id=" + data["planid"]);
            },
            error: function(xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            }
        })
    });
});

function checkForm(form) {
    myFormElements = $(form).serializeArray();

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