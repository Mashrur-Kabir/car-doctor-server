/*
in server:
install jsonwebtoken
jwt.sign
generate secret and store that in env file

in client:
import jwt from 'jsonwebtoken';
post user (currently logged in) to server


set cookie in the client side via Http Only Cookie:
    -install express cookie parser in server side first
    -express set cookies; and then set the token (generated in the AUTH post api in index.js) in it and send it via res.send
    -to set in client side- cors setting ion the server, axios settings in client side


whole process: 

- User logs in*

Requesting a Token:

After the user logs in successfully, the frontend sends the user's email to the backend (server) using an axios.post request to http://localhost:5000/jwt.
The withCredentials: true option ensures cookies (containing sensitive info like the token) can be sent and received securely.

in Backend (Server-Side):

-Receiving the Email:
The backend gets the user's email from the request body (req.body.email).

-Generating a Token:
The backend creates a JWT (token) using the user's email as the payload and a secret key stored in the .env file.
The token will expire in 1 hour (expiresIn: '1h').

-Setting the Token in a Cookie:
The token is sent back to the client as a cookie (using res.cookie()).
The cookie is:
    httpOnly: Prevents access from JavaScript (for security).
    secure: False here because you’re in development (will be true in production for HTTPS).
    sameSite: 'none': Allows the client (localhost:5173) and server (localhost:5000) to communicate.

-Response Sent:
The backend responds with { success: true } to confirm the token was sent and saved in the cookie.

End Result
The user is now logged in, and the JWT token is stored in their browser as a cookie.
This token can be used later to verify their identity when they interact with other secure APIs.

*/