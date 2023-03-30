import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";


interface SwnMicroservicesProps {
    productTable: ITable,
    basketTable: ITable,
    orderTable: ITable
}


export class SwnMicroservices extends Construct {

    public readonly productMicroservice: NodejsFunction
    public readonly basketMicroservice: NodejsFunction
    public readonly orderMicroservice: NodejsFunction

    constructor(scope: Construct, id: string, props: SwnMicroservicesProps) {
        super(scope, id)

        this.productMicroservice = this.createProductFunction(props.productTable)
        this.basketMicroservice = this.createBasketFunction(props.basketTable)
        this.orderMicroservice = this.createOrderFunction(props.orderTable)

    }

    private createProductFunction(productTable: ITable): NodejsFunction {
        const nodejsFunctionProps: NodejsFunctionProps = {
          bundling: {
            externalModules: [
              'aws-sdk'
            ]
          },
          environment: {
            PRIMARY_KEY: 'id',
            DYNAMODB_TABLE_NAME: productTable.tableName
          },
          runtime: Runtime.NODEJS_18_X
        }
    
        const productFunction = new NodejsFunction(this, 'productLambdaFunction', {
          entry: join(__dirname, `/../src/product/index.js`),
          ...nodejsFunctionProps
        })
    
        productTable.grantReadWriteData(productFunction)

        return productFunction
    }

    private createBasketFunction(basketTable: ITable): NodejsFunction {
        const nodejsFunctionProps: NodejsFunctionProps = {
          bundling: {
            externalModules: [
              'aws-sdk'
            ]
          },
          environment: {
            PRIMARY_KEY: 'username',
            DYNAMODB_TABLE_NAME: basketTable.tableName,
            EVENT_SOURCE: 'com.swn.basket.checkoutbasket',
            EVENT_DETAILTYPE: 'CheckoutBasket',
            EVENT_BUSNAME: 'SwnEventBus'
          },
          runtime: Runtime.NODEJS_18_X
        }
    
        const basketFunction = new NodejsFunction(this, 'basketLambdaFunction', {
          entry: join(__dirname, `/../src/basket/index.js`),
          ...nodejsFunctionProps
        })
    
        basketTable.grantReadWriteData(basketFunction)

        return basketFunction
    }

    private createOrderFunction(orderTable: ITable): NodejsFunction {
      const nodejsFunctionProps: NodejsFunctionProps = {
        bundling: {
          externalModules: [
            'aws-sdk'
          ]
        },
        environment: {
          PRIMARY_KEY: 'username',
          SORT_KEY: 'orderdate',
          DYNAMODB_TABLE_NAME: orderTable.tableName
        },
        runtime: Runtime.NODEJS_18_X
      }
  
      const orderFunction = new NodejsFunction(this, 'orderLambdaFunction', {
        entry: join(__dirname, `/../src/ordering/index.js`),
        ...nodejsFunctionProps
      })
  
      orderTable.grantReadWriteData(orderFunction)

      return orderFunction
    }

}