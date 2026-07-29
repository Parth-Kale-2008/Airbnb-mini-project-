const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");

main()
.then(()=>{
    console.log("connected to DB");
})
.catch((err)=>{
    console.log("error");
});
async function main(){
    await mongoose.connect(MONGO_URL);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

app.get("/",(req,res)=>{
    res.send("hi i am root");
});

const validateListing = (req,res,next) =>{
    let {error} = listingSchema.validate(req.body);
    console.log(result);
    if(error){
        let errMsg = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(404,errMsg);
    }else{
        next();
    }
}
// this is index route
app.get("/listings",wrapAsync(async (req,res)=>{
    const allListings =await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}));

app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs")
});

//this is show route
app.get("/listings/:id",wrapAsync(async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
}));

app.post("/listings",validateListing,wrapAsync(async (req,res,next)=>{
    let result = listingSchema.validate(req.body);
    console.log(result);
    //let{title,description,image,price,country,location} = req.body;
    const newListing = new Listing (req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res)=>{
    let {id} = req.params;
const listing = await Listing.findById(id);
res.render("listings/edit.ejs",{listing});
}));

//update route
app.put("/listings/:id",validateListing, async (req, res)=>{
let {id} = req.params;
await Listing.findByIdAndUpdate (id, { ...req.body.listing });
res.redirect(`/listings/${id}`);
});

//delete route
app.delete("/listings/:id", wrapAsync(async (req, res,next)=>{
let {id} = req.params;
let deletedListing = await Listing.findByIdAndDelete (id);
console.log(deletedListing);
res.redirect("/listings");
}));
// app.get("/testListing",async(req,res)=>{ 
//     let sampleListing = new Listing({
//         title:"New Villa",
//         description:"sea view,best sun set view",
//         price:1500,
//         location:"greater nicobar,Andaman Nicobar",
//         country:"India",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

app.all("/*splat", (req, res) => {
    res.send("Page Not Found");
});
app.use((err,req,res,next)=>{
    let{statusCode = 500,message="something went wrong"} = err;
    res.render("error.ejs",{message});
    //res.stauts(statusCode).send(message);
    //res.send("something went wrong");
});

app.listen(8080,()=>{
    console.log("server started"); 
});