const express = require('express')
const app = express()
const bodyParser = require('body-parser')
var shortid = require('shortid')
const cors = require('cors')

const mongoose = require('mongoose')
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});
 

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
//app.use(bodyParser.json())     
   
  
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


var usernameSchema = mongoose.Schema({
  username:{type:String, unique:true},
  id: {type:String, default:shortid.generate}
})

var Username = mongoose.model("Username", usernameSchema)

app.post("/api/exercise/new-user",function(req, res, next){ 
  var username = req.body.username;    
  Username.findOne({username:username}, function(err, username){
    if(err){   
      throw next(err)  
    }  
    if(username){ 
      res.send("username already taken")   
    } 
    else{
      var User = new Username({username:req.body.username, id:shortid.generate()})
      User.save() 
      .then(user=> { 
        res.json({username: user.username, _id:user.id})
      })
      .catch(err => {
        res.status(400).send("Unable to send username to database")
    })
    }
  })  
})   

var ExerciseSchema = mongoose.Schema({
  username:{type:String, unique:true},
  id:{type:String, unique:true, required:true},
  description:{type:String, required:true},
  duration:{type:Number, required:true},  
  date:{type:String}    
}) 
   
var exerciseCollection = mongoose.model("exerciseCollection", ExerciseSchema)

app.post("/api/exercise/add", function(req, res){ 
  var userid = req.body.userId; 
  var description = req.body.description;  
  var duration = req.body.duration; 
  var date = req.body.date || Date();  
  
  var Xmills = Date.parse(date)
  console.log(Xmills)
  
  var d = new Date(Xmills)
  
  let x = d.toDateString();
  console.log(x) 
         
  if(!description){    
    res.send("Path `description` is required.") 
  }
  if(!duration){  
     res.send("Path `duration` is required.")
  }
  else{  
    
    exerciseCollection.findOne({id:userid}, function(err, exercise){
      if(err){
        throw err  
      }    
      if(exercise){    
        
        exercise.description = description;
        exercise.duration = duration;
        exercise.date = x;
        
        exercise.save()
        .then(exe => {
          
          res.json({username:exe.username,description:exe.description,
          duration: exe.duration, _id: exe.id,date:exe.date})          
        })
        .catch(err=>{ 
          res.status(400).send("couldn't update exercise")
        })
        
      }   
    })   
           
    
    Username.findOne({id:userid}, function(err, userdoc){
      if(err){
        throw err
      }   
      if(userdoc){    
        //console.log(userdoc)
        var exercise = new exerciseCollection({
          username:userdoc.username,
          description: description,
          duration: duration,
          id: userdoc.id,
          date: x
        })   
         
        exercise.save()  
        .then(exer=> {  
        res.json({username:exer.username, description:exer.description,
        duration: exer.duration, _id: exer.id, date:exer.date})  
      })    
       
    }     
    else{
        res.send("unknown _id") 
    }
    })            
  }
})
     

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => { 
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error  
    errMessage = err.errors[keys[0]].message
  } else { 
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage) 
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
