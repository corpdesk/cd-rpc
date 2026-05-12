import { ClassRef } from '../i-base';

export function classDecorator(constructor: ClassRef) {
    console.log(`constructor : ${constructor}`);
}

export function propertyDecorator(
    target: any,
    propertyKey: string
) {
    console.log('propertyDecorator called');
}

export function methodDecorator(
    target: any,
    methodName: string,
    descriptor?: PropertyDescriptor) {
    console.log('propertyDecorator called');
}

export function parameterDecorator(
    target: any,
    methodName: string,
    parameterIndex: number) {
    console.log('propertyDecorator called');
}

// function decoratorFactory(name: string) {
//     return (constructor: ClassRef) => {
//         console.log(`decorator function called with : ${name}`);
//     }
// }

export function IsUnique(
    target: any,
    propertyKey: string
) {
    console.log('IsUnique called');
    console.log(`target: ${JSON.stringify(target)}, propertyKey: ${propertyKey}`);
    console.log(`target : ${target}`);
    console.log(`target.constructor : ${target.constructor}`);
    console.log(`propertyName : ${propertyKey}`);
    console.log(`target.user_name: ${JSON.stringify(target.user_name)}`);
}

export function CdModel(constructor: ClassRef) {
    console.log(`constructor : ${constructor}`);
}

function decoratorFactory<T>(model: T) {
    return (constructor: ClassRef) => {
        console.log(`decorator function called with : ${model}`);
    }
}

function noDuplicates(target: any,
    methodName: string,
    descriptor?: PropertyDescriptor) {
    const originalFunction = target[methodName];
    const auditFunction = function (this: any) {
        console.log(`1. auditLogDec : overide of `
            + ` ${methodName} called`);
        for (let i = 0; i < arguments.length; i++) {
            console.log(`2. arg : ${i} = ${arguments[i]}`);
        }
        originalFunction.apply(this, arguments);
    }
    target[methodName] = auditFunction;
    return target;
}