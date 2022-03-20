import Tool from '../utils/Tools';
import Sound from "../models/Sound";
import ArrayUtil from "../utils/ArrayUtil";
import Events from "../utils/Events";
import NumberUtil from "../utils/NumberUtil";
import { AudioTemplateRoute } from "./AudioTemplateRoute";
import { AudioMatrixRoute } from "./AudioMatrixRoute";
import DOMUtil from "../utils/DOMUtil";
import AudioFileDrop from "./AudioFileDrop";
import * as ambisonics from "ambisonics";
import AudioPlayerView from "./AudioPlayerView";
import * as audioSources from "../content/soundlinks.json";
import Constants from '../utils/Constants';
import { RowMajorMatrix3x3 } from '../models/RowMajorMatrix3x3';
import { IEulerAngles } from '../models/IEulerAngles';
import QuaternionTools from '../utils/QuaternionTools';

export default class AudioPlayerAmbisonics {
    private $view: AudioPlayerView;

    private event: Events = new Events();

    public audioContext: AudioContext;
    public links: Sound[];

    private audioRouteOutput: AudioMatrixRoute = new AudioMatrixRoute();

    private audioElement: HTMLAudioElement;
    private audioInputGain: GainNode;
    private audioElementSource: MediaElementAudioSourceNode;

    private ambisonicOrderNum: number = 2;

    // private decoderFOA: any;
    // private decoderSOA: any;
    // private decoderTOA: any;



    private sceneMirror: any;
    private orderLimiter: any;
    private sceneRotator: ambisonics.sceneRotator;
    private binauralDecoder: any;
    private intensityAnalyser: any;
    private gainOut: any;

    private orderOut: number;

    private soundBuffer: any;
    private sound: any;

    private soundUrl: any = "sounds/HOA3_rec1.ogg";

    private loader_sound: any;
    private loader_filters: any;

    private static instance: AudioPlayerAmbisonics;
    public static getInstance(): AudioPlayerAmbisonics {
        if (AudioPlayerAmbisonics.instance == null) {
            AudioPlayerAmbisonics.instance = new AudioPlayerAmbisonics();
        }
        return AudioPlayerAmbisonics.instance;
    }

    private constructor() {
        const self = this;
        this.$view = new AudioPlayerView(self);

        // Create an AudioContext
        this.audioContext = new AudioContext();

        // added resume context to handle Firefox suspension of it when new IR loaded
        // see: http://stackoverflow.com/questions/32955594/web-audio-scriptnode-not-called-after-button-onclick
        this.audioContext.onstatechange = function() {
            if (self.audioContext.state === "suspended") {
                self.audioContext.resume();
            }
        }

        console.log(ambisonics);

        var irUrl_0 = "IRs/ambisonic2binaural_filters/HOA3_IRC_1008_virtual.wav";
        var irUrl_1 = "IRs/ambisonic2binaural_filters/aalto2016_N3.wav";
        var irUrl_2 = "IRs/ambisonic2binaural_filters/HOA3_BRIRs-medium.wav";

        // define HOA mirroring
        this.sceneMirror = new ambisonics.sceneMirror(this.audioContext, Constants.maxOrder);
        console.log(`Scene Mirror (mirrors the sound scene of an ambisonic stream with respect to (front-back), (left-right), or (up-down) axes.):`, this.sceneMirror);

        // define HOA order limiter (to show the effect of order)
        this.orderLimiter = new ambisonics.orderLimiter(this.audioContext, Constants.maxOrder, this.orderOut);
        console.log(`Order Limiter (takes a HOA stream of order N, and outputs the channel-limited HOA stream of order N'<=N):`, this.orderLimiter);

        // define HOA rotator
        this.sceneRotator = new ambisonics.sceneRotator(this.audioContext, Constants.maxOrder);
        console.log(`Scene Rotator (rotates the sound scene of an ambisonic stream, with real-time control of yaw, pitch, and roll rotation angles.):`, this.sceneRotator);

        // define binaural HOA decoder
        this.binauralDecoder = new ambisonics.binDecoder(this.audioContext, Constants.maxOrder);
        console.log(`Binaural Decoder (implements an ambisonic to binaural decoding, using user-defined HRTF-based filters. If these are not provided, two plain opposing cardioids are used instead.):`, this.binauralDecoder);

        // define intensity analyser
        this.intensityAnalyser = new ambisonics.intensityAnalyser(this.audioContext);
        console.log(`Intensity Analyser (implements an acoustic intensity analysis for visualization of directional information captured in the ambisonic stream):`, this.intensityAnalyser);

        // output gain
        this.gainOut = this.audioContext.createGain();

        // connect HOA blocks
        this.sceneMirror.out.connect(this.sceneRotator.in);
        this.sceneRotator.out.connect(this.orderLimiter.in);
        this.sceneRotator.out.connect(this.intensityAnalyser.in);
        this.orderLimiter.out.connect(this.binauralDecoder.in);
        this.binauralDecoder.out.connect(this.gainOut);
        this.gainOut.connect(this.audioContext.destination);

        // load samples and assign to buffers
        this.loader_sound = new ambisonics.HOAloader(this.audioContext, Constants.maxOrder, this.soundUrl, this.assignSoundBufferOnLoad);
        this.loader_sound.load();

        // load filters and assign to buffers
        this.loader_filters = new ambisonics.HOAloader(this.audioContext, Constants.maxOrder, irUrl_0, this.assignFiltersOnLoad);
        this.loader_filters.load();

        // adapt common html elements to specific example
        document.getElementById("move-map-instructions").outerHTML='Click on the map to rotate the scene:';

        // update sample list for selection
        var sampleList = {
            "orchestral 1": "sounds/HOA3_rec1.ogg",
            "orchestral 2": "sounds/HOA3_rec2.ogg",
            "orchestral 3": "sounds/HOA3_rec3.ogg",
            "theatrical": "sounds/HOA3_rec4.ogg"
        };
        var $el = document.getElementById("sample_no");
        $el.innerHTML = ""; // remove old options
        for (const [key, value] of Object.entries(sampleList)) {
            console.log(`${key}: ${value}`);
            let option = document.createElement("option");
            option.setAttribute("value", value);
            option.textContent = key;
            $el.appendChild(option);
        }

        // Init event listeners

        // document.getElementById('play').addEventListener('click', () => {
        //     this.sound = self.audioContext.createBufferSource();
        //     this.sound.buffer = this.soundBuffer;
        //     this.sound.loop = true;
        //     this.sound.connect(self.sceneMirror.in);
        //     this.sound.start(0);
        //     this.sound.isPlaying = true;
        //     (document.getElementById('play') as HTMLButtonElement).disabled = true;
        //     (document.getElementById('stop') as HTMLButtonElement).disabled = false;
        // });
        // document.getElementById('stop').addEventListener('click', () => {
        //     this.sound.stop(0);
        //     this.sound.isPlaying = false;
        //     (document.getElementById('play') as HTMLButtonElement).disabled = false;
        //     (document.getElementById('stop') as HTMLButtonElement).disabled = true;
        // });

        // Order control buttons
        var orderValue = document.getElementById('order-value');
        orderValue.innerHTML = Constants.maxOrder.toString();
        var orderButtons = document.getElementById("div-order");
        for (let i=1; i<=Constants.maxOrder; i++) {
            let button = document.createElement("button");
            button.setAttribute("id", 'N'+i);
            button.setAttribute("value", i.toString());
            button.innerHTML = 'N'+i;
            button.addEventListener('click', function() {
                self.orderOut = parseInt(this.value);
                orderValue.innerHTML = self.orderOut.toString();
                self.orderLimiter.updateOrder(self.orderOut);
                self.orderLimiter.out.connect(self.binauralDecoder.in);
            });
            orderButtons.appendChild(button);
        }

        // Decoding buttons
        var decoderValue = document.getElementById('decoder-value');
        var decoderButtons = document.getElementById("div-decoder");
        var decoderStringList = ['Free-field HRIRs 1','Free-field HRIRs 2','Medium room BRIRs'];
        decoderValue.innerHTML = decoderStringList[0];
        var irUrlList = [irUrl_0, irUrl_1, irUrl_2];
        for (let i=0; i<irUrlList.length; i++) {
            let button = document.createElement("button");
            button.setAttribute("id", 'R'+i);
            button.setAttribute("value", irUrlList[i]);
            button.innerHTML = decoderStringList[i];
            button.addEventListener('click', () => {
                decoderValue.innerHTML = button.innerHTML;
                this.loader_filters = new ambisonics.HOAloader(self.audioContext, Constants.maxOrder, button.value, this.assignFiltersOnLoad);
                this.loader_filters.load();
            });
            decoderButtons.appendChild(button);
        }

        // Mirror Buttons actions
        var mirrorValue = document.getElementById('mirror-value');
        for (let i=0; i<4; i++) {
            let button = document.getElementById('M'+i) as HTMLButtonElement;
            button.addEventListener('click', function() {
                mirrorValue.innerHTML = this.innerHTML;
                self.sceneMirror.mirror(parseInt(this.value));
            });
        }






















        // 1. Prepare audio element to feed the ambisonic source audio feed.
        // this.audioElement = document.createElement("audio");
        // this.audioElement.loop = true;
        // this.audioElement.crossOrigin = "anonymous";
        // this.audioElement.src = audioSources[3]["file"];
        // this.audioElement.volume = 1;
        // this.audioElement.controls = true;

        // this.audioElement.ontimeupdate = function(event) {
        //     const track = event.target as HTMLAudioElement;
        //     self.$view.setAudioTimer(track.duration, track.currentTime);
        // }

        // this.audioElement.onloadedmetadata = function() {
        //     self.audioElement.setAttribute("duration", self.audioElement.duration.toString());
        //     self.$view.setAudioTimer(self.audioElement.duration, self.audioElement.currentTime);
        // }

        // console.log({ element: this.audioElement });

        // document.getElementById("audioPlayerContainer").append(this.audioElement);

        // // 2. Create media element source
        // this.audioElementSource = this.audioContext.createMediaElementSource(this.audioElement);

        // // 3. Create gain node
        // this.audioInputGain = this.audioContext.createGain();
        // this.audioElementSource.connect(this.audioInputGain);

        // // Audio drop
        // const drop = new AudioFileDrop();
        // drop.register((source: string) => {
        //     this.audioElement.src = source;
        // });

        //this.generateChannelSelector();

        // Bind events to channel matrix selector
        Tool.$event("channel-selector", "click", (event: any) => {
            if (event.target.type == "radio") {
                event.stopPropagation();
                const target = event.target;

                let split = target.value.split("x"); // format: output x input
                try {
                    console.log(`Route input ${parseInt(split[1])} =>  to output ${parseInt(split[0])} (${this.audioRouteOutput.getInput(parseInt(split[0]))})`)
                    this.audioRouteOutput.setInput(parseInt(split[0]), parseInt(split[1]));
                    console.log("Pappa, kopiera denna!", this.audioRouteOutput.current);
                } catch(error) {
                    console.error(error);
                }
                this.mergeChannels();
            }
        });

        // Bind events to template buttons
        const templateBtn = document.querySelectorAll("[data-template]");
        console.log("Template buttons:", templateBtn);
        Array.from(templateBtn).forEach((element) => {
            Tool.$event(element, "click", (event) => {
                const action = event.target.dataset.template;
                if (action) {
                    console.log(`Audio matrix template '${action}'`);
                    this.audioRouteOutput.select(AudioTemplateRoute[action]);
                    this.generateChannelSelector();
                }
            });
        });

        // Bind the gain level
        const gainTemplateBtn = document.querySelectorAll("[data-input-gain]");
        console.log("Gain template buttons:", gainTemplateBtn);
        Array.from(gainTemplateBtn).forEach((element) => {
            Tool.$event(element, "click", (event) => {
                const action = event.target.dataset.inputGain as number;
                if (action) {
                    console.log(`Audio gain template '${action}'`);
                    let dat = NumberUtil.decibelToGain(action);
                    console.log(dat);
                    this.audioInputGain.gain.value = dat;
                    Tool.$attr("audio-gain-level", `${action}dB`);
                }
            });
        });
    }

    // Define mouse drag on spatial map .png local impact
    public mouseActionLocal(angleXY) {
        this.sceneRotator.yaw = -angleXY[0];
        this.sceneRotator.pitch = angleXY[1];
        this.sceneRotator.updateRotMtx();
    }

    public drawLocal() {
        // Update audio analyser buffers
        this.intensityAnalyser.updateBuffers();
        var params = this.intensityAnalyser.computeIntensity();
        // updateCircles(params, canvas);
    }

    // function to change sample from select box
    public changeSample() {
        (document.getElementById('play') as HTMLButtonElement).disabled = true;
        (document.getElementById('stop') as HTMLButtonElement).disabled = true;
        this.soundUrl = (document.getElementById("sample_no") as HTMLSelectElement).value;
        if (typeof this.sound != 'undefined' && this.sound.isPlaying) {
            this.sound.stop(0);
            this.sound.isPlaying = false;
        }
        this.loader_sound = new ambisonics.HOAloader(this.audioContext, Constants.maxOrder, this.soundUrl, this.assignSoundBufferOnLoad);
        this.loader_sound.load();
    }

    // function to assign sample to the sound buffer for playback (and enable playbutton)
    // public assignSample2SoundBuffer = (decodedBuffer) => {
    //     this.soundBuffer = decodedBuffer;
    //     (document.getElementById('play') as HTMLButtonElement).disabled = false;
    // }

    // load samples and assign to buffers
    public assignSoundBufferOnLoad = (buffer) => {
        this.soundBuffer = buffer;
        (document.getElementById('play') as HTMLButtonElement).disabled = false;
    }

    // load filters and assign to buffers
    public assignFiltersOnLoad = (buffer) => {
        this.binauralDecoder.updateFilters(buffer);
    }

    public inputSelectAudioFile = (audio) => {
        console.log("Loading selected item: ", audio);
        console.log({ elem: this.audioElement })
        if ("src" in (this.audioElement as HTMLAudioElement)) {
            this.audioElement.src = audio; //const mediaSource = new MediaSource();
        } else {
            // Avoid using this in new browsers, as it is going away.
            this.audioElement.src = window.URL.createObjectURL(audio);
        }
    };

    /**
     * Create the matrix routing DOM-view
     */
    private generateChannelSelector = () => {
        let group = document.createDocumentFragment();

        for (let y = 0; y < this.audioRouteOutput.inputs + 1; y++) {
            // inputs
            let frg = document.createDocumentFragment();
            let row = document.createElement("DIV");
            let input = document.createElement("DIV");
            input.textContent = ( y == this.audioRouteOutput.inputs ? `silent` : `in ${y}` );
            row.className = "ch-row";
            row.append(input);

            let inputValue = ( y == this.audioRouteOutput.inputs ? -1 : y );
            console.log(inputValue)

            for (let x = 0; x < this.audioRouteOutput.outputs; x++) {
                // outputs
                let label = document.createElement("LABEL");
                label.className = ( y == this.audioRouteOutput.inputs ? "ch-label silent" : "ch-label" );
                label.setAttribute("for", `crosspoint-${x}x${inputValue}`);

                let crosspoint = document.createElement("input");
                crosspoint.setAttribute("type", "radio");
                crosspoint.setAttribute("name", `output-${x}`);
                crosspoint.setAttribute("value", `${x}x${inputValue}`);
                crosspoint.setAttribute("data-input", `${inputValue}`);
                crosspoint.setAttribute("data-output", `${x}`);
                crosspoint.id = `crosspoint-${x}x${inputValue}`;

                if ( this.audioRouteOutput.getInput(x) == inputValue ) {
                    crosspoint.setAttribute("checked", "checked");
                }
                row.append(crosspoint);
                row.append(label);
            }
            frg.append(row);
            group.append(frg);
        }

        let row = document.createElement("DIV");
        row.className = "ch-row";

        let title = document.createElement("DIV");
        title.textContent = `outputs `;
        row.append(title);

        for (let x = 0; x < this.audioRouteOutput.channels(); x++) {
            let output = document.createElement("DIV");
            output.textContent = `${x}`; // `${x+1}`;
            row.append(output);
        }
        group.append(row);

        const container = Tool.$dom("channel-selector");
        DOMUtil.removeAllChildNodes(container);
        container.appendChild(group);

        this.mergeChannels();
    }

    private lastSplitter: any = null;

    /**
     * Creates a channel splitter, reroutes and channel merger
     */
    mergeChannels() {
        try {
            console.log("gain", this.audioInputGain)
            const splitter = this.audioContext.createChannelSplitter(this.audioRouteOutput.outputs); // out 10
            //this.audioElementSource.connect(splitter); // mediaElemSource is video or audio element
            if (this.lastSplitter !== null) {
                this.audioInputGain.disconnect(this.lastSplitter);
            }
            this.lastSplitter = splitter;
            this.audioInputGain.connect(splitter);
            const merger = this.audioContext.createChannelMerger(this.audioRouteOutput.inputs); // inouts 9

            console.log("Splitter nr of input:", splitter.numberOfInputs, "=1 nr of out:", splitter.numberOfOutputs, "=16");
            console.log("Merger nr of input:", merger.numberOfInputs, "=16 nr of out:", merger.numberOfOutputs, "=1");

            console.log("Route output:", this.audioRouteOutput);
            this.audioRouteOutput.current.forEach((input, outIndex) => {
                // node, output , input

                // CurrentAudioNode.connect(DestinationNode, OutputNumber, InputNumber)
                // DestinationNode = The AudioNode or AudioParam to which to connect.
                // OutputNumber = An index specifying which output of the current AudioNode to connect to the destination. The index numbers are defined according to the number of output channels (see Audio channels).
                // InputNumber = An index describing which input of the destination you want to connect the current AudioNode to; the default is 0. The index numbers are defined according to the number of input channels (see Audio channels).
                if (input != -1) {
                    // Combine the output of each input 'splitter' node back into one stream using the merger.
                    splitter.connect(merger, input, outIndex); // --------- xxx yes
                    console.log(`Route: input ${input+1} => ${outIndex+1}`);
                } else {
                    // Create dummy silent node and connect it
                    const silence = this.audioContext.createBufferSource();
                    const volume = this.audioContext.createGain();
                    volume.gain.value = 1;
                    silence.connect(volume);
                    volume.connect(merger, 0, outIndex);
                    silence.start(0);
                    console.log("Silence ch count:", silence.channelCount, ",in=", silence.numberOfInputs, "out=", silence.numberOfOutputs);

                    // const source3 = this.audioContext.createOscillator();
                    // source3.frequency.value = 440;
                    // const volume = this.audioContext.createGain();
                    // volume.gain.value = -1;
                    // source3.connect(volume);
                    // volume.connect(merger, 0, outIndex);
                    // source3.start(0);

                    // splitter.connect(merger, outIndex, this.audioRouteOutput.outputs - 1);
                    console.log(`Route: input ${this.audioRouteOutput.outputs} => ${outIndex+1} (fake silent input)`);
                }
            });
            console.log("Splitter   :", splitter);
            console.log("Merger     :", merger);
            // console.log("Decoder in :", this.getCurrentDecoder.input);
            // console.log("Decoder out:", this.getCurrentDecoder.output);

            // Out from Omnitone decoder, send toaudio context
            // merger.connect(this.getCurrentDecoder.input); // TODO: find decodet in jsambisonics

            console.log(`AudioContext state '${this.audioContext.state}'`)

        } catch(error) {
            console.error(error);
        }
    }

    toggleAmbisonicOrder = (event) => {
        this.ambisonicOrderNum = (this.ambisonicOrderNum+1)%3;
        if (this.ambisonicOrderNum == 2) {
            this.orderOut = 3;
        } else if (this.ambisonicOrderNum == 1) {
            this.orderOut = 2;
        } else {
            this.orderOut = 1;
        }
        console.log("toggle-ambisonics-order =", this.orderOut);
        this.orderLimiter.updateOrder(this.orderOut);
        this.orderLimiter.out.connect(this.binauralDecoder.in);

        this.$view.setOrder(this.ambisonicOrderNum);
    }

    toggleAudioPlayback = (event) => {
        console.log(this)
        this.mergeChannels();
        try {
            if (this.audioElement.paused && this.audioElement.currentTime >= 0 && !this.audioElement.ended) {
                this.audioContext.resume();
                this.audioElement.play();
            } else {
                this.audioElement.pause();
            }
        } catch(error) {
            console.error(error);
        }
        this.$view.setAudioPlaying(this.isPlaying);
    }

    playAudio = () => {
        try {
        this.sound = this.audioContext.createBufferSource();
        this.sound.buffer = this.soundBuffer;
        this.sound.loop = true;
        this.sound.connect(this.sceneMirror.in);
        this.sound.start(0);
        this.sound.isPlaying = true;
        this.$view.setAudioPlaying(true);
        } catch(err) {
            console.error(err);
        }
        console.log("play audio");
    }

    stopAudio = () => {
        this.sound.stop(0);
        this.sound.isPlaying = false;
        this.$view.setAudioPlaying(false);
        console.log("stop audio");
    }

    private get isPlaying() {
        return !this.audioElement.paused ?? false;
    }

    private get getCurrentDecoder() {
        // if (this.ambisonicOrderNum == 2) {
        //     return this.decoderTOA;
        // } else if (this.ambisonicOrderNum == 1) {
        //     return this.decoderSOA;
        // } else {
        //     return this.decoderFOA;
        // }
        return 3;
    }

    /**
     * JSAmbisonics uses euler to rotate field.
     * @param mtx3 3x3 row major matrix
     * @param euler null
     */
    public rotateSoundField(mtx3: RowMajorMatrix3x3, euler: IEulerAngles = null) {
        this.sceneRotator.roll = QuaternionTools.radiansToDegrees(euler.x);
        this.sceneRotator.pitch = QuaternionTools.radiansToDegrees(euler.y);
        this.sceneRotator.yaw = QuaternionTools.radiansToDegrees(euler.z);
        this.sceneRotator.updateRotMtx();
        console.log(euler);
    }
}
