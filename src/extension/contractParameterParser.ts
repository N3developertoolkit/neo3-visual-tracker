import * as fs from 'fs/promises'
import Ajv from "ajv"
import * as NeoExpressFileSchema from "./neoExpressFile.json"
import * as NeoInvokeFileSchema from "./neoInvokeFile.json"
import { NeoExpressAccount, NeoExpressFile, NeoExpressWallet } from "./neoExpressSchema"
import { ContractParameter, InvokeOperation, NeoInvokeFile, TypedContractParameter } from "./neoInvokeSchema"
import { CONST, rpc, sc, u, wallet } from "@cityofzion/neon-core";
import { ec as EC } from "elliptic";

const ajv = new Ajv()

function caseInsensitiveEquals(s1: string, s2: string) {
    return s1.localeCompare(s2, undefined, { sensitivity: 'accent' }) === 0;
}

type TryGetFunction = (text: string) => u.HexString | undefined;

type ExpressListContracts = {
    hash: string,
    manifest: sc.ContractManifestJson,
}[];

export class ContractParameterParser {

    tryGetAccountHash?: TryGetFunction;
    tryGetContractHash?: TryGetFunction;

    constructor(tryGetAccountHash?: TryGetFunction, tryGetContractHash?: TryGetFunction) {
        this.tryGetAccountHash = tryGetAccountHash;
        this.tryGetContractHash = tryGetContractHash;
    }

    static async loadInvokeFile(path: string): Promise<NeoInvokeFile> {
        const text = await fs.readFile(path, "utf8");
        const json = JSON.parse(text)

        if (ajv.validate(NeoInvokeFileSchema, json)) {
            return json as NeoInvokeFile;
        }
        else {
            throw new Error("invalid neo-invoke file")
        }
    }

    static async loadExpressFile(path: string): Promise<NeoExpressFile> {
        const text = await fs.readFile(path, "utf8");
        const json = JSON.parse(text)

        if (ajv.validate(NeoExpressFileSchema, json)) {
            return json as NeoExpressFile;
        }
        else {
            throw new Error("invalid neo-express file")
        }
    }

    static getTryGetAccountHashFunction(express: NeoExpressFile): TryGetFunction {

        const curve = new EC("p256");

        return (text) => {
            if (caseInsensitiveEquals(text, "genesis")) {
                const threshold = Math.ceil(express['consensus-nodes'].length * 2 / 3);
                const keys = express['consensus-nodes']
                    .map(n => curve.keyFromPrivate(n.wallet.accounts[0]['private-key'], "hex").getPublic())
                    .sort((a,b) => a.encode("hex", false).localeCompare(b.encode("hex", false)))
                    .map(k => k.encode("hex", true));
                const account = wallet.Account.createMultiSig(threshold, keys);
                return u.HexString.fromHex(account.scriptHash);
            }

            for (const w of express.wallets ?? []) {
                if (caseInsensitiveEquals(text, w.name)) {
                    return getWalletAccountHash(w);
                }
            }

            for (const node of express['consensus-nodes']) {
                if (caseInsensitiveEquals(text, node.wallet.name)) {
                    return getWalletAccountHash(node.wallet);
                }
            }

            return undefined;
        };

        function getWalletAccountHash(expressWallet: NeoExpressWallet): u.HexString {
            if (expressWallet.accounts.length === 1) return getAccountHash(expressWallet.accounts[0]);
            if (expressWallet.accounts.length === 0) throw new Error(`${expressWallet.name} has no accounts`);

            let defaultAccounts = expressWallet.accounts.filter(a => a['is-default'] ?? false);
            if (defaultAccounts.length === 1) return getAccountHash(defaultAccounts[0]);
            if (defaultAccounts.length === 0) 
                throw new Error(`${expressWallet.name} has multiple accounts and no default accounts`);
            else
                throw new Error(`${expressWallet.name} has multiple default accounts`);
        }

        function getAccountHash(expressAccount: NeoExpressAccount) {
            const account = new wallet.Account(expressAccount['private-key']);
            return u.HexString.fromHex(account.scriptHash);
        }
    }

    static getTryGetContractHashFromResponse(response: ExpressListContracts): TryGetFunction {
        const contracts = response.map(q => [q.manifest.name, q.hash] as [string, string]);

        return (text) => {
            for (const [name, hash] of contracts) {
                if (text === name) {
                    return u.HexString.fromHex(hash);
                }
            }

            for (const [name, hash] of contracts) {
                if (caseInsensitiveEquals(text, name)) {
                    return u.HexString.fromHex(hash);
                }
            }

            return undefined;
        }
    }

    static async getTryGetContractHashFunction(express: NeoExpressFile): Promise<TryGetFunction> {
        const rpcPort = express['consensus-nodes'][0]['rpc-port'];
        const rpcClient = new rpc.RPCClient(`http://localhost:${rpcPort}`);
        const response = await rpcClient.execute<ExpressListContracts>(
            new rpc.Query({
                method: "expresslistcontracts",
                params: [],
            })
        );

        return this.getTryGetContractHashFromResponse(response);
    }

    async generateScript(invokeFile: NeoInvokeFile) {
        const builder = new sc.ScriptBuilder();

        if (Array.isArray(invokeFile)) {
            for (const op of invokeFile) {
                await this.emitOperation(builder, op);
            }
        }
        else {
            await this.emitOperation(builder, invokeFile);
        }

        return builder.build();
    }

    private async emitOperation(builder: sc.ScriptBuilder, op: InvokeOperation) {
        const contract = (op.contract.length >= 1 && op.contract[0] === '#') ? op.contract.slice(1) : op.contract;
        const scriptHash = this.convertContractHash(contract);
        if (scriptHash === undefined) throw new Error("Invalid contract");

        const args = await Promise.all((op.args ?? []).map(this.convertParam));
        builder.emitContractCall({
            scriptHash: scriptHash.toString(),
            operation: op.operation,
            args: args
        });
    }

    private convertContractHash(contract: string) {

        if (this.tryGetContractHash) {
            const scriptHash = this.tryGetContractHash(contract);
            if (scriptHash) return scriptHash;
        }

        type NATIVE_CONTRACT_HASH_KEY = keyof typeof CONST.NATIVE_CONTRACT_HASH;
        for (const c in CONST.NATIVE_CONTRACT_HASH) {
            if (c === contract) {
                const scriptHash = CONST.NATIVE_CONTRACT_HASH[c as NATIVE_CONTRACT_HASH_KEY];
                return u.HexString.fromHex(scriptHash);
            }
        }

        for (const c in CONST.NATIVE_CONTRACT_HASH) {
            if (caseInsensitiveEquals(c, contract)) {
                const scriptHash = CONST.NATIVE_CONTRACT_HASH[c as NATIVE_CONTRACT_HASH_KEY];
                return u.HexString.fromHex(scriptHash);
            }
        }

        try {
            const hexValue = u.HexString.fromHex(contract);
            if (hexValue.byteLength === 20) return hexValue;
        }
        catch { }

        return undefined;
    }

    async convertParam(param: ContractParameter): Promise<sc.ContractParam> {
        if (param === null || typeof param === "undefined") return sc.ContractParam.any(null);
        if (typeof param === "boolean") return sc.ContractParam.boolean(param);
        if (typeof param === "number") {
            if (!Number.isInteger(param)) throw new Error("non integer numbers not supported");
            return sc.ContractParam.integer(param);
        }
        if (typeof param === "string") return await this.convertStringParam(param);
        if (Array.isArray(param)) {
            const arrayParams = await Promise.all(param.map(this.convertParam));
            return sc.ContractParam.array(...arrayParams);
        }
        return this.convertTypedParam(param);
    }

    async convertStringParam(param: string) {
        if (param.length >= 1) {
            if (param[0] === '@') {
                const account = param.slice(1);

                if (this.tryGetAccountHash) {
                    const scriptHash = this.tryGetAccountHash(account);
                    if (scriptHash) {
                        return sc.ContractParam.hash160(scriptHash);
                    }
                }

                try {
                    const scriptHash = wallet.getScriptHashFromAddress(account);
                    return sc.ContractParam.hash160(scriptHash);
                }
                catch { }
            }
            else if (param[0] === '#') {
                const hashValue = param.slice(1);
                try {
                    const hexValue = u.HexString.fromHex(hashValue);
                    if (hexValue.byteLength == 20) return sc.ContractParam.hash160(hexValue);
                    if (hexValue.byteLength == 32) return sc.ContractParam.hash256(hexValue);
                }
                catch { }

                const scriptHash = this.convertContractHash(hashValue);
                if (scriptHash) return sc.ContractParam.hash160(scriptHash);
            }
        }

        if (param.startsWith("file://")) {
            const contents = await fs.readFile(param.slice(7));
            return sc.ContractParam.byteArray(u.HexString.fromArrayBuffer(contents));
        }

        if (param.startsWith("0x")) {
            try {
                return sc.ContractParam.byteArray(u.HexString.fromHex(param));
            }
            catch { }
        }

        return sc.ContractParam.string(param);
    }

    async convertTypedParam(arg: TypedContractParameter) {
        switch (arg.type) {
            // case "Signature": not implemented in NEON yet
            //     return sc.ContractParam.si(u.HexString.fromHex(arg.value));
            case "ByteArray":
                return sc.ContractParam.byteArray(u.HexString.fromHex(arg.value));
            case "Boolean":
                return sc.ContractParam.boolean(arg.value);
            case "Integer":
                return sc.ContractParam.integer(u.BigInteger.fromHex(arg.value));
            case "Hash160":
                return sc.ContractParam.hash160(u.HexString.fromHex(arg.value));
            case "Hash256":
                return sc.ContractParam.hash256(u.HexString.fromHex(arg.value));
            case "PublicKey":
                return sc.ContractParam.publicKey(u.HexString.fromHex(arg.value));
            case "String":
                return sc.ContractParam.string(arg.value);
            case "Array":
                const arrayParams = await Promise.all(arg.value.map(this.convertParam));
                return sc.ContractParam.array(...arrayParams);
            // case "Map": not implemented in NEON yet
            //     break;
        }

        throw new Error(`paramter type ${arg.type} not supported`);
    }
}