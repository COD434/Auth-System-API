import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";


const swaggerDefinition={
openapi:"3.0.0",
info:{
title:"Secure API",
version:"1.0.0",
description:"This is Documentatio for  my secure API which is JWT-based and uses toen bucket algorithm for  ratelimiting"
},
servers:[{
url:"http://localhost:3000",
description:"Development server",
},
],
components:{
securitySchemes:{
bearerAuth:{
type:"http",
scheme:"bearer",
bearerFormat:"JWT"
   }
  }
},
security:[{bearerAuth:[]}]
}
const options={
swaggerDefinition,
apis:["../script.ts",".../routes/*.ts",".../Controllers/*.ts"]
}

export const swaggerSpec = swaggerJSDoc(options);
export const swaggerUihandler= swaggerUI

