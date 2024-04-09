import axios from "axios";
import fs from "fs";

const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";

const MOCHAWESOME_JSON_PATH = "./mochawesome.json";

const analyzeTestResults = async () => {
  try {
    const testResults = fs.readFileSync(MOCHAWESOME_JSON_PATH, "utf8");
    const parsedResults = JSON.parse(testResults);

    let analysisRequestText =
      "請分析以下的E2E測試結果，並報告測試是否正常，總共測試幾條，完成、失敗各為幾條。如果存在任何錯誤，請列出失敗的測試案例並解釋原因。\n\n";

    parsedResults.results.forEach((result) => {
      result.suites.forEach((suite) => {
        suite.tests.forEach((test) => {
          analysisRequestText += `Test: ${test.fullTitle}\nStatus: ${test.state}\n`;
          if (test.err.message) {
            analysisRequestText += `Error: ${test.err.message}\n`;
          }
        });
      });
    });

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: analysisRequestText,
          },
        ],
        // max_tokens: 1024
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    
    console.log(
      "Analysis Report:",
      response.data.choices[0].message.content
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error analyzing test results:", error.message);
  }
}

const sendToTeams = async (analyzeTestResults) => {
  const webhookUrl = "YOUR_TEAMS_WEBHOOK_URL";

  const message = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: "新消息通知",
    sections: [
      {
        activityTitle: "e2e測試結果分析",
        activitySubtitle: new Date().toLocaleString(),
        // activityImage: "圖片可選",
        text: analyzeTestResults,
      },
    ],
  };

  axios
    .post(webhookUrl, message)
    .then((response) => {
      console.log("Message sent successfully", response.data);
    })
    .catch((error) => {
      console.error("Failed to send message", error);
    });
};

const main = async () => {
  const analyzeTestResults = await analyzeTestResults();
  await sendToTeams(analyzeTestResults);

}

main()