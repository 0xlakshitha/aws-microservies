import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { ddbClient } from "./ddbClient"

exports.handler = async function(event) {
    try {
        console.log("requset:", JSON.stringify(event, undefined, 2))

        let body

        // switch case event.httpmethod to perform CRUD operations with using ddbClient object 
        switch (event.httpMethod) {
            case "GET":
                if (event.pathParameters != null){
                    body = await getBasket(event.pathParameters.username)
                }
                else {
                    body = await getAllBaskets()
                }
                break
            case "POST":
                if (event.path == "/basket/checkout") {
                    body = await checkoutBasket(event)
                }
                else {
                    body = await createBasket(event)
                }
                break
            case "DELETE":
                body = await deleteBasket(event.pathParameters.username)
                break
            default: 
                throw new Error(`Unsupported route: "${event.httpMethod}`)
        }
        
        console.log(body)
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully finished operation: "${event.httpMethod}"`,
                body: body
            })
        } 
        
    } catch (e) {
        console.error.apply(e)
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform operation",
                errorMsg: e.message,
                errorStack: e.stack
            })
        }
    }
}


const getBasket = async (username) => {

    console.log('getBasket')

    try {
        
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ username: username })
        }

        const { Item } = await ddbClient.send(new GetItemCommand(params))

        console.log(Item)
        return (Item) ? unmarshall(Item) : {}

    } catch (e) {
        console.error(e)
        throw e
    }
}


const getAllBaskets = async () => {

    console.log('getAllBaskets')

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME
        }

        const   { Items } = await ddbClient.send(new ScanCommand(params))

        console.log(Items)
        return (Items) ? Items.map((item) => unmarshall(item)) : {}

    } catch (e) {
        console.error(e)
        throw e
    }
}


const createBasket = async (event) => {

    console.log(`createBasket function. event : "${event}"`)

    try {

        const basketRequest = JSON.parse(event.body)
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(basketRequest || {})
        }

        const createdResult = await ddbClient.send(new PutItemCommand(params))

        console.log(createdResult)
        return createdResult
        
    } catch (e) {
        console.error(e)
        throw e
    }
}


const deleteBasket = async (username) => {

    console.log(`deleteProduct function. product : "${username}"`)

    try {

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ username: username })
        }

        const deletedResult = await ddbClient.send(new DeleteItemCommand(params))

        console.log(deletedResult)
        return deletedResult
        
    } catch (e) {
        console.error(e)
        throw e
    }
}


const checkoutBasket = async (event) => {
    try {
        
    } catch (e) {
        console.error(e)
        throw e
    }
}