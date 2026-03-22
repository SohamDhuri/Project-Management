import { clerkClient } from "@clerk/express";
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "my-app" });

//Inngest function to save user data to the database
const syncUserCreation = inngest.createFunction(
    {id : 'sync-user-from-clerk'},
    {event: 'clerk/user.created'},
    async ({event}) =>{
        const {data} = event
        await prisma.user.create({
            data : {
                id : data.id,
                email : data?.email_addresses[0]?.email_address,
                name : data?.first_name +" "+ data?.last_name,
                image : data?.image_url,
            }
        })
    }
)

//Inngest function to delete a user from database
const syncUserDeletion = inngest.createFunction(
    {id : 'delete-user-from-clerk'},
    {event: 'clerk/user.deleted'},
    async ({event}) =>{
        const {data} = event
        await prisma.user.delete({
            where: {
                id: data.id,
            }
        })
    }
)

//Inngest function to update the user data
const syncUserUpdation = inngest.createFunction(
    {id : 'update-user-from-clerk'},
    {event: 'clerk/user.updated'},
    async ({event}) =>{
        const {data} = event
        await prisma.user.update({
            where: {
                id : data.id
            },
            data : {
                email : data?.email_addresses[0]?.email_address,
                name : data?.first_name +" "+ data?.last_name,
                image : data?.image_url,
            }
        })
    }
)


export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation
];