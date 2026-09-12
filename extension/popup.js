const analyzeButton = document.getElementById("analyzeBtn");
const resumeInput = document.getElementById("resumeInput");

const status = document.getElementById("status");
const result = document.getElementById("result");


// --------------------------------
// Helper: Display list
// --------------------------------

function displayList(elementId, items) {

    const list = document.getElementById(elementId);

    list.innerHTML = "";

    for (const item of items || []) {

        const li = document.createElement("li");

        li.textContent = item;

        list.appendChild(li);
    }
}


// --------------------------------
// Analyze button
// --------------------------------

analyzeButton.addEventListener("click", async () => {

    analyzeButton.disabled = true;

    result.classList.add("hidden");

    status.textContent = "Uploading resume...";


    try {

        // --------------------------------
        // Check resume
        // --------------------------------

        const resumeFile = resumeInput.files[0];

        if (!resumeFile) {

            throw new Error(
                "Please select your resume first."
            );
        }


        // --------------------------------
        // Upload resume
        // --------------------------------

        const formData = new FormData();

        formData.append(
            "file",
            resumeFile
        );


        const resumeResponse = await fetch(
            "http://127.0.0.1:8000/resume",
            {
                method: "POST",
                body: formData
            }
        );


        if (!resumeResponse.ok) {

            throw new Error(
                `Resume upload failed: ${resumeResponse.status}`
            );
        }


        const resumeData =
            await resumeResponse.json();


        console.log(
            "Resume uploaded:",
            resumeData
        );


        if (!resumeData.text) {

            throw new Error(
                "Could not extract resume text."
            );
        }


        // --------------------------------
        // Extract LinkedIn job
        // --------------------------------

        status.textContent =
            "Extracting job information...";


        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });


        if (!tab || !tab.id) {

            throw new Error(
                "Could not access the current tab."
            );
        }


        const jobData =
            await chrome.tabs.sendMessage(
                tab.id,
                {
                    action: "extractJob"
                }
            );


        console.log(
            "Job data:",
            jobData
        );


        if (!jobData || !jobData.description) {

            throw new Error(
                "Could not extract job information."
            );
        }


        // --------------------------------
        // Analyze job
        // --------------------------------

        status.textContent =
            "Analyzing job with AI...";


        const jobResponse = await fetch(
            "http://127.0.0.1:8000/analyze-job",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    job_description:
                        jobData.description
                })
            }
        );


        if (!jobResponse.ok) {

            throw new Error(
                `Job analysis failed: ${jobResponse.status}`
            );
        }


        const analysis =
            await jobResponse.json();


        console.log(
            "Job analysis:",
            analysis
        );


        // --------------------------------
        // Display job information
        // --------------------------------

        document.getElementById(
            "jobTitle"
        ).textContent =
            analysis.job_title ||
            jobData.title;


        document.getElementById(
            "company"
        ).textContent =
            jobData.company;


        document.getElementById(
            "location"
        ).textContent =
            jobData.location;


        // --------------------------------
        // Required skills
        // --------------------------------

        displayList(
            "requiredSkills",
            analysis.required_skills
        );


        // --------------------------------
        // Preferred skills
        // --------------------------------

        displayList(
            "preferredSkills",
            analysis.preferred_skills
        );


        // --------------------------------
        // Experience
        // --------------------------------

        document.getElementById(
            "experience"
        ).textContent =
            analysis.experience ||
            "Not specified";


        // --------------------------------
        // Match resume against job
        // --------------------------------

        status.textContent =
            "Matching resume with job...";


        const matchResponse = await fetch(
            "http://127.0.0.1:8000/match",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    resume_text: resumeData.text,
                    job_data: analysis
                })
            }
        );


        if (!matchResponse.ok) {

            throw new Error(
                `Resume matching failed: ${matchResponse.status}`
            );
        }


        const matchResult =
            await matchResponse.json();


        console.log(
            "JobCheck match result:",
            matchResult
        );


        // --------------------------------
        // Match score
        // --------------------------------

        document.getElementById(
            "matchScore"
        ).textContent =
            `${matchResult.match_score}%`;


        // --------------------------------
        // Matched skills
        // --------------------------------

        displayList(
            "matchedSkills",
            matchResult.matched_skills
        );


        // --------------------------------
        // Missing skills
        // --------------------------------

        displayList(
            "missingSkills",
            matchResult.missing_skills
        );


        // --------------------------------
        // Partial matches
        // --------------------------------

        displayList(
            "partialMatches",
            matchResult.partial_matches
        );


        // --------------------------------
        // Experience match
        // --------------------------------

        document.getElementById(
            "experienceMatch"
        ).textContent =
            matchResult.experience_match ||
            "Not specified";


        // --------------------------------
        // Recommendations
        // --------------------------------

        displayList(
            "recommendations",
            matchResult.recommendations
        );


        // --------------------------------
        // Show result
        // --------------------------------

        result.classList.remove("hidden");

        status.textContent =
            "Match analysis complete.";


    } catch (error) {

        console.error(
            "JobCheck error:",
            error
        );


        status.textContent =
            `Error: ${error.message}`;


    } finally {

        analyzeButton.disabled = false;

    }

});