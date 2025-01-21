const express = require("express");
const cors = require("cors");
require("dotenv").config(); // for username, and password  
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.dwhia.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carDoctor').collection('services')
    const bookingCollection = client.db('carDoctor').collection('bookings');

    // Perform actions on the 
    
    //SERVICES
    // find all services
    app.get('/services', async(req, res) => {
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
    app.get('/bookings', async(req, res) => {
        console.log(req.query.email);
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
// POST /bookings: Inserts a new booking into the bookings collection.
// Middleware:

// cors for cross-origin requests.
// express.json() to parse incoming JSON payloads.
// Environment Variables:

// Secured sensitive database credentials using .env.
// MongoDB Query Optimization:

// Use of projections in /services/:id to limit the returned fields.