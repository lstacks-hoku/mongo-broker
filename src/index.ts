import mongoose from 'mongoose'
import {
    Query, 
    ListQueryOptions, 
    PushResult, 
    Projection, 
    Populate
} from './types'

export interface IMongoBroker<D, M> {
    model: mongoose.Model<M>
    isExist(q: Query): Promise<boolean>

    getWhere(q: Query, options?: ListQueryOptions & {many?: false}): Promise<D | null> // findOne()
    getWhere(q: Query, options?: ListQueryOptions & {many: true}): Promise<D[] | null> // find()
    getWhere<T extends D | D[]>(q: Query, options?: ListQueryOptions & {many?: boolean}): Promise<T | null> // General declaration

    push(q: Query[]): Promise<PushResult<M> | PushResult<M>[]>
    delete(q: Query[]): Promise<any> 

}
export class MongoBroker<D, M> implements IMongoBroker<D, M>{
    model: mongoose.Model<M>
    constructor(modelName: string, schema: mongoose.Schema){
        this.model = mongoose
            .model<M>(modelName, schema)
    }

    public async isExist(q: Query): Promise<boolean> {
        return !!await this
            .getWhere(q, {fields: ['_id']})
    }

    // Decorate find & findOne
    public getWhere<T extends D | D[]>(
        q: Query, 
        options?: ListQueryOptions & {many?: boolean}
    ): Promise<T | null> {
        const {limit, sort, populate, many} = options || {}

        // # Options
        const o = {limit, sort}

        // # Auto projection
        const p: Projection = this._getProjectionFrom(options)
        
        const fx: Function = !many 
            ? this.model.findOne
            : this.model.find

        return fx.bind(this.model)(q, p, o)
            .populate(populate || [])
            .lean() 
    }
    public push(...q: Query[]): Promise<PushResult<M> | PushResult<M>[]> {
        const single = q.length == 1
        return single 
            ? this.model.create(q[0]) 
            : this.model.create(q)
    }
    public delete(...q: Query[]): Promise<any> {
        const acc: Promise<any>[] = [] 
        for(const filter of q){
            const action = this.model.deleteOne(filter).exec()
            acc.push(action)
        }
        return Promise.all(acc)
    }
    private _getProjectionFrom(options?: ListQueryOptions): Projection {
        const {fields, populate} = options || {}
        if(!fields?.length) return {}
       
        // # Dict
        let p: Projection = {}

        // # Set
        const addToProjection = (q: string | Populate): Projection => {
            
            // # Population parse
            if(typeof q == 'object' && 'path' in q) return addToProjection(q.path)

            // # Ignore other objects
            if(typeof q != 'string') return p

            p[q as string] = 1
            return p
        }

        // # Fields 
        for(const field of fields){
            addToProjection(field)
        }
        
        // # Need to show populated fields
        if(populate) {
            const isArrayPopulate = populate instanceof Array

            if(!isArrayPopulate) return addToProjection(populate)

            for(const populateQuery of populate){
                addToProjection(populateQuery)
            }
        }
        return p
    }
}