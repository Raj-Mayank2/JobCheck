function getText(selector) {
    const element = document.querySelector(selector);

    if (!element) {
        return "";
    }

    return element.innerText.trim();
}


function extractField(text, fieldName) {

    const regex = new RegExp(
        fieldName + ":\\s*(.+)",
        "i"
    );

    const match = text.match(regex);

    return match ? match[1].trim() : "";
}


function extractJobData() {

    const pageText = document.body.innerText;


    // --------------------------------
    // Extract job description
    // --------------------------------

    let description = "";

    const aboutIndex = pageText.indexOf("About the job");

    if (aboutIndex !== -1) {

        let jobText = pageText.substring(
            aboutIndex + "About the job".length
        );

        const endMarkers = [
            "Set alert for similar jobs",
            "See how you compare",
            "More jobs",
            "Show Premium Insights"
        ];

        let endIndex = jobText.length;

        for (const marker of endMarkers) {

            const index = jobText.indexOf(marker);

            if (index !== -1 && index < endIndex) {
                endIndex = index;
            }
        }

        description = jobText
            .substring(0, endIndex)
            .trim();
    }


    // --------------------------------
    // Extract structured fields
    // --------------------------------

    let title = extractField(
        description,
        "Job Title"
    );

    let company = extractField(
        description,
        "Company"
    );

    let location = extractField(
        description,
        "Location"
    );


    // --------------------------------
    // Fallback title extraction
    // --------------------------------

    if (!title) {

        const lines = pageText
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);

        const aboutIndexLine = lines.indexOf("About the job");

        if (aboutIndexLine > 0) {

            for (
                let i = aboutIndexLine - 1;
                i >= 0;
                i--
            ) {

                const line = lines[i];

                if (
                    line.length > 2 &&
                    line.length < 100 &&
                    !line.includes("days ago") &&
                    line !== "Apply" &&
                    line !== "Save"
                ) {

                    title = line;
                    break;
                }
            }
        }
    }


    const jobData = {
        title,
        company,
        location,
        description
    };


    console.log("JobCheck extracted:", jobData);

    console.log("TITLE:", title);
    console.log("COMPANY:", company);
    console.log("LOCATION:", location);
    console.log(
        "DESCRIPTION LENGTH:",
        description.length
    );


    return jobData;
}


chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action === "extractJob") {

            const jobData = extractJobData();

            sendResponse(jobData);
        }

        return true;
    }
);