/**
 * Created by Paul on 9/21/2015.
 */

$(document).ready(function() {
    $("#submitButton").click(function(e){
        e.preventDefault()
        $.ajax({
            url: "/v1/session",
            type: "POST",
            dataType: "Json",
            data: $("form").serializeArray(),
            success: function(){
                logIn();
            },
            error: function(xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            }
        })
    });
});

function logIn() {
    localStorage.setItem('username', document.getElementById("myForm").elements[0].value.toLowerCase());
    window.location.replace("/map.html");
}