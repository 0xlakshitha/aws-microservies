import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SwnApiGatewayProps {
    productMicroservice: IFunction,
    basketMicroservice: IFunction
    orderMicroservice: IFunction
}

export class SwnApiGateway extends Construct {

    constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
        super(scope, id)

        this.createProductApi(props.productMicroservice)
        this.createBasketApi(props.basketMicroservice)
        this.createOrderApi(props.orderMicroservice)

    }

    private createProductApi(productMicroservice: IFunction) {
        // Product micrservices API GATEWAY
        // root name = product
        // GET /product
        // POST /product
        
        // Single product with id parameter
        // GET /product/{id}
        // PUT /product/{id}
        // DELETE /product/{id}

        const apigw = new LambdaRestApi(this, 'productApi', {
            restApiName: 'Product Service',
            handler: productMicroservice,
            proxy: false
        })
  
        const product = apigw.root.addResource('product')
        product.addMethod('GET')
        product.addMethod('POST')
    
        const singleProduct = product.addResource('{id}')
        singleProduct.addMethod('GET')
        singleProduct.addMethod('PUT')
        singleProduct.addMethod('DELETE')
    }

    private createBasketApi(basketMicroservice: IFunction) {
        // Basket micrservices API GATEWAY
        // root name = basket
        // GET /basket
        // POST /basket
        
        // resource name = basket/{username}
        // GET /basket/{username}
        // PUT /basket/{username}
        // DELETE /basket/{username}

        // POST /basket/checkout

        const apigw = new LambdaRestApi(this, 'basketApi', {
            restApiName: 'Basket Service',
            handler: basketMicroservice,
            proxy: false
        })
  
        const basket = apigw.root.addResource('basket')
        basket.addMethod('GET')
        basket.addMethod('POST')
    
        const singleBasket = basket.addResource('{username}')
        singleBasket.addMethod('GET')
        singleBasket.addMethod('DELETE')

        const basketCheckout = basket.addResource('checkout')
        basketCheckout.addMethod('POST')
    }

    private createOrderApi(orderMicroservice: IFunction) {
        // Order micrservices API GATEWAY
        // root name = order
        // GET /order
        // GET /order/{username}
        // expected request : xxx/order/swn?orderDate=timestamp
        // ordering ms grap input and query parameters and fileter to dynamo db
        const apigw = new LambdaRestApi(this, 'orderApi', {
            restApiName: 'Order Service',
            handler: orderMicroservice,
            proxy: false
        })
  
        const order = apigw.root.addResource('order')
        order.addMethod('GET')
    
        const singleOrder = order.addResource('{username}')
        singleOrder.addMethod('GET')
    }

    
}