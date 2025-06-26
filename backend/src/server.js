import express from "express"; 
import "dotenv/config"; 

const app = express(); 
const PORT = process.env.PORT || 5001; 


app.get("api/helth", (req, res) => { 
    res.status(200).jso({ success: true })
})

app.listen(PORT, () => {
    console.log("Server is running on PORT: 5001");
});
