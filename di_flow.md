# Explanation of Refactoring: AuthService and Dependency Injection

This document explains the refactoring process applied to the authentication service (`auth.service.js`) and its related components (`auth.controller.js`, `auth.service.test.js`, `auth.controller.test.js`) to improve modularity, testability, and adherence to modern software engineering standards.

## The Original Problem

Initially, the `auth.service.js` file contained standalone functions (`registerNewUser`, `verifyUserEmail`) that directly imported their dependencies (e.g., `logger`, `redisConnection`, `t` from `@auth/config`). This approach led to several issues:

1.  **Tight Coupling**: The service functions were tightly coupled to their specific implementations of `logger`, `redisConnection`, and `t`. This made it difficult to swap out implementations or test the service in isolation.
2.  **Difficult Testing**: Mocking these direct imports in unit tests was cumbersome and often led to complex mocking setups (as seen in the initial test failures). It required extensive use of `vi.mock` at the module level, which can be fragile.
3.  **Lack of Scalability/Maintainability**: As the application grows, managing dependencies for numerous standalone functions becomes challenging. It hinders the ability to easily extend or modify the service without impacting other parts of the system.

## The Solution: Class-Based AuthService with Dependency Injection

To address these issues, the `auth.service.js` was refactored into a class-based `AuthService` that utilizes **Dependency Injection (DI)**.

### Phase 1: Refactor `auth.service.js`

1.  **`AuthService` Class**: The standalone functions `registerNewUser` and `verifyUserEmail` were converted into methods of a new `AuthService` class.
    *   **Benefit**: This groups related logic into a cohesive unit, improving code organization and readability.

2.  **Dependency Injection via Constructor**: Instead of importing `logger`, `redisConnection`, and `t` directly within the module, these dependencies are now passed into the `AuthService`'s constructor.
    *   **Benefit**: This decouples the `AuthService` from its concrete implementations. The service now declares *what* it needs (a logger, a Redis connection, a translation function) rather than *how* to get them. This makes the service much more flexible and testable.

3.  **Refined Method Signatures**: The `registerNewUser` method's signature was updated from `(userData, req)` to `(userData, locale)`.
    *   **Benefit**: This further decouples the service from the Express `req` object, making it framework-agnostic and reusable in different contexts (e.g., a CLI command, a background job) without needing the full HTTP request object.

### Phase 2: Update Controller and Tests

With `AuthService` refactored, the components that use it needed to be updated.

1.  **`auth.controller.js` Update**:
    *   The controller now imports the `AuthService` class.
    *   It then instantiates `AuthService` at the module level, providing the necessary dependencies (`logger`, `redisConnection`, `t`) imported from `@auth/config`.
    *   The `registerUser` and `verifyEmail` controller functions now call the corresponding methods on this `authService` instance (e.g., `authService.registerNewUser(req.body, req.locale)`).
    *   **Benefit**: The controller's responsibility is now clearly defined: handle HTTP requests, extract necessary data, and delegate business logic to the `AuthService`.

2.  **`auth.service.test.js` Update**:
    *   The test file was updated to import the `AuthService` class.
    *   In the `beforeEach` block, mock versions of `logger`, `redisConnection`, and `t` are created.
    *   An instance of `AuthService` is then created using these mocks (`authService = new AuthService({ logger: mockLogger, redisConnection: mockRedisConnection, t: mockT });`).
    *   **Benefit**: Tests are now simpler and more focused. We can easily control the behavior of `AuthService`'s dependencies by manipulating the mocks, ensuring that only the service's logic is being tested.

3.  **`auth.controller.test.js` Update**:
    *   This was the most challenging part due to how Vitest handles module-level instantiation and mocking.
    *   The `vi.mock('./auth.service.js', ...)` was updated to correctly mock the `AuthService` class as a constructor. This involved creating a `mockAuthServiceInstance` outside the mock and then using `vi.fn().mockImplementation(function() { this.method = mockAuthServiceInstance.method; })` to ensure that when `new AuthService()` is called in `auth.controller.js`, it receives an instance with the mocked methods.
    *   The `registerUser` and `verifyEmail` functions were imported *after* the `vi.doMock` block to ensure the mock was applied before the controller module was loaded.
    *   **Benefit**: The controller tests can now verify that the controller correctly interacts with the `AuthService` (e.g., calls the right methods with the right arguments) without relying on the actual service implementation.

### Error Resolution during the process

1.  **`SyntaxError: The requested module ' @auth/utils' does not provide an export named 'httpStatusCodes'`**:
    *   **Cause**: `auth.service.js` was attempting to import `httpStatusCodes` as a named export, but the `packages/utils/src/constants/httpStatusCodes.js` file actually exports it as `HTTP_STATUS_CODES`.
    *   **Resolution**: Changed the import statement in `auth.service.js` from `httpStatusCodes` to `HTTP_STATUS_CODES`.

2.  **`AssertionError: expected "vi.fn()" to be called with arguments: [ ... ]` in `auth.service.test.js`**:
    *   **Cause**: The test expected `mockRedisConnection.set` to be called with `"true"` as the value, but the actual `REDIS_RATE_LIMIT_VALUE` constant was `"1"`.
    *   **Resolution**: Updated the test expectation to use `"1"` instead of `"true"`.

3.  **`TypeError: () => mockAuthServiceInstance is not a constructor` in `auth.controller.test.js`**:
    *   **Cause**: This was a persistent issue related to correctly mocking a class that is instantiated at the module level. The initial `vi.mock` setup was not providing a proper constructor function that could be called with `new`.
    *   **Resolution**: The `vi.mock` for `auth.service.js` was refined to use `vi.fn().mockImplementation(function() { ... })`. This ensures that when `new AuthService()` is called in `auth.controller.js`, it correctly receives an instance whose methods are controlled by our mocks. Additionally, `vi.doMock` was used, and the controller functions were imported *after* the mock definition to guarantee the mock was applied correctly.

## Conclusion

By refactoring `AuthService` to a class with dependency injection and updating its consumers and tests accordingly, the authentication module is now more modular, easier to test, and better positioned for future scalability and maintenance. The explicit management of dependencies makes the code's structure clearer and reduces hidden complexities.
