import * as audioSources from "../content/soundlinks.json";
import Tool from '../utils/Tools';
import Sound from "../models/Sound";
import ArrayUtil from "../utils/ArrayUtil";
import Events from "../utils/Events";
import Omnitone from 'omnitone/build/omnitone.min.esm.js';
import NumberUtil from "../utils/NumberUtil";
import { AudioTemplateRoute } from "./AudioTemplateRoute";
import { AudioMatrixRoute } from "./AudioMatrixRoute";
import DOMUtil from "../utils/DOMUtil";
import AudioFileDrop from "./AudioFileDrop";
import AudioPlayerView from "./AudioPlayerView";

export default class AudioPlayer {
    private $view: AudioPlayerView;

    private event: Events = new Events();

    public audioContext: AudioContext;
    public links: Sound[];

    private audioRouteOutput: AudioMatrixRoute = new AudioMatrixRoute();

    private audioElement: HTMLAudioElement;
    private audioInputGain: GainNode;
    private audioElementSource: MediaElementAudioSourceNode;

    private ambisonicOrderNum: number = 2;

    private decoderFOA: any;
    private decoderSOA: any;
    private decoderTOA: any;

    private static instance: AudioPlayer;
    public static getInstance(): AudioPlayer {
        if (AudioPlayer.instance == null) {
            AudioPlayer.instance = new AudioPlayer();
        }
        return AudioPlayer.instance;
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

        // 1. Prepare audio element to feed the ambisonic source audio feed.
        this.audioElement = document.createElement("audio");
        this.audioElement.loop = true;
        this.audioElement.crossOrigin = "anonymous";
        this.audioElement.src = audioSources[3]["file"];
        this.audioElement.volume = 1;
        this.audioElement.controls = true;

        this.audioElement.ontimeupdate = function(event) {
            const track = event.target as HTMLAudioElement;
            self.$view.setAudioTimer(track.duration, track.currentTime);
        }

        this.audioElement.onloadedmetadata = function() {
            self.audioElement.setAttribute("duration", self.audioElement.duration.toString());
            self.$view.setAudioTimer(self.audioElement.duration, self.audioElement.currentTime);
        }

        console.log({ element: this.audioElement });

        document.getElementById("audioPlayerContainer").append(this.audioElement);

        // 2. Create media element source
        this.audioElementSource = this.audioContext.createMediaElementSource(this.audioElement);

        // 3. Create gain node
        this.audioInputGain = this.audioContext.createGain();
        this.audioElementSource.connect(this.audioInputGain);

        // 4. Create the audio routing
        // this.splitter = this.audioContext.createChannelSplitter(this.audioRouteOutput.outputs);
        // this.audioInputGain.connect(this.splitter);
        // this.merger = this.audioContext.createChannelMerger(this.audioRouteOutput.inputs);

        // 4.a Creates First Order Ambisonic Decoder
        this.decoderFOA = Omnitone.createFOARenderer(this.audioContext, {
            HRTFSetUrl: "/omnitone/build/resources/", // FuMa ordering (W,X,Y,Z).
            ambisonicOrder: 1,
            // postGainDB: 30,
            // The example audio is in the FuMa ordering (W,X,Y,Z). So remap the channels to the ACN format.
            channelMap: [0, 3, 1, 2]
        });
        this.decoderFOA.initialize().then(() => {
            this.$view.enablePlayButtons();
            let state = this.ambisonicOrderNum == 0 ? "ambisonic" : "off";
            this.decoderFOA.setRenderingMode(state);
            this.decoderFOA.output.connect(this.audioContext.destination);
        },
        function (onInitializationError) {
            console.error(onInitializationError);
        });

        // 4.b Creates Second Order Ambisonic Decoder
        this.decoderSOA = Omnitone.createHOARenderer(this.audioContext, {
            HRTFSetUrl: "/omnitone/build/resources/", // FuMa ordering (W,X,Y,Z).
            ambisonicOrder: 2,
            // The example audio is in the FuMa ordering (W,X,Y,Z). So remap the channels to the ACN format.
            channelMap: [0, 3, 1, 2]
        });
        this.decoderSOA.initialize().then(() => {
            this.$view.enablePlayButtons();
            let state = this.ambisonicOrderNum == 1 ? "ambisonic" : "off";

            this.decoderSOA.setRenderingMode(state);
            this.decoderSOA.output.connect(this.audioContext.destination);
        },
        function (onInitializationError) {
            console.error(onInitializationError);
        });

        // 4.c Creates Third Order Ambisonic Decoder
        this.decoderTOA = Omnitone.createHOARenderer(this.audioContext, {
            HRTFSetUrl: "/omnitone/build/resources/", // FuMa ordering (W,X,Y,Z).
            ambisonicOrder: 3,
            // postGainDB: 30,
            // The example audio is in the FuMa ordering (W,X,Y,Z). So remap the channels to the ACN format.
            channelMap: [0, 3, 1, 2]
        });
        this.decoderTOA.initialize().then(() => {
            this.$view.enablePlayButtons();
            let state = this.ambisonicOrderNum == 2 ? "ambisonic" : "off";

            this.decoderTOA.setRenderingMode(state);
            this.decoderTOA.output.connect(this.audioContext.destination);
        },
        function (onInitializationError) {
            console.error(onInitializationError);
        });

        // Rotate the sound field.
        //decoder.setRotationMatrix(rotationMatrix);

        // Mono or regular multi-channel layouts.
        //decoder.setMode('bypass');

        // Ambisonically decoded audio stream.
        //decoder.setMode('ambisonic');

        // Disable encoding completely. (audio processing disabled)
        //decoder.setMode('off');

        // Creates FOA Rotator to use directly with more functions
        var rotator = Omnitone.createFOARotator(this.audioContext);

        console.log({ rotator: rotator });

        // Audio drop
        const drop = new AudioFileDrop();
        drop.register((source: string) => {
            this.audioElement.src = source;
        });

        this.generateChannelSelector();

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
                // this.getCurrentDecoder().input.disconnect();
                // this.audioContext.resume();
                // this.audioElement.play();
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
            console.log("Decoder in :", this.getCurrentDecoder.input);
            console.log("Decoder out:", this.getCurrentDecoder.output);

            // Out from Omnitone decoder, send toaudio context
            merger.connect(this.getCurrentDecoder.input);

            console.log(`AudioContext state '${this.audioContext.state}'`)

        } catch(error) {
            console.error(error);
        }
    }

    toggleAmbisonicOrder = (event) => {
        this.ambisonicOrderNum = (this.ambisonicOrderNum+1)%3;
        if (this.ambisonicOrderNum == 2) {
            this.decoderFOA.setRenderingMode("off")
            this.decoderSOA.setRenderingMode("off");
            this.decoderTOA.setRenderingMode("ambisonic");
        } else if (this.ambisonicOrderNum == 1) {
            this.decoderFOA.setRenderingMode("off")
            this.decoderSOA.setRenderingMode("ambisonic");
            this.decoderTOA.setRenderingMode("off");
        } else {
            this.decoderFOA.setRenderingMode("ambisonic")
            this.decoderSOA.setRenderingMode("off");
            this.decoderTOA.setRenderingMode("off");
        }

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

    }

    stopAudio = () => {

    }

    private get isPlaying() {
        return !this.audioElement.paused ?? false;
    }

    private get getCurrentDecoder() {
        if (this.ambisonicOrderNum == 2) {
            return this.decoderTOA;
        } else if (this.ambisonicOrderNum == 1) {
            return this.decoderSOA;
        } else {
            return this.decoderFOA;
        }
    }

    /**
     * Omnitone uses 3x3 row-major matrix to rotate the sound field.
     * @param mtx3 3x3 row major matrix
     * @param euler null
     */
    public rotateSoundField(mtx3: any, euler: any = null) {
        if (this.ambisonicOrderNum == 2) {
            this.decoderTOA.setRotationMatrix3(mtx3);
        } else if (this.ambisonicOrderNum == 1) {
            this.decoderSOA.setRotationMatrix3(mtx3);
        } else {
            this.decoderFOA.setRotationMatrix3(mtx3);
        }
    }

    // listItem(item) {
    //     let li = document.createElement("LI");
    //     li.innerHTML = `<strong>${item.file}</strong> "${item.path}" (${item.size}) <a href="${item.path}/${item.file}">link</a> <audio src="${item.path}/${item.file}" controls="true"></audio>`;

    //     if (item.description) {
    //         li.innerHTML += `<br/><i>${item.description}</i>`;
    //     }

    //     if (item.license) {
    //         li.innerHTML += `<p>${item.license}</p>`;
    //     }

    //     return li;
    // }

    // async getSounds() {
    //     try {
    //         let sounds = await fetch("soundlinks.json");
    //         let blob = await sounds.json();
    //         console.log(blob);
    //         const frag = document.createDocumentFragment();
    //         blob.forEach((item: any) => {
    //             if (item.file != "") {
    //                 frag.appendChild(this.listItem(item));
    //             }
    //         });

    //         //document.getElementById("soundslist").append(frag);

    //         this.links = ArrayUtil.toArray<Sound>(blob).map((x) => new Sound(x));
    //     } catch(err) {
    //         console.error(err);
    //     }
    // }
}