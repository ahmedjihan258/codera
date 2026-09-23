async function loadCourses() {

    const container = document.getElementById("coursesContainer");

    try {

        const response = await fetch("../php/courses.php");

        const result = await response.json();

        if (!result.success) {
            container.innerHTML = "<p>Unable to load courses.</p>";
            return;
        }


        container.innerHTML = "";


        result.courses.forEach(function(course) {

            const card = document.createElement("div");

            card.className = "course-card";

            const firstLetter = course.title.charAt(0).toUpperCase();

            card.innerHTML = `
                <div class="course-icon">
                    ${firstLetter}
                </div>

                <h2>${course.title}</h2>

                <p class="course-description">
                    ${course.description}
                </p>

                <div class="course-meta">

                    <span>${course.level}</span>

                    <span>${course.duration}</span>

                    <span>${course.lessons} Lessons</span>

                </div>

                <a
                    href="course-details.html?id=${course.id}"
                    class="course-button"
                >
                    View Course
                </a>
            `;

            container.appendChild(card);

        });

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Unable to connect to the server.</p>";
    }
}


loadCourses();

async function loadCourseDetails() {

    const detailsContainer =
        document.getElementById("courseDetails");

    if (!detailsContainer) {
        return;
    }


    const params = new URLSearchParams(window.location.search);

    const courseId = params.get("id");


    if (!courseId) {

        detailsContainer.innerHTML =
            "<p>Course not found.</p>";

        return;
    }


    try {

        const response =
            await fetch(`../php/courses.php?id=${courseId}`);

        const result = await response.json();


        if (!result.success) {

            detailsContainer.innerHTML =
                "<p>Course not found.</p>";

            return;
        }


        const course = result.course;


        // Check enrollment

        const enrollmentResponse =
            await fetch(
                `../php/enrollment.php?course_id=${course.id}`
            );

        const enrollmentResult =
            await enrollmentResponse.json();


        const isEnrolled =
            enrollmentResult.success &&
            enrollmentResult.enrolled;


        if (isEnrolled) {

            showEnrolledCourse(course);

            return;
        }


        // Show course

        detailsContainer.innerHTML = `

            <div class="course-details-icon">
                ${course.title.charAt(0)}
            </div>

            <h1>${course.title}</h1>

            <p class="course-details-description">
                ${course.description}
            </p>

            <div class="course-details-meta">

                <span>
                    Level: ${course.level}
                </span>

                <span>
                    Duration: ${course.duration}
                </span>

                <span>
                    ${course.lessons} Lessons
                </span>

            </div>

            <button
                class="enroll-button"
                id="enrollButton"
            >
                Enroll Now
            </button>

        `;


        document
            .getElementById("enrollButton")
            .addEventListener(
                "click",
                function() {
                    enrollCourse(course.id);
                }
            );


    } catch (error) {

        console.error(error);

        detailsContainer.innerHTML =
            "<p>Unable to connect to the server.</p>";
    }
}



async function enrollCourse(courseId) {

    const button =
        document.getElementById("enrollButton");

    button.disabled = true;

    button.textContent = "Enrolling...";


    const formData = new FormData();

    formData.append("course_id", courseId);


    try {

        const response =
            await fetch("../php/enrollment.php", {
                method: "POST",
                body: formData
            });


        const result =
            await response.json();


        if (result.success) {

            // Reload course details
            loadCourseDetails();

        } else {

            alert(result.message);

            button.disabled = false;

            button.textContent = "Enroll Now";
        }


    } catch (error) {

        console.error(error);

        alert("Unable to connect to the server.");

        button.disabled = false;

        button.textContent = "Enroll Now";
    }
}



function showEnrolledCourse(course) {

    const detailsContainer =
        document.getElementById("courseDetails");


    detailsContainer.innerHTML = `

        <div class="enrollment-success">

            <div class="enrollment-success-icon">
                ✓
            </div>

            <h2>You're Enrolled!</h2>

            <p>
                You are successfully enrolled in
                <strong>${course.title}</strong>.
            </p>

            <a
                href="learning.html?course_id=${course.id}"
                class="start-learning-button"
            >
                Start Learning
            </a>

        </div>

    `;
}



loadCourseDetails();