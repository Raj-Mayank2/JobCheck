
const analyzeButton =
    document.getElementById("analyzeBtn");

const resumeInput =
    document.getElementById("resumeInput");

const fileName =
    document.getElementById("fileName");

const status =
    document.getElementById("status");

const result =
    document.getElementById("result");


/* =========================
   RESUME FILE
========================= */

resumeInput.addEventListener("change", () => {

    const file =
        resumeInput.files[0];

    fileName.textContent =
        file
            ? file.name
            : "PDF or DOCX";
});


/* =========================
   SKILL CHIPS
========================= */

function displaySkills(
    elementId,
    items,
    type
) {

    const container =
        document.getElementById(elementId);

    container.innerHTML = "";

    if (
        !items ||
        items.length === 0
    ) {

        const empty =
            document.createElement("span");

        empty.className =
            "empty-state";

        empty.textContent =
            "None identified";

        container.appendChild(empty);

        return;
    }


    for (const item of items) {

        const chip =
            document.createElement("span");

        chip.className =
            `skill-chip ${type}`;

        chip.textContent =
            item;

        container.appendChild(chip);
    }
}


/* =========================
   RECOMMENDATIONS
========================= */

function displayRecommendations(items) {

    const list =
        document.getElementById(
            "recommendations"
        );

    list.innerHTML = "";


    if (
        !items ||
        items.length === 0
    ) {

        const li =
            document.createElement("li");

        li.textContent =
            "No specific actions identified.";

        list.appendChild(li);

        return;
    }


    for (const item of items) {

        const li =
            document.createElement("li");

        li.textContent =
            item;

        list.appendChild(li);
    }
}


/* =========================
   MATCH LABEL
========================= */

function getMatchLabel(score) {

    if (score >= 85) {

        return "Excellent Match";
    }


    if (score >= 70) {

        return "Strong Match";
    }


    if (score >= 50) {

        return "Moderate Match";
    }


    if (score >= 35) {

        return "Weak Match";
    }


    return "Low Match";
}


/* =========================
   APPLY DECISION
========================= */

function getApplyDecision(score) {

    if (score >= 80) {

        return {
            title: "🟢 Strong Apply",

            reason:
                "Your resume is a strong match for this role."
        };
    }


    if (score >= 65) {

        return {
            title: "🟢 Apply",

            reason:
                "Good overall match with a few areas to strengthen."
        };
    }


    if (score >= 50) {

        return {
            title: "🟡 Apply — Some Gaps",

            reason:
                "You have relevant skills, but several requirements are not yet demonstrated."
        };
    }


    if (score >= 35) {

        return {
            title: "🟠 Consider Applying",

            reason:
                "There is some relevant experience, but the role has notable gaps."
        };
    }


    return {
        title: "🔴 Low Match",

        reason:
            "This role has significant gaps compared with your resume."
    };
}


/* =========================
   SET PROGRESS
========================= */

function setProgress(
    elementId,
    value
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    const safeValue =
        Math.max(
            0,
            Math.min(
                100,
                Number(value) || 0
            )
        );

    element.style.width =
        `${safeValue}%`;
}


/* =========================
   ANALYZE JOB
========================= */

analyzeButton.addEventListener(
    "click",
    async () => {

        analyzeButton.disabled = true;

        result.classList.add("hidden");

        status.textContent =
            "Uploading resume...";


        try {

            /* =========================
               1. RESUME
            ========================= */

            const resumeFile =
                resumeInput.files[0];


            if (!resumeFile) {

                throw new Error(
                    "Please select your resume first."
                );
            }


            const formData =
                new FormData();


            formData.append(
                "file",
                resumeFile
            );


            const resumeResponse =
                await fetch(
                    "https://jobcheck-api.onrender.com/resume",
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


            if (!resumeData.text) {

                throw new Error(
                    "Could not extract resume text."
                );
            }


            /* =========================
               2. GET LINKEDIN JOB
            ========================= */

            status.textContent =
                "Extracting job information...";


            const tabs =
                await chrome.tabs.query({
                    active: true,
                    currentWindow: true
                });


            const tab =
                tabs[0];


            if (
                !tab ||
                !tab.id
            ) {

                throw new Error(
                    "Could not access the current tab."
                );
            }


            let jobData;


            try {

                jobData =
                    await chrome.tabs.sendMessage(
                        tab.id,
                        {
                            action:
                                "extractJob"
                        }
                    );

            } catch (error) {

                console.error(
                    "Content script error:",
                    error
                );

                throw new Error(
                    "Please refresh the LinkedIn job page and try again."
                );
            }


            if (
                !jobData ||
                !jobData.description
            ) {

                throw new Error(
                    "Could not extract job information."
                );
            }


            /* =========================
               3. ANALYZE JOB
            ========================= */

            status.textContent =
                "Analyzing job with AI...";


            const jobResponse =
                await fetch(
                    "https://jobcheck-api.onrender.com/analyze-job",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
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


            /* =========================
               4. JOB INFORMATION
            ========================= */

            document.getElementById(
                "jobTitle"
            ).textContent =
                analysis.job_title ||
                jobData.title ||
                "Unknown Position";


            document.getElementById(
                "company"
            ).textContent =
                jobData.company ||
                "Unknown Company";


            document.getElementById(
                "location"
            ).textContent =
                jobData.location ||
                "Location not specified";


            /* =========================
               5. JOB REQUIREMENTS
            ========================= */

            const requiredSkills =
                analysis.required_skills ||
                [];


            const preferredSkills =
                analysis.preferred_skills ||
                [];


            document.getElementById(
                "requiredCount"
            ).textContent =
                requiredSkills.length;


            document.getElementById(
                "preferredCount"
            ).textContent =
                preferredSkills.length;


            document.getElementById(
                "experience"
            ).textContent =
                analysis.experience ||
                "Not specified";


            /* =========================
               6. MATCH RESUME
            ========================= */

            status.textContent =
                "Matching resume with job...";


            const matchResponse =
                await fetch(
                    "https://jobcheck-api.onrender.com/match",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            resume_text:
                                resumeData.text,

                            job_data:
                                analysis
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


            /* =========================
               7. MATCH DATA
            ========================= */

            const score =
                Number(
                    matchResult.match_score
                ) || 0;


            const matchedSkills =
                matchResult.matched_skills ||
                [];


            const missingSkills =
                matchResult.missing_skills ||
                [];


            const partialMatches =
                matchResult.partial_matches ||
                [];


            const recommendations =
                matchResult.recommendations ||
                [];


            /* =========================
               8. OVERALL SCORE
            ========================= */

            document.getElementById(
                "matchScore"
            ).textContent =
                `${score}%`;


            document.getElementById(
                "matchLabel"
            ).textContent =
                getMatchLabel(score);


            /* =========================
               9. SCORE BREAKDOWN
            ========================= */

            const breakdown =
                matchResult.score_breakdown ||
                {};


            const skillsScore =
                Number(
                    breakdown.skills
                ) || 0;


            const experienceScore =
                Number(
                    breakdown.experience
                ) || 0;


            const responsibilityScore =
                Number(
                    breakdown.responsibilities
                ) || 0;


            const preferredScore =
                Number(
                    breakdown.preferred_skills
                ) || 0;


            document.getElementById(
                "skillsScore"
            ).textContent =
                `${skillsScore}%`;


            document.getElementById(
                "experienceScore"
            ).textContent =
                `${experienceScore}%`;


            document.getElementById(
                "responsibilityScore"
            ).textContent =
                `${responsibilityScore}%`;


            document.getElementById(
                "preferredScore"
            ).textContent =
                `${preferredScore}%`;


            setProgress(
                "skillsProgress",
                skillsScore
            );


            setProgress(
                "experienceProgress",
                experienceScore
            );


            setProgress(
                "responsibilityProgress",
                responsibilityScore
            );


            setProgress(
                "preferredProgress",
                preferredScore
            );


            /* =========================
               10. SUMMARY
            ========================= */

            document.getElementById(
                "matchedCount"
            ).textContent =
                matchedSkills.length;


            document.getElementById(
                "missingCount"
            ).textContent =
                missingSkills.length;


            document.getElementById(
                "recommendationCount"
            ).textContent =
                recommendations.length;


            /* =========================
               11. SKILLS
            ========================= */

            displaySkills(
                "matchedSkills",
                matchedSkills,
                "success"
            );


            displaySkills(
                "missingSkills",
                missingSkills,
                "danger"
            );


            displaySkills(
                "partialMatches",
                partialMatches,
                "warning"
            );


            /* =========================
               12. EXPERIENCE
            ========================= */

            document.getElementById(
                "experienceMatch"
            ).textContent =
                matchResult.experience_match ||
                "Not specified";


            /* =========================
               13. RECOMMENDATIONS
            ========================= */

            displayRecommendations(
                recommendations
            );


            /* =========================
               14. APPLY DECISION
            ========================= */

            const decision =
                getApplyDecision(score);


            document.getElementById(
                "applyDecision"
            ).textContent =
                decision.title;


            document.getElementById(
                "applyReason"
            ).textContent =
                decision.reason;


            /* =========================
               15. SHOW REPORT
            ========================= */

            result.classList.remove(
                "hidden"
            );


            status.textContent =
                "Analysis complete ✓";


        } catch (error) {

            console.error(
                "JobCheck error:",
                error
            );


            status.textContent =
                `Error: ${error.message}`;


        } finally {

            analyzeButton.disabled =
                false;
        }
    }
);

