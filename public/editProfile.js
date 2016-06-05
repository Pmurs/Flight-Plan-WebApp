/**
 * Created by Paul on 10/21/2015.
 */
/*** Created by Paul on 9/21/2015.*/
$(document).ready(function() {
    $("form").submit(function(e){
        e.preventDefault();
        theForm = document.getElementById("myForm");
        if (!checkForm(theForm))
            return;
        var userData = {};
        $("form").serializeArray().map(function(x) {
            userData[x.name] = x.value;
        });
        $.ajax({
            url: "/v1/editProfile:username",
            type: "POST",
            dataType: "Json",
            data: {formData: userData, username: localStorage.getItem('username')},
            success: function(){
                localStorage.setItem('username', userData.username.toLowerCase());
                window.location.replace("/profile.html?username=" + theForm.username.value.toLowerCase());
            },
            error: function(xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            }
        })
    });
});

function checkForm(form) {
    uName = form.username.value;
    uPass = form.password.value;
    uZip = form.address_zip.value;
    uPhone = form.primary_phone.value;
    if(form.first_name.value == "") {
        alert("Error: First name cannot be blank!");
        form.first_name.focus();
        return false;
    }
    if(form.last_name.value == "") {
        alert("Error: Last name cannot be blank!");
        form.last_name.focus();
        return false;
    }
    if(form.primary_email.value == "") {
        alert("Error: Email cannot be blank!");
        form.primary_email.focus();
        return false;
    }
    if(uName == "") {
        alert("Error: Username cannot be blank!");
        form.username.focus();
        return false;
    }
    if(uName.length < 6) {
        alert("Error: Username must be at least six characters!")
        form.username.focus();
        return false;
    }
    if(uName.length > 16) {
        alert("Error: Username must be at less than 16 characters!")
        form.username.focus();
        return false;
    }
    re = /[A-za-z0-9]/;
    if(!re.test(uName)) {
        alert("Error: Username must contain only letters and numbers!");
        form.username.focus();
        return false;
    }
    if(uPass.length < 8) {
        alert("Error: Password must contain at least eight characters!");
        form.password.focus();
        return false;
    }
    re = /[a-z]+/;
    if(!re.test(uPass)) {
        alert("Error: Password must contain at least one lowercase letter!");
        form.password.focus();
        return false;
    }
    re = /[A-Z]+/;
    if(!re.test(uPass)) {
        alert("Error: Password must contain at least one uppercase letter!");
        form.password.focus();
        return false;
    }
    re = /[0-9]+/;
    if(!re.test(uPass)) {
        alert("Error: Password must contain at least one number!");
        form.password.focus();
        return false;
    }
    re = /[^A-za-z0-9]+/;
    if(!re.test(uPass)) {
        alert("Error: Password must contain at least one symbol!");
        form.password.focus();
        return false;
    }
    re = /[0-9]/;
    if (uPhone.length != 0){
        if(!re.test(uPhone)) {
            alert("Error: phone number must contain only numbers")
            form.primary_phone.focus();
            return false;
        }
        if(uPhone.length != 10){
            alert("Error: phone number must be exactly ten digits")
            form.primary_phone.focus();
            return false;
        }
    }
    if(uZip.length != 0){
        if(!re.test(uZip)) {
            alert("Error: ZIP code must contain only numbers")
            form.address_zip.focus();
            return false;
        }
        if(uZip.length != 5){
            alert("Error: ZIP code must be exactly five digits")
            form.address_zip.focus();
            return false;
        }
    }
    return true;
}