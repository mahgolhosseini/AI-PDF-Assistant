const pdfUpload = document.getElementById("pdf-upload");
const fileName = document.getElementById("file-name");
const status = document.getElementById("status");
const question = document.getElementById("question");
const sendBtn = document.getElementById("send-btn");
const summarizeBtn = document.getElementById("summarize-btn");
const topicBtn = document.getElementById("topic-btn");
const chatContainer = document.querySelector(".chat-container");

const WORKER_URL = "https://misty-sky-47e3.20235685.workers.dev";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let pdfText = "";
let lastSummary = "";

pdfUpload.addEventListener("change", async function() {

    if (pdfUpload.files.length === 0) {
        fileName.textContent = "No file selected";
        status.textContent = "Waiting for upload";
        return;
    }

    const file = pdfUpload.files[0];

    fileName.textContent = file.name;

    if (file.type !== "application/pdf") {
        status.textContent = "Please select a PDF file";
        return;
    }

    status.textContent = "Reading PDF...";

    try {

        const arrayBuffer = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

        pdfText = "";

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {

            const page = await pdf.getPage(pageNumber);

            const textContent = await page.getTextContent();

            for (let item of textContent.items) {
                pdfText += item.str + " ";
            }

            pdfText += "\n";
        }

        status.textContent = "PDF read successfully";

    } catch (error) {

        console.error(error);
        status.textContent = "Could not read PDF";

    }
});

sendBtn.addEventListener("click", async function() {

    const userQuestion = question.value.trim();

    if (userQuestion === "") {
        return;
    }

    if (pdfText === "") {

        const aiMessage = document.createElement("div");

        aiMessage.classList.add("ai-message");

        aiMessage.innerHTML = "<p>Please upload a PDF first.</p>";

        chatContainer.appendChild(aiMessage);

        return;
    }

    const userMessage = document.createElement("div");

    userMessage.classList.add("user-message");

    userMessage.innerHTML = "<p>" + userQuestion + "</p>";

    chatContainer.appendChild(userMessage);

    question.value = "";

    const aiMessage = document.createElement("div");

    aiMessage.classList.add("ai-message");

    aiMessage.innerHTML = "<p>Thinking...</p>";

    chatContainer.appendChild(aiMessage);

    try {

        const response = await fetch(
            WORKER_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text:
                                        "You are an AI assistant for a PDF document. " +
                                        "Answer the user's question using only the information from the PDF. " +
                                        "If the answer is not in the PDF, say that you could not find the answer in the document." +
                                        "\n\nPDF TEXT:\n" +
                                        pdfText.substring(0, 30000) +
                                        "\n\nUSER QUESTION:\n" +
                                        userQuestion
                                }
                            ]
                        }
                    ]

                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            aiMessage.innerHTML =
                "<p>" +
                (data.error?.message || "Something went wrong.") +
                "</p>";

            return;
        }

        const answer =
            data.candidates[0].content.parts[0].text;

        aiMessage.innerHTML =
            "<p>" + answer + "</p>";

        chatContainer.scrollTop =
            chatContainer.scrollHeight;

    } catch (error) {

        console.error(error);

        aiMessage.innerHTML =
            "<p>Could not connect to the AI service.</p>";

    }

});

question.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        sendBtn.click();
    }

});

summarizeBtn.addEventListener("click", async function() {

    if (pdfText === "") {

        const aiMessage = document.createElement("div");

        aiMessage.classList.add("ai-message");

        aiMessage.innerHTML = "<p>Please upload a PDF first.</p>";

        chatContainer.appendChild(aiMessage);

        return;
    }

    const userMessage = document.createElement("div");

    userMessage.classList.add("user-message");

    userMessage.innerHTML = "<p>Summarize this document</p>";

    chatContainer.appendChild(userMessage);

    const aiMessage = document.createElement("div");

    aiMessage.classList.add("ai-message");

    aiMessage.innerHTML = "<p>Creating summary...</p>";

    chatContainer.appendChild(aiMessage);

    try {

        const response = await fetch(
            WORKER_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text:
                                        "Summarize the following PDF clearly and briefly. " +
                                        "Use only the information in the PDF.\n\n" +
                                        "PDF TEXT:\n" +
                                        pdfText.substring(0, 30000)
                                }
                            ]
                        }
                    ]

                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            aiMessage.innerHTML =
                "<p>" +
                (data.error?.message || "Something went wrong.") +
                "</p>";

            return;
        }

        const answer =
            data.candidates[0].content.parts[0].text;

        lastSummary = answer;

        aiMessage.innerHTML =
            "<p>" + answer + "</p>";

        const downloadButton = document.createElement("button");

        downloadButton.textContent = "Download Summary as PDF";

        downloadButton.classList.add("download-btn");

        downloadButton.addEventListener("click", function() {

            const { jsPDF } = window.jspdf;

            const pdf = new jsPDF();

            const lines = pdf.splitTextToSize(lastSummary, 170);

            pdf.setFontSize(12);

            pdf.text(lines, 20, 20);

            pdf.save("PDF-Summary.pdf");

        });

        chatContainer.appendChild(downloadButton);

        chatContainer.scrollTop =
            chatContainer.scrollHeight;

    } catch (error) {

        console.error(error);

        aiMessage.innerHTML =
            "<p>Could not create the summary.</p>";

    }

});

topicBtn.addEventListener("click", async function() {

    if (pdfText === "") {

        const aiMessage = document.createElement("div");

        aiMessage.classList.add("ai-message");

        aiMessage.innerHTML = "<p>Please upload a PDF first.</p>";

        chatContainer.appendChild(aiMessage);

        return;
    }

    const userMessage = document.createElement("div");

    userMessage.classList.add("user-message");

    userMessage.innerHTML = "<p>What is the main topic?</p>";

    chatContainer.appendChild(userMessage);

    const aiMessage = document.createElement("div");

    aiMessage.classList.add("ai-message");

    aiMessage.innerHTML = "<p>Finding the main topic...</p>";

    chatContainer.appendChild(aiMessage);

    try {

        const response = await fetch(
            WORKER_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text:
                                        "What is the main topic of this PDF? " +
                                        "Explain the main topic clearly and briefly. " +
                                        "Use only the information in the PDF.\n\n" +
                                        "PDF TEXT:\n" +
                                        pdfText.substring(0, 30000)
                                }
                            ]
                        }
                    ]

                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            aiMessage.innerHTML =
                "<p>" +
                (data.error?.message || "Something went wrong.") +
                "</p>";

            return;
        }

        const answer =
            data.candidates[0].content.parts[0].text;

        aiMessage.innerHTML =
            "<p>" + answer + "</p>";

        chatContainer.scrollTop =
            chatContainer.scrollHeight;

    } catch (error) {

        console.error(error);

        aiMessage.innerHTML =
            "<p>Could not find the main topic.</p>";

    }

});