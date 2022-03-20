declare module 'ambisonics' {

    /**
     * Takes a HOA stream of order N, and outputs the channel-limited HOA stream of order N'<=N
     */
    export class orderLimiter {
        constructor(audioCtx: any, orderIn: number, orderOut: number);

        updateOrder(orderOut: number);
    }

    /**
     * Rotates the sound scene of an ambisonic stream, with real-time control of yaw, pitch, and roll rotation angles.
     */
    export class sceneRotator {

        /** Browser audio context */
        public ctx: AudioContext;
        /** Ambisonics order */
        public order: number;
        /** Number of channels, based on (order+1)*(order+1) */
        public nCh: number;
        /** Channel splitter in */
        public in: ChannelSplitterNode;
        /** Stereo channel merger out */
        public out: ChannelMergerNode;
        /**  */
        public yaw: number;
        /**  */
        public pitch: number;
        /**  */
        public roll: number;
        /**  */
        public rotMtx: any;
        /**  */
        public rotMtxNodes: any[];

        constructor(audioCtx: any, order: number);

        /**
         * Updates the matrix for rotating from the 'yaw', 'pitch' and 'roll' parameters.
         * Make sure you update these values first before running this. The parameters should be set in degrees.
         */
        updateRotMtx();
    }

    /**
     * Mirrors the sound scene of an ambisonic stream with respect to (front-back), (left-right), or (up-down) axes.
     */
    export class sceneMirror {
        constructor(audioCtx: any, order: number);

        /**
         * Resets the gain for each channel to 1
         */
        reset();

        /**
         * Set the scene mirroring.
         * - 0: resets
         * - 1: mirroring on yz-plane (front-back)
         * - 2: mirroring on xz-plane (left-right)
         * - 3: mirroring on xy-plane (up-down)
         * @param planeNo the mirror plane
         */
        mirror(planeNo);
    }

    /**
     * Binaural Decoder HOA implements an ambisonic to binaural decoding, using user-defined HRTF-based filters. If these are not provided, two plain opposing cardioids are used instead.
     */
    export class binDecoder {
        /** Indicates if the decoder has been initialized */
        public initialized: boolean;
        /** Browser audio context */
        public ctx: AudioContext;
        /** Ambisonics order */
        public order: number;
        /** Number of channels, based on (order+1)*(order+1) */
        public nCh: number;
        /** Channel splitter in */
        public in: ChannelSplitterNode;
        /** Stereo channel merger out */
        public out: ChannelMergerNode;
        /** Audio context convolver nodes */
        public decFilterNodes: any[];

        constructor(audioCtx: any, order: number);

        updateFilters(...val: any);

        /**
         * Reset filters, overwrite decoding filters (plain cardioid virtual microphones)
         */
        resetFilters();
    }

    /**
     * Intensity Analyser implements an acoustic intensity analysis for visualization of directional information captured in the ambisonic stream.
     */
    export class intensityAnalyser {
        constructor(audioCtx: any);

        /**
         * Get latest time-domain data
         */
        updateBuffers();

        /**
         * Compute correlations and energies of channels
         */
        computeIntensity();
    }

    export class HOAloader {
        /**
         * 
         * @param context audio context.
         * @param order ambisonics order.
         * @param url the url scheme for loading multiple files. So not the actual file name.
         * @param callback triggers on buffer load when the buffer is merged.
         */
        constructor(context: any, order: number, url: string, callback: (mergedBuffer: any) => void);

        /**
         * Load the provided URL's into the buffer.
         */
        load();

        private loadBuffers(url: string, index: number);

        private concatBuffers();
    }

}
