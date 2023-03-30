import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import { PutEventsCommand } from "@aws-sdk/client-eventbridge"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { ddbClient } from "./ddbClient"
import { ebClient } from "./eventBridgeClient"

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
    console.log("Checkout Basket")

    try {
        
        const checkoutRequest = JSON.parse(event.body)

        if (checkoutRequest == null || checkoutRequest.username == null) {
            throw new Error(`username should exist in checkoutRequest: "${checkoutRequest}`)
        }

        // 1 Get existing basket with items
        const basket = await getBasket(checkoutRequest.username)

        // 2 create an event json object with basket items, calculate total price, prepare order create json data to send ordering microservice
        var checkoutPayload = prepareOrderPayload(checkoutRequest, basket)

        // 3 publish an event to eventbridge - this will subscribe by  order microservice
        const publishedEvent = await publishCheckoutBasketEvent(checkoutPayload)

        // 4 remove existing basket
        await deleteBasket(checkoutRequest.username)

    } catch (e) {
        console.error(e)
        throw e
    }
}


const prepareOrderPayload = (checkoutRequest, basket) => {
    console.log("prepareOrderPayload")

    // prepare order payload -> calculate totalprice and combine chekcout requestand aggregate and enrich requset and basket data in order to create order payload
    
    try {

        if (basket == null || basket.items == null) {
            throw new Error(`basket should exist in items: "${basket}"`)
        }

        let totalPrice = 0
        basket.items.forEach(item => totalPrice = totalPrice + item.price)
        checkoutRequest.totalPrice = totalPrice
        console.log(checkoutRequest)

        // copies all properties from basket into checkoutRequest
        Object.assign(checkoutRequest, basket)
        console.log("Success prepareOrderPayload, orderPaylaod:", checkoutRequest)

        return checkoutRequest
        
    } catch (e) {
        console.error(e)
        throw e
    }
}


const publishCheckoutBasketEvent = async (payload) => {
    console.log("publishCheckoutBasketEvent with payload: ", payload)

    try {
        
        const params = {
            Entries: [
                {
                    Source: process.env.EVENT_SOURCE,
                    Detail: JSON.stringify(payload),
                    DetailType: process.env.EVENT_DETAILTYPE,
                    Resources: [],
                    EventBusName: process.env.EVENT_BUSNAME
                }
            ]
        }

        const data = await ebClient.send(new PutEventsCommand(params))

        console.log("Success, event sent; requestId:", data)
        return data

    } catch (e) {
        console.error(e)
        throw e
    }
}