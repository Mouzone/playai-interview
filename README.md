## How to Run the App
To access and run the app, simply visit [this link](https://playai-interview.vercel.app/).

## Technologies Used
- **NextJS**: For frontend development and deployment.
- **react-pdf & pdfjs-dist**: For handling PDF files within the app.
- **Tailwind**: For styling and ensuring a responsive design.
- **Vercel**: For hosting and deploying the application.

## Design Decisions
- **NextJS for Frontend**: Chosen for its rapid deployment capabilities and familiarity.
- **API Routing with NextJS**: Initially planned to integrate Firebase Auth for endpoint protection, though not implemented due to time constraints.
- **State Management**: Implemented timeouts on state changes to prevent race conditions and ensure smooth user interactions during voice generation and page transitions.
- **Code Refactoring**: Conducted a major refactor to enhance code readability, modularity, and maintainability by breaking down the code into separate components.
- **User Interface**: Opted for a minimalist approach, deciding against adding a progress bar to keep the interface clean and straightforward.
- **Future Enhancements**: If time permitted, chat feature would have been added in the bottom right corner, allowing users to interact with an AI agent about the uploaded text by enlarging the interface.
