import { TSBufferProto } from "tsbuffer-schema";
import { Encoder } from './encoder/Encoder';
import { TSBufferValidator } from 'tsbuffer-validator';
import { Decoder } from "./decoder/Decoder";

export class TSBuffer {

    protected _validator: TSBufferValidator;
    protected _encoder: Encoder;
    protected _decoder: Decoder;
    protected _proto: TSBufferProto;

    constructor(proto: TSBufferProto) {
        this._proto = proto;
        this._validator = new TSBufferValidator(proto);
        this._encoder = new Encoder(this._validator);
        this._decoder = new Decoder(this._validator);
    }

    /**
     * 编码
     * @param value 要编码的值
     * @param schemaId SchemaID，例如`a/b.ts`下的`Test`类型，其ID为`a/b/Test`
     * @param options.skipValidate 跳过编码前的验证步骤（不安全）
     */
    encode(value: any, schemaId: string, options?: {
        skipValidate?: boolean
    }) {
        let schema = this._proto[schemaId];
        if (!schema) {
            throw new Error(`Cannot find schema： ${schemaId}`)
        }

        if (!options || !options.skipValidate) {
            let vRes = this._validator.validateBySchema(value, schema);
            if (!vRes.isSucc) {
                throw new Error(`Invalid value: ${vRes.originalError.message}`)
            }
        }

        return this._encoder.encode(value, schema);
    }

    /**
     * 解码
     * @param buf 二进制数据
     * @param schemaId SchemaID，例如`a/b.ts`下的`Test`类型，其ID为`a/b/Test`
     * @param options.skipValidate 跳过解码后的验证步骤（不安全）
     */
    decode(buf: ArrayBuffer, schemaId: string, options?: {
        skipValidate?: boolean
    }): unknown {
        let schema = this._proto[schemaId];
        if (!schema) {
            throw new Error(`Cannot find schema: ${schemaId}`)
        }

        let value = this._decoder.decode(buf, schema)

        if (!options || !options.skipValidate) {
            let vRes = this._validator.validateBySchema(value, schema);
            if (!vRes.isSucc) {
                throw new Error(`Invalid decoded value: ${vRes.originalError.message}`)
            }
        }

        return value;
    }
}