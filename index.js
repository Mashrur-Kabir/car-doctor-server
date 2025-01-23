const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser')
require("dotenv").config(); // for username, and password  
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

const corsOption = {
    origin: ['http://localhost:5173', ['http://localhost:5174']],
    credentials: true
}
/*
Setting credentials: true in the CORS options is important because it allows the server to accept cookies, authorization headers, or other credentials (like JWT tokens) from the client when making cross-origin requests.
Without credentials: true, the browser will block these sensitive pieces of data from being sent to the server, which would break features like authentication or session management.
*/

//middleware
app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.dwhia.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares
const logger = async(req, res, next) => {
  console.log('called', req.host, req.originalUrl)
  next();
}

const verifyToken = async(req, res, next) => { //use it to secure webpages via token
  const token = req.cookies?.token;
  console.log("value of token in middleware: ", token)
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=> {
    if (err) {
        return res.status(403).json({ message: 'Access denied. Invalid token.' });
    }
    // if token is valid then it would be decoded
    console.log('value in the token: ', decoded);
    req.user = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carDoctor').collection('services')
    const bookingCollection = client.db('carDoctor').collection('bookings');

    // Perform actions on the 
    
    //SERVICES
    // find all services
    app.get('/services', logger, async(req, res) => {
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.json(result);
    })

    // find a specific service and set service with only needed information according to the need of frontend component (checkout page)
    app.get('/services/:id', async(req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }

        const options = {
            // include only fields with '1' in the returned document
            projection: { title: 1, description: 1, price: 1, service_id: 1, img: 1  }
        }

        const result = await serviceCollection.findOne(query, options);
        res.send(result); // will send query with selected options{} to localhost:5000/services/678f4e3e97cf98481a9c4467
 
        // because the 'book' we had clicked on a specific card on services component in homepage will send an id(678f4e3e97cf98481a9c4467) along with redirecting you to the checkout page
        // hence you are getting entire object of information about the card. this will help find info (options{} is used since all of it might not be necessary) specific to that card in case you want to book it
    })

    //BOOKINGS
    // post users booking information from Checkout component
    app.post('/bookings', async(req, res) => {
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
    });
    
    //get booking details of user who is logged in to show it in booking component
    app.get('/bookings', verifyToken, async(req, res) => {
        console.log(req.query.email);
        //console.log('tokens received: ', req.cookies.token);
        console.log('user in the valid token', req.user)
        if (req.query.email !== req.user.email) {
            return res.status(403).json({message: 'Forbidden Access!'});
        }
        let query = {};
        if(req.query?.email){
            query = { email: req.query.email }
        }
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
    })

    //delete booking details
    app.delete('/bookings/:id', async(req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await bookingCollection.deleteOne(query);
        res.send(result);
    });

    //update booking details
    app.patch('/bookings/:id', async(req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedBooking = req.body; // "pending" will store here
        console.log(updatedBooking);
        const updateDoc = {
            $set: {
                status: updatedBooking.status,
            }
        }
        const result = await bookingCollection.updateOne(filter, updateDoc);
        res.send(result);
    })

    //AUTH APIs
    // login
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      console.log(user); // you will get the email here sent from the login component after successful login
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'}) //generating token. user is the payload here, and we need to generate secret and store in the .env file
      
      res.cookie('token', token, { // setting token in the cookie
          httpOnly: true,
          //secure: false,
          //sameSite: 'none', // because client is in localhost 5173 and server is in localhost 5000
          maxAge: 3600000 // 1 hour in milliseconds
      })
      res.send({success: true, token});
  });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('carDoctor server is running');
})

app.listen(port, () => {
    console.log(`carDoctor server is running on port ${port}`);
});

// Database Setup:
// Connected to a MongoDB Atlas database using the MongoClient and secure .env credentials.

// Endpoints:
// GET /services: Fetches all services from the services collection.
// GET /services/:id: Fetches a specific service with a filtered projection.
// POST /bookings: Inserts a new booking into the bookings collection....
//....etc

// Middleware:
// cors for cross-origin requests.
// express.json() to parse incoming JSON payloads.

// Environment Variables:
// Secured sensitive database credentials using .env.

// MongoDB Query Optimization:
// Use of projections in /services/:id to limit the returned fields.

/*
verifyToken Middleware in get booking api:

This checks if the client has sent a valid JWT token via cookies.
If no token is found, it sends a 401 Unauthorized response.
If the token is invalid, it sends a 403 Forbidden response.
If the token is valid, it decodes the token (to extract user info) and attaches it to req.user, then proceeds to the next handler.
/bookings Route:

Protected by verifyToken, so only users with valid tokens can access it.
Extracts the user's email from req.query.email (sent in the request) and compares it with the email from the token (req.user.email).
If they don’t match, it sends a 403 Forbidden response.
If they match, it queries the bookingCollection database for bookings matching the email and sends the results as the response.

*/

