import mongoose, { PopulateOptions } from 'mongoose'

export type Sort = Record<string, 1 | -1>
export type Query = Record<string, any>
export type Projection = Record<string, 1 | 0>
export type Populate = string | string[] | PopulateOptions | PopulateOptions[]
export type ListQueryOptions = {
    fields?: string[]

    limit?: number
    sort?: Sort
    populate?: Populate

    many?: boolean // return many ? Document : Document[] 
    strict?: boolean // projection = strict ? {_id: 1} : ... 
}
export type PushResult<M> = mongoose.HydratedDocument<M, {}, {}>