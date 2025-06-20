import mongoose from "mongoose";

const configDb = async () => {
    try{
       await mongoose.connect(process.env.DATABASE_URL)
       console.log("Database connection successful!")
    }catch(error){
        console.error(error.message);
        process.exit(1);
    }
}

export default configDb