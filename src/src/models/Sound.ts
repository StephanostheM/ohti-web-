import { AudioTemplateRoute } from "../service/AudioTemplateRoute";

export default class Sound {
    public file: string;
    public path: string;
    public displayName: string = "";
    public size: string;
    public part: string;
    public ambi_order: string;
    public channel_order: string = "";
    public _order: AudioTemplateRoute = AudioTemplateRoute.default;
    public format: string;
    public description: string;
    public license: string;

    constructor(data: any) {
        if (data) {
            this.displayName = data.name || data.file;
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

    public static FromMedia(data: any): Sound {
        let sound = new Sound(null);
        sound.displayName = data.name;
        sound.file = data.file || data.filename;
        sound.path = data.path || "/";
        sound.format = data.format;
        sound.channel_order = data.kind;

        switch(data.kind) {
        case "2H1P":
            sound._order = AudioTemplateRoute.so2h1p;
            break;
        case "3H1P":
            sound._order = AudioTemplateRoute.so3h1p;
            break;
        case "AMB8":
            sound._order = AudioTemplateRoute.linear;
            break;
        }

        return sound
    }
}
