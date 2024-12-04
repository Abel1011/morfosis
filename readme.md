# Mórfosis: Transform Your Writing Effortlessly

**Mórfosis** is a Chrome extension designed to enhance your writing experience using the power of Gemini Nano AI. Whether you need to rewrite, summarize, translate, or generate suggestions for your text, Mórfosis offers seamless solutions directly within your browser.

---

## Built for the Google Chrome Built-in AI Challenge

Mórfosis was developed as part of the **Google Chrome Built-in AI Challenge**, showcasing the potential of integrating advanced AI capabilities directly into the browser environment.

---

## System Requirements

To ensure proper functionality, please verify that your system meets the requirements by reviewing the following resources:

1. [Welcome and About the Prompt API](https://docs.google.com/document/d/1VG8HIyz361zGduWgNG7R_R8Xkv0OOJ8b5C9QKeCjU0c/edit?tab=t.0#heading=h.drihdh1gpv8p)
2. [The Writer and Rewriter APIs](https://docs.google.com/document/d/1WZlAvfrIWDwzQXdqIcCOTcrWLGGgmoesN1VGFbKU_D4/edit?tab=t.0#heading=h.cknrtv1om4a3)
3. [The Language Detection API](https://docs.google.com/document/d/1lY40hdaWizzImXaI2iCGto9sOY6s25BcDJDYQvxpvk4/edit?tab=t.0#heading=h.cknrtv1om4a3)
4. [The Translation API](https://docs.google.com/document/d/1bzpeKk4k26KfjtR-_d9OuXLMpJdRMiLZAOVNMuFIejk/edit?tab=t.0#heading=h.cknrtv1om4a3)
5. [The Summarization API](https://docs.google.com/document/d/1Bvd6cU9VIEb7kHTAOCtmmHNAYlIZdeNmV7Oy-2CtimA/edit?tab=t.0)

---

## Important Note

Mórfosis uses **experimental Chrome APIs**, making it compatible only with **Chrome Canary** or **Chrome Dev Channel**. Please ensure you are using one of these versions of Chrome to access the full functionality of the extension.

---

## Installation Guide

Follow these steps to add the Mórfosis extension to Google Chrome:

1. **Download the Extension Files**: Ensure you have all the required files for the extension (HTML, JavaScript, and other resources).
   
2. **Open Chrome Extensions Page**:
   - Open Chrome and go to `chrome://extensions/`.
   - Alternatively, click on the menu (three vertical dots in the top-right corner), navigate to **More tools** > **Extensions**.

3. **Enable Developer Mode**:
   - Toggle the **Developer mode** switch in the top-right corner of the extensions page.

4. **Load the Unpacked Extension**:
   - Click the **Load unpacked** button.
   - Navigate to the folder where your extension files are stored and select it.

5. **Verify Installation**:
   - Once loaded, the extension should appear in the list of installed extensions.
   - Pin the extension to your toolbar for quick access.

6. **Enjoy!** Start enhancing your writing effortlessly with Mórfosis.

---

## Features

- **Rewrite Text**: Improve clarity, grammar, and tone.
- **Summarize**: Get concise summaries of lengthy content.
- **Translate**: Translate text seamlessly into multiple languages.
- **Suggestions**: Use AI-powered prompts for creative ideas, child-friendly explanations, example creation, and more.
- **Chat**: Engage in dynamic conversations with the built-in AI assistant.
- **Automatic Replacement**: Automatically replace selected text with the AI-generated text in text areas or editors (e.g., WordPress) for enhanced ease of use.
- **Keyboard Shortcuts**: 
  - Open the chat instantly using **Control + M** for quick interaction with the AI assistant.
  - Execute prompts directly in text areas or editable elements with **Control + J**.
  - Run custom recipes in text areas or editable elements with **Control + /**.
- **Customizable Menu**: The extension menu can be disabled from the settings for a cleaner browsing experience.

---

## Example Recipes

Below is an example of a recipe that demonstrates how Mórfosis can handle multi-step writing tasks effectively:

### Pizza Recipe Workflow

    ```text
    [command prompt="Create a section titled 'Ingredients' and list only the ingredients required to make a basic homemade pizza. Do not include preparation steps or additional context. Include the subtitle as part of the output." systemPrompt="You are a professional chef specializing in Italian cuisine. Provide a clear, concise list of ingredients." lookBack="false"]
    [command prompt="Create a section titled 'Preparation' and describe the step-by-step preparation process for making a homemade pizza using only the ingredients provided above. Avoid listing ingredients again. Include the subtitle as part of the output." systemPrompt="You are a professional chef specializing in Italian cuisine. Focus solely on preparation steps based on the previous content." lookBack="true"]
    [command prompt="Create a section titled 'Recommendations' and provide tips and tricks for improving the process or enhancing the pizza's flavor based on the ingredients and preparation steps above. Avoid repeating steps or ingredients. Include the subtitle as part of the output." systemPrompt="You are a professional chef specializing in Italian cuisine. Offer concise, practical advice specific to this recipe." lookBack="true"]
    ```

---

If you have any suggestions or encounter issues, feel free to open an issue on the repository. Enjoy transforming your writing with Mórfosis!
