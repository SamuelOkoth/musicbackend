import  Express  from "express";
import cors from "cors";
import jwt from 'jsonwebtoken';
import bodyParser from "body-parser";
import  config  from "./src/db/config.js";
import userRoutes from "./src/Routes/userRoutes.js";



const app = Express();


app.use(Express.json());
app.use(cors({
    origin:'http://localhost:5173',
    credentials: true
}));
app.use(bodyParser.json());
app.use(Express.urlencoded({ extended : true }));


app.use((req, res, next) => {
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
        jwt.verify(req.headers.authorization.split(' ')[1], config.jwt_secret, (err, decode) => {
            if (err) req.user = undefined;
            req.user = decode;
            next();
        
        
    });
} else {
    req.user = undefined;
    next();
    }
});

userRoutes(app);


app.get("/", (req, res) => {
    res.send("Welcome");
});



app.listen(config.port,()=> {

    console.log(`Server is running on ${config.url}`);
})