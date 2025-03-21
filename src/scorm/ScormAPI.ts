export class ScormAPI {
    private static instance: ScormAPI;
    private api: any;

    private constructor() {
        this.api = window.API || window.parent.API || window.top.API;
    }

    public static getInstance(): ScormAPI {
        if (!ScormAPI.instance) {
            ScormAPI.instance = new ScormAPI();
        }
        return ScormAPI.instance;
    }

    public initialize(): boolean {
        return this.api.LMSInitialize("");
    }

    public terminate(): boolean {
        return this.api.LMSFinish("");
    }

    public setValue(key: string, value: string): boolean {
        return this.api.LMSSetValue(key, value);
    }

    public getValue(key: string): string {
        return this.api.LMSGetValue(key);
    }

    public commit(): boolean {
        return this.api.LMSCommit("");
    }

    public getLastError(): string {
        return this.api.LMSGetLastError();
    }
}