const express=require('express');
const app=express();
app.get('/',(req,res)=>res.send('Minecraft AFK bot is running'));
const port=process.env.PORT || 3000;
app.listen(port,()=>console.log('Health server on '+port));
