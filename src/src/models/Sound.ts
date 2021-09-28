export default class Sound {
    public file: string;
    public path: string;
    public size: string;
    public part: string;
    public ambi_order: string;
    public format: string;
    public description: string;
    public license: string;

    constructor(data: any) {
        this.file = data.file;
        this.path = data.path;
        this.size = data.size;
        this.part = data.part;
        this.ambi_order = data.ambi_order;
        this.format = data.format;
        this.description = data.description;
        this.license = data.license;
    }
}