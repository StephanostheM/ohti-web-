
export enum AudioTemplateRoute {
    default = "default",
    custom = "custom",
    linear = "linear",
    so2h1p = "so2h1p",
    so3h1p = "so3h1p",
    silent = "silent"
}


export class AudioRoute {
    public static default = [0, 1, 2, 3, 4, 5, -1, 6, 7, -1, -1, -1, -1, -1, -1, -1] as const;
    public static linear = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;
    public static so2h1pOld = [0, 1, 2, 3, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1] as const;
    public static so2h1p = [0, 1, 2, 3, 4, -1, -1, -1, 5, -1, -1, -1, -1, -1, -1, -1] as const;
    public static so3h1pOld = [0, 1, 2, 3, 4, 5, -1, -1, -1, 9, 10, -1, -1, -1, -1, -1] as const;
    // public static so3h1p = [0, 1, 2, 3, 4, -1, -1, -1, 5, 6, -1, -1, -1, -1, -1, 7] as const;
    public static silent = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1] as const;

    // Use so3h3p (AMB8) as default setting
    // Use Ambisonic third order decoder
    public static so3h3p = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];         // (TOA) in 16 channels 
    public static so3h2p = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -1, -1, -1, -1, 15];        //  Straight routing as some channels are silent incoming
    public static so3h1p = [0, 1, 2, 3, 4, -1, -1, -1, 8, 9, -1, -1, -1, -1, -1, 15];       //   Straight routing as some channels are silent incoming

    // Use Ambisonic second order decoder
    public static so2h2p = [0, 1, 2, 3, 4, 5, 6, 7, 8, -1, -1, -1, -1, -1, -1, -1];      // SOA as spec 9  channels - incoming channels possibli more than 9 use only first nine
    public static so2h1v = [0, 1, 2, 3, 4, 5, -1, 6, 7, -1, -1, -1, -1, -1, -1, -1];      //  8 channels incoming - insert silentce in to 5 - shift rest of channels higher                    Denna är Fel på OHTI nuvarande - Kanske
    public static so2H1P = [0, 1, 2, 3, 4, -1, -1, -1, 5, -1, -1, -1, -1, -1, -1, -1];      //  6   channels incoming - 0 - 5

    // Use Ambisonic first order decoder
    public static so1h1p = [0, 1, 2, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];     //  6   channels incoming use - 0 - 3

}



// Use so3h3p (AMB8) as default setting
// Use Ambisonic third order decoder
AudioRoute.so3h3p = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];         // (TOA) in 16 channels 
AudioRoute.so3h2p = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -1, -1, -1, -1, 15];        //  Straight routing as some channels are silent incoming
AudioRoute.so3h1p = [0, 1, 2, 3, 4, -1, -1, -1, 8, 9, -1, -1, -1, -1, -1, 15];       //   Straight routing as some channels are silent incoming

// Use Ambisonic second order decoder
AudioRoute.so2h2p = [0, 1, 2, 3, 4, 5, 6, 7, 8, -1, -1, -1, -1, -1, -1, -1];      // SOA as spec 9  channels - incoming channels possibli more than 9 use only first nine
AudioRoute.so2h1v = [0, 1, 2, 3, 4, 5, -1, 6, 7, -1, -1, -1, -1, -1, -1, -1];      //  8 channels incoming - insert silentce in to 5 - shift rest of channels higher                    Denna är Fel på OHTI nuvarande - Kanske
AudioRoute.so2H1P = [0, 1, 2, 3, 4, -1, -1, -1, 5, -1, -1, -1, -1, -1, -1, -1];      //  6   channels incoming - 0 - 5

// Use Ambisonic first order decoder
AudioRoute.so1h1p = [0, 1, 2, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];     //  6   channels incoming use - 0 - 3
