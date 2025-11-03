======================================================================
                        ENTIRE APPLICATION FLOW
======================================================================

[ HTTP Request ]  (e.g., POST /api/v1/auth/register with JSON body)
      |
      v
[ Express App (app.js) ]
      |
      |--> [ Global Middleware ] (cors, express.json(), morgan, etc.)
      |
      v
[ API Router (e.g., /api/v1) ]
      |
      v
[ Feature Router (e.g., auth.routes.js) ]
      |
      |  (Matches 'POST /register' to a controller function)
      |
      v
[ Controller (auth.controller.js) ]
      |
      |  (Calls `authService.register(req.body)`)
      |
      v
[ Service (auth.service.js) ]
      |
      |  (Business logic: check if user exists, hash password, etc.)
      |  (Calls `User.create(userData)`)
      |
      v
[ Mongoose Model (user.model.js) ]
      |
      |  (Interacts with MongoDB via Mongoose methods)
      |
      |----------------------------------------------------.
      |                                                    |
      v (Success)                                          v (Error)
[ Document is created/found/updated in DB ]          [ DB Error (e.g., duplicate key) ]
      |                                              [ Validation Error (from Mongoose) ]
      | (Returns data to Service)                    [ Other DB-related errors ]
      |                                                    |
      v                                                    v
[ Service returns data to Controller ]               [ Promise rejects, error is caught ]
      |                                                    |
      v                                                    v
[ Controller sends success response ]                [ Controller calls next(error) ]
      |                                                    |
      |  (e.g., new ApiResponse(201, user).send(res))      |
      |                                                    v
      '---------------------.             [ Global Error Handler (errorHandler.js) ]
                           |                              |
                           v                              | (See Detailed Error Flow below)
                            |                              |
                            v                              v
                      [ JSON Response ] <------------------'


======================================================================
                        DETAILED ERROR FLOW
======================================================================

[ Error passed to next(error) ]
     |
     v
[ Global Error Handler (errorHandler.js) ]
     |
     |--> Is it a DB duplicate key error (code 11000)? -> Convert to ApiError (409 Conflict)
     |
     |--> Is it a Mongoose validation error? -> Convert to ApiError (400 Bad Request) with details
     |
     |--> Is it already an ApiError? -> Keep it as is
     |
     '--> Is it something else (an unexpected bug)? -> Wrap in a generic ApiError (500 Server Error)
           |
           v
[ All errors are now normalized into an ApiError object ]
     |
     |--> If (error.isOperational is true) -> Send detailed, user-friendly JSON error response
     |
     '--> If (error.isOperational is false) -> Log the full error stack for developers
           |                                  -> Send a generic "Something went wrong" JSON error response
           v
     [ JSON Response ]
