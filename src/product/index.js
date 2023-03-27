exports.handler = async function(event) {
    try {
        console.log("requset:", JSON.stringify(event, undefined, 2))
        return {
            statusCode: 200,
            headers: {"Content-Type": "text-plain"},
            body: `Hello from lambda! You've hit ${event.path}\n`
        }
    } catch (error) {
        console.log(error)
    }
    
}