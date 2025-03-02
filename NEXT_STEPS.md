# Next Steps

## Bugs

## Shortcomings

## Feature Requests

- A dark mode would be nice to have.
- The design of the app is not how I want it. From login dialot, over question list, to question details and many other pages, the size in the browser window keeps changing, depending on the number of menu entries or other size-defining components. Instead, I would like to have the app centered on screen, and ideally so that a large enough area defines the maximum size it can take. One suggested way of cleaning up the menus might be a "three bars burger menu" icon that comprises them all, e.g. by an opening/closing left sidebar menu.

## Additions

- Create documentation pages for faculty and students describing the usage of the system. Those can be markdown files referenced from the README.md. There can be placeholders where I can later insert fitting screenshots.

### Near Term

### Long Term

I would like to have a bot implemented that will interact with the Question Writing System. It should be implemented as an agentic AI system in LangGraph as follows:

- The bot has a web app frontend.
- Login to the bot should use the same user base as the MCQ system.
- In the frontend, a PDF or Word document can be uploaded.
- The bot uses a LLM to extract one or more questions pertaining to the content of the uploaded document.
- The bot uses a LLM to create two to four possible answers for each question, where always at least one is the correct answer.
- The bot takes care that the Questions/Answer set is challenging, yet entertaining. Answers should not be obvious by being funny or absurd when wrong.
- The bot then adds the set of new Questions/Answers to the MCQ system under the login given.
