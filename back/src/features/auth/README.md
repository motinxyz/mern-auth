# Authentication Feature

This feature handles all logic related to user authentication, including registration and login.

## Core Components

*   **`auth.router.js`**: Defines the public API endpoints for this feature, such as `/register` and `/login`. It also contains the OpenAPI/Swagger documentation for these endpoints.
*   **`auth.controller.js`**: Connects the HTTP layer to the business logic. It parses the request, calls the appropriate service method, and formats the `ApiResponse`.
*   **`auth.service.js`**: Contains the core business logic for user authentication. It interacts with the `User` model to create new users and verify credentials.
*   **`auth.validators.js`**: Defines the `express-validator` rules to ensure that incoming data for registration and login is valid (e.g., valid email format, strong password).

## Business Rules

-   A user must register with a unique email address.
-   Passwords are hashed using bcrypt before being stored in the database.
