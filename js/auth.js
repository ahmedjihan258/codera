// =========================================================
// SIGNUP FORM
// =========================================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const message =
            document.getElementById("signupMessage");


        // Check name
        if (name === "") {
            message.textContent =
                "Please enter your full name.";
            return;
        }


        // Check email
        if (email === "") {
            message.textContent =
                "Please enter your email.";
            return;
        }


        // Check password
        if (password.length < 6) {
            message.textContent =
                "Password must be at least 6 characters.";
            return;
        }


        // Check password match
        if (password !== confirmPassword) {
            message.textContent =
                "Passwords do not match.";
            return;
        }


        // Prepare form data
        const formData = new FormData();

        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);


        try {

            const response = await fetch(
                "../php/signup.php",
                {
                    method: "POST",
                    body: formData
                }
            );


            const result = await response.json();


            message.textContent = result.message;


            if (result.success) {

                signupForm.reset();

                setTimeout(function () {

                    window.location.href = "login.html";

                }, 1500);

            }

        } catch (error) {

            console.error(error);

            message.textContent =
                "Unable to connect to the server.";

        }

    });

}


// =========================================================
// LOGIN FORM
// =========================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");


        // Check email
        if (email === "") {
            message.textContent =
                "Please enter your email.";
            return;
        }


        // Check password
        if (password === "") {
            message.textContent =
                "Please enter your password.";
            return;
        }


        // Prepare data
        const formData = new FormData();

        formData.append("email", email);
        formData.append("password", password);


        try {

            const response = await fetch(
                "../php/login.php",
                {
                    method: "POST",
                    body: formData
                }
            );


            const result = await response.json();


            message.textContent = result.message;


            // Login successful
            if (result.success) {

                setTimeout(function () {

                    window.location.href = "dashboard.html";

                }, 1000);

            }

        } catch (error) {

            console.error(error);

            message.textContent =
                "Unable to connect to the server.";

        }

    });

}